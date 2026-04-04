const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const supabase  = require("../helpers/supabaseHelper");

const upload = multer({ storage: multer.memoryStorage() });

/* ─── Storage upload helper ─── */
const uploadToStorage = async (bucket, path, buffer, mimetype) => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimetype, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/* ════════════════════════════════════
   ITEMS
════════════════════════════════════ */

router.get("/items", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const items = (data || []).map(r => ({
      id:           r.id,
      materialName: r.material_name || "",
      make:         r.make          || "",
      description:  r.description   || "",
      category:     r.category      || "",
      unit:         r.unit          || "",
      qty:          r.qty           || "",
      imageUrl:     r.image_url     || "",
    }));
    res.json({ items });
  } catch (err) {
    console.error("Items read error:", err.message);
    res.json({ items: [] });
  }
});

router.post("/items", upload.single("image"), async (req, res) => {
  try {
    const { materialName, make, description, category, unit, qty } = req.body;
    let image_url = "";
    if (req.file) {
      image_url = await uploadToStorage(
        "procurement-images",
        `items/${Date.now()}_${req.file.originalname}`,
        req.file.buffer, req.file.mimetype
      );
    }
    const { data, error } = await supabase.from("items").insert({
      material_name: materialName || "",
      make: make || "", description: description || "",
      category: category || "", unit: unit || "", qty: qty || "", image_url,
    }).select().single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Item add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/items/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { materialName, make, description, category, unit, qty } = req.body;
    let image_url = req.body.imageUrl || "";

    if (req.file) {
      // Delete old image if exists
      if (req.body.imageUrl) {
        const oldPath = req.body.imageUrl.split("/procurement-images/")[1]?.split("?")[0];
        if (oldPath) await supabase.storage.from("procurement-images").remove([oldPath]);
      }
      image_url = await uploadToStorage(
        "procurement-images",
        `items/${Date.now()}_${req.file.originalname}`,
        req.file.buffer, req.file.mimetype
      );
    }

    const { error } = await supabase.from("items").update({
      material_name: materialName || "", make: make || "",
      description: description || "", category: category || "",
      unit: unit || "", qty: qty || "", image_url,
    }).eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Item update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Get image URL before deleting
    const { data } = await supabase.from("items").select("image_url").eq("id", id).single();
    if (data?.image_url) {
      const path = data.image_url.split("/procurement-images/")[1]?.split("?")[0];
      if (path) await supabase.storage.from("procurement-images").remove([path]);
    }
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Item delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/items/bulk", async (req, res) => {
  try {
    const { rows } = req.body;
    const inserts = rows.map(r => ({
      material_name: r.materialName || "", make: r.make || "",
      description: r.description || "", category: r.category || "",
      unit: r.unit || "", qty: r.qty || "", image_url: "",
    }));
    const { error } = await supabase.from("items").insert(inserts);
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Bulk items error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   VENDORS
════════════════════════════════════ */

const vendorUpload = upload.fields([
  { name: "logo",       maxCount: 1 },
  { name: "docGst",     maxCount: 1 },
  { name: "docPan",     maxCount: 1 },
  { name: "docAadhaar", maxCount: 1 },
  { name: "docCoi",     maxCount: 1 },
  { name: "docMsme",    maxCount: 1 },
  { name: "docOther",   maxCount: 1 },
]);

const uploadVendorFile = async (files, key, folder) => {
  if (!files?.[key]) return null;
  const file = files[key][0];
  return await uploadToStorage(
    "vendor-docs",
    `${folder}/${key}_${Date.now()}_${file.originalname}`,
    file.buffer, file.mimetype
  );
};

router.get("/vendors", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("vendors").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    const vendors = (data || []).map(r => ({
      id:            r.id,
      vendorName:    r.vendor_name    || "",
      address:       r.address        || "",
      bankName:      r.bank_name      || "",
      accountNumber: r.account_number || "",
      ifscCode:      r.ifsc_code      || "",
      gstin:         r.gstin          || "",
      msmeNumber:    r.msme_number    || "",
      pan:           r.pan            || "",
      contactPerson: r.contact_person || "",
      mobile:        r.mobile         || "",
      email:         r.email          || "",
      logoUrl:       r.logo_url       || "",
      docGstUrl:     r.doc_gst_url    || "",
      docPanUrl:     r.doc_pan_url    || "",
      docAadhaarUrl: r.doc_aadhaar_url|| "",
      docCoiUrl:     r.doc_coi_url    || "",
      docMsmeUrl:    r.doc_msme_url   || "",
      docOtherUrl:   r.doc_other_url  || "",
    }));
    res.json({ vendors });
  } catch (err) {
    console.error("Vendors read error:", err.message);
    res.json({ vendors: [] });
  }
});

router.post("/vendors", vendorUpload, async (req, res) => {
  try {
    const b = req.body;
    const files = req.files || {};
    const folder = b.vendorName || "vendor";

    const [logoUrl, docGstUrl, docPanUrl, docAadhaarUrl, docCoiUrl, docMsmeUrl, docOtherUrl] = await Promise.all([
      uploadVendorFile(files, "logo",       folder),
      uploadVendorFile(files, "docGst",     folder),
      uploadVendorFile(files, "docPan",     folder),
      uploadVendorFile(files, "docAadhaar", folder),
      uploadVendorFile(files, "docCoi",     folder),
      uploadVendorFile(files, "docMsme",    folder),
      uploadVendorFile(files, "docOther",   folder),
    ]);

    const { data, error } = await supabase.from("vendors").insert({
      vendor_name:    b.vendorName    || "",
      address:        b.address       || "",
      bank_name:      b.bankName      || "",
      account_number: b.accountNumber || "",
      ifsc_code:      b.ifscCode      || "",
      gstin:          b.gstin         || "",
      msme_number:    b.msmeNumber    || "",
      pan:            b.pan           || "",
      contact_person: b.contactPerson || "",
      mobile:         b.mobile        || "",
      email:          b.email         || "",
      logo_url:       logoUrl         || "",
      doc_gst_url:    docGstUrl       || "",
      doc_pan_url:    docPanUrl       || "",
      doc_aadhaar_url:docAadhaarUrl   || "",
      doc_coi_url:    docCoiUrl       || "",
      doc_msme_url:   docMsmeUrl      || "",
      doc_other_url:  docOtherUrl     || "",
    }).select().single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Vendor add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/vendors/:id", vendorUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const files = req.files || {};
    const folder = b.vendorName || "vendor";

    const [newLogo, newDocGst, newDocPan, newDocAadhaar, newDocCoi, newDocMsme, newDocOther] = await Promise.all([
      uploadVendorFile(files, "logo",       folder),
      uploadVendorFile(files, "docGst",     folder),
      uploadVendorFile(files, "docPan",     folder),
      uploadVendorFile(files, "docAadhaar", folder),
      uploadVendorFile(files, "docCoi",     folder),
      uploadVendorFile(files, "docMsme",    folder),
      uploadVendorFile(files, "docOther",   folder),
    ]);

    const { error } = await supabase.from("vendors").update({
      vendor_name:    b.vendorName    || "",
      address:        b.address       || "",
      bank_name:      b.bankName      || "",
      account_number: b.accountNumber || "",
      ifsc_code:      b.ifscCode      || "",
      gstin:          b.gstin         || "",
      msme_number:    b.msmeNumber    || "",
      pan:            b.pan           || "",
      contact_person: b.contactPerson || "",
      mobile:         b.mobile        || "",
      email:          b.email         || "",
      logo_url:        newLogo        || b.logoUrl        || "",
      doc_gst_url:     newDocGst      || b.docGstUrl      || "",
      doc_pan_url:     newDocPan      || b.docPanUrl      || "",
      doc_aadhaar_url: newDocAadhaar  || b.docAadhaarUrl  || "",
      doc_coi_url:     newDocCoi      || b.docCoiUrl      || "",
      doc_msme_url:    newDocMsme     || b.docMsmeUrl     || "",
      doc_other_url:   newDocOther    || b.docOtherUrl    || "",
    }).eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Vendor update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/vendors/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("vendors").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Vendor delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   SITES
════════════════════════════════════ */

router.get("/sites", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("sites").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    const sites = (data || []).map(r => ({
      id:             r.id,
      siteName:       r.site_name       || "",
      siteCode:       r.site_code       || "",
      city:           r.city            || "",
      state:          r.state           || "",
      billingAddress: r.billing_address || "",
      siteAddress:    r.site_address    || "",
    }));
    res.json({ sites });
  } catch (err) {
    console.error("Sites read error:", err.message);
    res.json({ sites: [] });
  }
});

router.post("/sites", async (req, res) => {
  try {
    const { siteName, siteCode, city, state, billingAddress, siteAddress } = req.body;
    const { data, error } = await supabase.from("sites").insert({
      site_name: siteName || "", site_code: siteCode || "",
      city: city || "", state: state || "",
      billing_address: billingAddress || "", site_address: siteAddress || "",
    }).select().single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Site add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/sites/:id", async (req, res) => {
  try {
    const { siteName, siteCode, city, state, billingAddress, siteAddress } = req.body;
    const { error } = await supabase.from("sites").update({
      site_name: siteName || "", site_code: siteCode || "",
      city: city || "", state: state || "",
      billing_address: billingAddress || "", site_address: siteAddress || "",
    }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Site update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/sites/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("sites").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Site delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/sites/bulk", async (req, res) => {
  try {
    const { rows } = req.body;
    const inserts = rows.map(r => ({
      site_name: r.siteName || "", site_code: r.siteCode || "",
      city: r.city || "", state: r.state || "",
      billing_address: r.billingAddress || "", site_address: r.siteAddress || "",
    }));
    const { error } = await supabase.from("sites").insert(inserts);
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Bulk sites error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   UOM
════════════════════════════════════ */

router.get("/uom", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("uom").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    const uoms = (data || []).map(r => ({
      id:      r.id,
      uomName: r.uom_name || "",
      uomCode: r.uom_code || "",
    }));
    res.json({ uoms });
  } catch (err) {
    console.error("UOM read error:", err.message);
    res.json({ uoms: [] });
  }
});

router.post("/uom", async (req, res) => {
  try {
    const { uomName, uomCode } = req.body;
    const { data, error } = await supabase.from("uom")
      .insert({ uom_name: uomName || "", uom_code: uomCode || "" })
      .select().single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("UOM add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/uom/:id", async (req, res) => {
  try {
    const { uomName, uomCode } = req.body;
    const { error } = await supabase.from("uom")
      .update({ uom_name: uomName || "", uom_code: uomCode || "" })
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("UOM update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/uom/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("uom").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("UOM delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/uom/bulk", async (req, res) => {
  try {
    const { rows } = req.body;
    const inserts = rows.map(r => ({ uom_name: r.uomName || "", uom_code: r.uomCode || "" }));
    const { error } = await supabase.from("uom").insert(inserts);
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Bulk UOM error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   COMPANIES
════════════════════════════════════ */

const companyUpload = upload.fields([
  { name: "logo",  maxCount: 1 },
  { name: "stamp", maxCount: 1 },
  { name: "sign",  maxCount: 1 },
]);

const uploadCompanyImg = async (files, key, folder) => {
  if (!files?.[key]) return null;
  const file = files[key][0];
  return await uploadToStorage(
    "procurement-images",
    `companies/${folder}/${key}_${Date.now()}_${file.originalname}`,
    file.buffer, file.mimetype
  );
};

router.get("/companies", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("companies").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    const companies = (data || []).map(r => ({
      id:          r.id,
      companyName: r.company_name || "",
      companyCode: r.company_code || "",
      phone:       r.phone        || "",
      email:       r.email        || "",
      gstin:       r.gstin        || "",
      pan:         r.pan          || "",
      pincode:     r.pincode      || "",
      state:       r.state        || "",
      district:    r.district     || "",
      address:     r.address      || "",
      logoUrl:     r.logo_url     || "",
      stampUrl:    r.stamp_url    || "",
      signUrl:     r.sign_url     || "",
    }));
    res.json({ companies });
  } catch (err) {
    console.error("Companies read error:", err.message);
    res.json({ companies: [] });
  }
});

router.post("/companies", companyUpload, async (req, res) => {
  try {
    const b = req.body;
    const files = req.files || {};
    const folder = b.companyCode || b.companyName || "company";

    const [logoUrl, stampUrl, signUrl] = await Promise.all([
      uploadCompanyImg(files, "logo",  folder),
      uploadCompanyImg(files, "stamp", folder),
      uploadCompanyImg(files, "sign",  folder),
    ]);

    const { data, error } = await supabase.from("companies").insert({
      company_name: b.companyName || "", company_code: b.companyCode || "",
      phone: b.phone || "", email: b.email || "",
      gstin: b.gstin || "", pan: b.pan || "",
      pincode: b.pincode || "", state: b.state || "",
      district: b.district || "", address: b.address || "",
      logo_url:  logoUrl  || "",
      stamp_url: stampUrl || "",
      sign_url:  signUrl  || "",
    }).select().single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Company add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/companies/:id", companyUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const files = req.files || {};
    const folder = b.companyCode || b.companyName || "company";

    const [newLogo, newStamp, newSign] = await Promise.all([
      uploadCompanyImg(files, "logo",  folder),
      uploadCompanyImg(files, "stamp", folder),
      uploadCompanyImg(files, "sign",  folder),
    ]);

    const { error } = await supabase.from("companies").update({
      company_name: b.companyName || "", company_code: b.companyCode || "",
      phone: b.phone || "", email: b.email || "",
      gstin: b.gstin || "", pan: b.pan || "",
      pincode: b.pincode || "", state: b.state || "",
      district: b.district || "", address: b.address || "",
      logo_url:  newLogo  || b.logoUrl  || "",
      stamp_url: newStamp || b.stampUrl || "",
      sign_url:  newSign  || b.signUrl  || "",
    }).eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Company update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/companies/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("companies").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Company delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
