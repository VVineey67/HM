const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const graphHelper = require("../helpers/graphHelper");

const upload = multer({ storage: multer.memoryStorage() });

/* ─── Paths ─── */
const ITEMS_PATH   = "/Autox/Global/Procurement Setup/Items.xlsx";
const VENDORS_PATH = "/Autox/Global/Procurement Setup/Vendors.xlsx";
const SITES_PATH   = "/Autox/Global/Procurement Setup/Site-List.xlsx";

/* ─── Excel column definitions ─── */
// Items sheet columns (row index):
// 0:MaterialName 1:Make 2:Description 3:Category 4:Unit 5:Qty 6:ImageUrl

// Vendors sheet columns (row index):
// 0:VendorName 1:Address 2:BankName 3:AccountNumber 4:IFSCCode 5:GSTIN
// 6:MSMENumber 7:PAN 8:ContactPerson 9:Mobile 10:Email 11:LogoUrl
// 12:DocGst 13:DocPan 14:DocAadhaar 15:DocCoi 16:DocMsme 17:DocOther

/* ════════════════════════════════════
   ITEMS
════════════════════════════════════ */

// GET all items
router.get("/items", async (req, res) => {
  try {
    const rows = await graphHelper.readSheet(ITEMS_PATH, "Items");
    const items = (rows || []).slice(1).map(r => ({
      materialName: r[0] || "",
      make:         r[1] || "",
      description:  r[2] || "",
      category:     r[3] || "",
      unit:         r[4] || "",
      qty:          r[5] || "",
      imageUrl:     r[6] || "",
    }));
    res.json({ items });
  } catch (err) {
    console.error("Items read error:", err.message);
    res.json({ items: [] });
  }
});

// POST add item
router.post("/items", upload.single("image"), async (req, res) => {
  try {
    const { materialName, make, description, category, unit, qty } = req.body;
    let imageUrl = "";

    if (req.file) {
      const uploadPath = `/Autox/Global/Procurement Setup/Images/Items/${Date.now()}_${req.file.originalname}`;
      imageUrl = await graphHelper.uploadFile(uploadPath, req.file.buffer, req.file.mimetype);
    }

    const tableName = await graphHelper.getFirstTableName(ITEMS_PATH, "Items");
    await graphHelper.addRows(ITEMS_PATH, "Items", tableName, [[
      materialName || "", make || "", description || "",
      category || "", unit || "", qty || "", imageUrl,
    ]]);

    res.json({ success: true });
  } catch (err) {
    console.error("Item add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update item (by row index)
router.put("/items/:idx", upload.single("image"), async (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const { materialName, make, description, category, unit, qty } = req.body;
    let imageUrl = req.body.imageUrl || "";

    if (req.file) {
      const uploadPath = `/Autox/Global/Procurement Setup/Images/Items/${Date.now()}_${req.file.originalname}`;
      imageUrl = await graphHelper.uploadFile(uploadPath, req.file.buffer, req.file.mimetype);
    }

    const tableName = await graphHelper.getFirstTableName(ITEMS_PATH, "Items");
    const newRow = [materialName || "", make || "", description || "", category || "", unit || "", qty || "", imageUrl];
    await graphHelper.updateRow(ITEMS_PATH, "Items", tableName, idx, newRow);

    res.json({ success: true });
  } catch (err) {
    console.error("Item update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
router.delete("/items/:idx", async (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const tableName = await graphHelper.getFirstTableName(ITEMS_PATH, "Items");
    await graphHelper.deleteRow(ITEMS_PATH, "Items", tableName, idx);
    res.json({ success: true });
  } catch (err) {
    console.error("Item delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST bulk items
router.post("/items/bulk", async (req, res) => {
  try {
    const { rows } = req.body;
    const tableName = await graphHelper.getFirstTableName(ITEMS_PATH, "Items");
    const values = rows.map(r => [r.materialName || "", r.make || "", r.description || "", r.category || "", r.unit || "", r.qty || "", ""]);
    await graphHelper.addRows(ITEMS_PATH, "Items", tableName, values);
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
  if (!files || !files[key]) return "";
  const file = files[key][0];
  const path = `/Autox/Global/Procurement Setup/Images/Vendors/${folder}/${Date.now()}_${file.originalname}`;
  return await graphHelper.uploadFile(path, file.buffer, file.mimetype);
};

// GET all vendors
router.get("/vendors", async (req, res) => {
  try {
    const rows = await graphHelper.readSheet(VENDORS_PATH, "Vendors");
    const vendors = (rows || []).slice(1).map(r => ({
      vendorName:    r[0]  || "",
      address:       r[1]  || "",
      bankName:      r[2]  || "",
      accountNumber: r[3]  || "",
      ifscCode:      r[4]  || "",
      gstin:         r[5]  || "",
      msmeNumber:    r[6]  || "",
      pan:           r[7]  || "",
      contactPerson: r[8]  || "",
      mobile:        r[9]  || "",
      email:         r[10] || "",
      logoUrl:       r[11] || "",
      docGstUrl:     r[12] || "",
      docPanUrl:     r[13] || "",
      docAadhaarUrl: r[14] || "",
      docCoiUrl:     r[15] || "",
      docMsmeUrl:    r[16] || "",
      docOtherUrl:   r[17] || "",
    }));
    res.json({ vendors });
  } catch (err) {
    console.error("Vendors read error:", err.message);
    res.json({ vendors: [] });
  }
});

// POST add vendor
router.post("/vendors", vendorUpload, async (req, res) => {
  try {
    const b = req.body;
    const files = req.files || {};

    const [logoUrl, docGstUrl, docPanUrl, docAadhaarUrl, docCoiUrl, docMsmeUrl, docOtherUrl] = await Promise.all([
      uploadVendorFile(files, "logo",       b.vendorName || "vendor"),
      uploadVendorFile(files, "docGst",     b.vendorName || "vendor"),
      uploadVendorFile(files, "docPan",     b.vendorName || "vendor"),
      uploadVendorFile(files, "docAadhaar", b.vendorName || "vendor"),
      uploadVendorFile(files, "docCoi",     b.vendorName || "vendor"),
      uploadVendorFile(files, "docMsme",    b.vendorName || "vendor"),
      uploadVendorFile(files, "docOther",   b.vendorName || "vendor"),
    ]);

    const tableName = await graphHelper.getFirstTableName(VENDORS_PATH, "Vendors");
    await graphHelper.addRows(VENDORS_PATH, "Vendors", tableName, [[
      b.vendorName || "", b.address || "", b.bankName || "", b.accountNumber || "", b.ifscCode || "",
      b.gstin || "", b.msmeNumber || "", b.pan || "", b.contactPerson || "", b.mobile || "", b.email || "",
      logoUrl, docGstUrl, docPanUrl, docAadhaarUrl, docCoiUrl, docMsmeUrl, docOtherUrl,
    ]]);

    res.json({ success: true });
  } catch (err) {
    console.error("Vendor add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update vendor
router.put("/vendors/:idx", vendorUpload, async (req, res) => {
  try {
    const idx  = parseInt(req.params.idx);
    const b    = req.body;
    const files = req.files || {};

    const [logoUrl, docGstUrl, docPanUrl, docAadhaarUrl, docCoiUrl, docMsmeUrl, docOtherUrl] = await Promise.all([
      uploadVendorFile(files, "logo",       b.vendorName) || b.logoUrl     || "",
      uploadVendorFile(files, "docGst",     b.vendorName) || b.docGstUrl   || "",
      uploadVendorFile(files, "docPan",     b.vendorName) || b.docPanUrl   || "",
      uploadVendorFile(files, "docAadhaar", b.vendorName) || b.docAadhaarUrl || "",
      uploadVendorFile(files, "docCoi",     b.vendorName) || b.docCoiUrl   || "",
      uploadVendorFile(files, "docMsme",    b.vendorName) || b.docMsmeUrl  || "",
      uploadVendorFile(files, "docOther",   b.vendorName) || b.docOtherUrl || "",
    ]);

    const newRow = [
      b.vendorName || "", b.address || "", b.bankName || "", b.accountNumber || "", b.ifscCode || "",
      b.gstin || "", b.msmeNumber || "", b.pan || "", b.contactPerson || "", b.mobile || "", b.email || "",
      logoUrl, docGstUrl, docPanUrl, docAadhaarUrl, docCoiUrl, docMsmeUrl, docOtherUrl,
    ];

    const tableName = await graphHelper.getFirstTableName(VENDORS_PATH, "Vendors");
    await graphHelper.updateRow(VENDORS_PATH, "Vendors", tableName, idx, newRow);
    res.json({ success: true });
  } catch (err) {
    console.error("Vendor update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE vendor
router.delete("/vendors/:idx", async (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const tableName = await graphHelper.getFirstTableName(VENDORS_PATH, "Vendors");
    await graphHelper.deleteRow(VENDORS_PATH, "Vendors", tableName, idx);
    res.json({ success: true });
  } catch (err) {
    console.error("Vendor delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   SITES
════════════════════════════════════ */

// GET all sites
router.get("/sites", async (req, res) => {
  try {
    const rows = await graphHelper.readSheet(SITES_PATH, "Sheet1");
    const sites = (rows || []).slice(1).map(r => ({
      sNo:            r[0] || "",
      siteName:       r[1] || "",
      siteCode:       r[2] || "",
      city:           r[3] || "",
      state:          r[4] || "",
      billingAddress: r[5] || "",
      siteAddress:    r[6] || "",
    }));
    res.json({ sites });
  } catch (err) {
    console.error("Sites read error:", err.message);
    res.json({ sites: [] });
  }
});

// POST add site
router.post("/sites", async (req, res) => {
  try {
    const { siteName, siteCode, city, state, billingAddress, siteAddress } = req.body;
    const tableName = await graphHelper.getFirstTableName(SITES_PATH, "Sheet1");
    await graphHelper.addRows(SITES_PATH, "Sheet1", tableName, [[
      "", siteName || "", siteCode || "", city || "", state || "", billingAddress || "", siteAddress || "",
    ]]);
    res.json({ success: true });
  } catch (err) {
    console.error("Site add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update site (by row index)
router.put("/sites/:idx", async (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const { sNo, siteName, siteCode, city, state, billingAddress, siteAddress } = req.body;
    const tableName = await graphHelper.getFirstTableName(SITES_PATH, "Sheet1");
    await graphHelper.updateRow(SITES_PATH, "Sheet1", tableName, idx, [
      sNo || "", siteName || "", siteCode || "", city || "", state || "", billingAddress || "", siteAddress || "",
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Site update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST bulk sites
router.post("/sites/bulk", async (req, res) => {
  try {
    const { rows } = req.body;
    const tableName = await graphHelper.getFirstTableName(SITES_PATH, "Sheet1");
    const values = rows.map(r => [
      "", r.siteName || "", r.siteCode || "", r.city || "", r.state || "", r.billingAddress || "", r.siteAddress || "",
    ]);
    await graphHelper.addRows(SITES_PATH, "Sheet1", tableName, values);
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Bulk sites error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE site
router.delete("/sites/:idx", async (req, res) => {
  try {
    const idx = parseInt(req.params.idx);
    const tableName = await graphHelper.getFirstTableName(SITES_PATH, "Sheet1");
    await graphHelper.deleteRow(SITES_PATH, "Sheet1", tableName, idx);
    res.json({ success: true });
  } catch (err) {
    console.error("Site delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
