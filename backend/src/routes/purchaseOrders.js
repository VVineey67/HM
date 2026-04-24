const crypto = require("crypto");
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const supabase = require("../helpers/supabaseHelper");

const upload = multer({ storage: multer.memoryStorage() });

const normalizeNbsp = (value) =>
  typeof value === "string"
    ? value.replace(/&nbsp;|&#160;|\u00A0/g, " ")
    : value;

const sanitizeRichTextDeep = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeRichTextDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeRichTextDeep(val)]));
  }
  return normalizeNbsp(value);
};

/* ─── Storage upload helper ─── */
const uploadToStorage = async (bucket, path, buffer, mimetype) => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimetype, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/* ─── Helper: Get Current Financial Year ─── */
const getFinancialYear = (date = new Date()) => {
  const month = date.getMonth(); // 0-indexed
  const year  = date.getFullYear();
  const fyStart = month >= 3 ? year : year - 1;
  // Format: 2024-25 for FY 2024-25
  return `${fyStart}-${String(fyStart + 1).slice(-2)}`;
};

/* ════════════════════════════════════
   ORDER NUMBER GENERATION
   ════════════════════════════════════ */
router.get("/next-number", async (req, res) => {
  try {
    const { siteId, companyCode, orderType } = req.query;
    if (!siteId || !companyCode || !orderType) {
      return res.status(400).json({ error: "siteId, companyCode, and orderType required" });
    }

    const typeCode = orderType === "Supply" ? "PO" : "WO";
    const fy       = getFinancialYear();

    // 1. Get Site Code
    const { data: site } = await supabase.schema("procurement").from("sites").select("site_code").eq("id", siteId).single();
    const sCode = site?.site_code || "SITE";

    // 2. Get serialization settings for this site
    let { data: settings } = await supabase.schema("procurement").from("serialization_settings").select("*").eq("site_id", siteId).single();

    if (!settings || settings.financial_year !== fy) {
      // Reset or initialize for new FY
      const newSettings = { site_id: siteId, current_number: 1, financial_year: fy };
      const { data: created } = await supabase.schema("procurement").from("serialization_settings").upsert(newSettings).select().single();
      settings = created;
    }

    const num = String(settings.current_number).padStart(3, "0");
    const orderNumber = `${companyCode}/${sCode}/${typeCode}/${fy}/${num}`;

    res.json({ orderNumber, nextSerial: settings.current_number + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   ORDER SERIALIZATION CONFIG (Admin)
   ════════════════════════════════════ */

router.get("/serialization", async (req, res) => {
  try {
    const { data, error } = await supabase.schema("procurement")
      .from("serialization_settings").select("*, sites(site_name, site_code)");
    if (error) throw error;
    res.json({ configs: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/serialization", async (req, res) => {
  try {
    const { site_id, current_number, financial_year } = req.body;
    if (!site_id || !financial_year) return res.status(400).json({ error: "site_id and financial_year required" });

    // UPSERT
    const { error } = await supabase.schema("procurement")
      .from("serialization_settings")
      .upsert({ site_id, current_number, financial_year }, { onConflict: "site_id,financial_year" });
      
    if (error) {
      // If unique constraint isn't set, try updating by looking up first
      const { data: existing } = await supabase.schema("procurement").from("serialization_settings")
        .select("id").eq("site_id", site_id).eq("financial_year", financial_year).single();
      
      if (existing) {
        await supabase.schema("procurement").from("serialization_settings").update({ current_number }).eq("id", existing.id);
      } else {
        await supabase.schema("procurement").from("serialization_settings").insert({ site_id, financial_year, current_number });
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   PURCHASE ORDERS CRUD
   ════════════════════════════════════ */

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.schema("procurement")
      .from("purchase_orders")
      .select("*, companies(*), sites(*), vendors(*)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Supabase Error fetching orders:", error);
      throw error;
    }
    console.log(`Fetched ${data?.length || 0} orders from DB`);
    res.json({ orders: sanitizeRichTextDeep(data || []) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", upload.fields([
  { name: "quotation", maxCount: 1 },
  { name: "comparative", maxCount: 1 }
]), async (req, res) => {
  try {
    const bodyData = JSON.parse(req.body.data || "{}");
    const files    = req.files || {};
    let { mainData, items, nextSerial } = bodyData;
    mainData = sanitizeRichTextDeep(mainData || {});
    items = sanitizeRichTextDeep(items || []);

    // 1. Handle File Uploads
    let quotationUrl = "";
    let comparativeUrl = "";

    if (files.quotation) {
      quotationUrl = await uploadToStorage(
        "procurement-docs",
        `orders/${mainData.order_number}/quotation_${Date.now()}_${files.quotation[0].originalname}`,
        files.quotation[0].buffer, files.quotation[0].mimetype
      );
    }
    if (files.comparative) {
      comparativeUrl = await uploadToStorage(
        "procurement-docs",
        `orders/${mainData.order_number}/comparative_${Date.now()}_${files.comparative[0].originalname}`,
        files.comparative[0].buffer, files.comparative[0].mimetype
      );
    }

    // 1.1 Override order_number to DRAFT if not Issued
    // The official number is now assigned in approvals.js ONLY when Issued.
    if (mainData.status !== 'Issued') {
       mainData.order_number = `PENDING-${Date.now()}`;
    }

    // 2. Insert main order
    const { data: order, error: orderErr } = await supabase.schema("procurement")
      .from("purchase_orders")
      .insert({
        ...mainData,
        quotation_url: quotationUrl,
        comparative_sheet_url: comparativeUrl
      })
      .select().single();

    if (orderErr) throw orderErr;

    // 3. Insert items
    if (items && items.length > 0) {
      const itemInserts = items.map(it => ({ ...it, order_id: order.id }));
      const { error: itemErr } = await supabase.schema("procurement").from("purchase_order_items").insert(itemInserts);
      if (itemErr) throw itemErr;
    }

    // 4. Update serialization ONLY if Issued (usually not from here anymore)
    if (mainData.status === 'Issued') {
      await supabase.schema("procurement").from("serialization_settings")
        .update({ current_number: nextSerial })
        .eq("site_id", mainData.site_id);
    }

    res.json({ success: true, id: order.id });
  } catch (err) {
    console.error("Order save error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data: order, error: orderErr } = await supabase.schema("procurement")
      .from("purchase_orders")
      .select("*, sites(*), companies(*), vendors(*), contact_person:contacts(*)")
      .eq("id", req.params.id)
      .single();
    if (orderErr) throw orderErr;

    const { data: items, error: itemErr } = await supabase.schema("procurement")
      .from("purchase_order_items")
      .select("*, items(*)")
      .eq("order_id", req.params.id);
    if (itemErr) throw itemErr;

    res.json({ order: sanitizeRichTextDeep(order), items: sanitizeRichTextDeep(items || []) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   BULK IMPORT — rich schema, grouped by order number
   ════════════════════════════════════ */
router.post("/bulk-import", async (req, res) => {
  try {
    const { rows, orderKind, createdBy } = req.body; // orderKind: "Purchase Order" | "Work Order"
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }

    // Preload masters
    const [{ data: companies }, { data: sites }, { data: vendors }] = await Promise.all([
      supabase.schema("procurement").from("companies").select("*"),
      supabase.schema("procurement").from("sites").select("*"),
      supabase.schema("procurement").from("vendors").select("*"),
    ]);
    const companyByCode = new Map((companies || []).map(c => [String(c.company_code || "").toUpperCase().trim(), c]));
    const siteByCode    = new Map((sites || []).map(s => [String(s.site_code || "").toUpperCase().trim(), s]));
    const vendorByName  = new Map((vendors || []).map(v => [String(v.vendor_name || "").toLowerCase().trim(), v]));

    const fy = getFinancialYear();
    const pick = (obj, keys) => { for (const k of keys) { const v = obj[k]; if (v !== undefined && v !== null && String(v).trim() !== "") return v; } return ""; };
    const parseDate = (v) => {
      if (!v) return null;
      if (typeof v === 'number') {
        const d = new Date(Math.round((v - 25569) * 86400 * 1000));
        return isNaN(d) ? null : d.toISOString();
      }
      const d = new Date(v);
      return isNaN(d) ? null : d.toISOString();
    };
    const num = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

    // Group rows by order key (PO/WO number, or row index fallback)
    const groups = new Map();
    rows.forEach((r, i) => {
      const rowNo = i + 2;
      const key = String(pick(r, ["Purchase Order No.", "Work Order No.", "Order No", "Order Number"]) || `__row_${i}`).trim();
      if (!groups.has(key)) groups.set(key, { key, headRow: r, headRowNo: rowNo, items: [] });
      groups.get(key).items.push({ r, rowNo });
    });

    const results = { inserted: 0, failed: [], orders: [] };

    for (const group of groups.values()) {
      const h = group.headRow;
      const headRowNo = group.headRowNo;
      try {
        const compCode = String(pick(h, ["Company Code"])).toUpperCase().trim();
        const siteCode = String(pick(h, ["Site Code"])).toUpperCase().trim();
        const vendName = String(pick(h, ["Vendor Name"])).trim();

        const company = companyByCode.get(compCode);
        const site = siteByCode.get(siteCode);
        const vendorMaster = vendorByName.get(vendName.toLowerCase());

        if (!site) throw new Error(`Site code "${siteCode}" not found in master`);
        if (!company) throw new Error(`Company code "${compCode}" not found in master`);
        if (!vendorMaster && !vendName) throw new Error(`Vendor Name is required`);

        // Determine order type
        const excelOrderType = String(pick(h, ["Order Type"])).trim();
        let orderType = excelOrderType;
        if (!orderType) orderType = orderKind === "Work Order" ? "SITC" : "Supply";

        // Status — default Issued, but respect Excel value
        const validStatuses = ["Draft", "Review", "Pending Issue", "Issued", "Rejected", "Reverted", "Recalled", "Cancelled"];
        const excelStatus = String(pick(h, ["Status"])).trim();
        const status = validStatuses.find(s => s.toLowerCase() === excelStatus.toLowerCase()) || "Issued";

        // Order number — use Excel value if provided, else assign serial (for Issued only)
        let orderNumber = String(group.key || "").trim();
        let incrementSerial = false;
        let serialObj = null;
        if (!orderNumber || orderNumber.startsWith("__row_")) {
          if (status === "Issued") {
            const { data: s } = await supabase.schema("procurement")
              .from("serialization_settings").select("*")
              .eq("site_id", site.id).eq("financial_year", fy).single();
            serialObj = s;
            if (!serialObj) {
              const { data: created } = await supabase.schema("procurement")
                .from("serialization_settings")
                .insert({ site_id: site.id, financial_year: fy, current_number: 1 })
                .select().single();
              serialObj = created;
            }
            const typeCode = orderType === "Supply" ? "PO" : "WO";
            orderNumber = `${company.company_code}/${site.site_code}/${typeCode}/${fy}/${String(serialObj.current_number).padStart(3, '0')}`;
            incrementSerial = true;
          } else {
            orderNumber = `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          }
        }

        // Build vendor object — excel values override master, master fills gaps
        const vendorSnap = {
          vendorName: vendName || vendorMaster?.vendor_name || "",
          gstin:          pick(h, ["Vendor GSTIN"])          || vendorMaster?.gstin          || "",
          pan:            pick(h, ["Vendor PAN"])            || vendorMaster?.pan            || "",
          aadhar:         pick(h, ["Vendor Aadhar"])         || vendorMaster?.aadhar         || "",
          msme:           pick(h, ["Vendor MSME No"])        || vendorMaster?.msme           || "",
          contactPerson:  pick(h, ["Vendor Contact Name"])   || vendorMaster?.contact_person || "",
          mobile:         pick(h, ["Vendor Phone"])          || vendorMaster?.mobile         || "",
          email:          pick(h, ["Vendor Email"])          || vendorMaster?.email          || "",
          address:        pick(h, ["Vendor Address"])        || vendorMaster?.address        || "",
          bankName:       pick(h, ["Vendor Bank Name", "Bank Name"])     || vendorMaster?.bank_name       || "",
          ifscCode:       pick(h, ["Vendor IFSC Code", "IFSC Code"])     || vendorMaster?.ifsc_code       || "",
          accountNumber:  pick(h, ["Vendor Account No", "Account No"])   || vendorMaster?.account_number  || "",
          beneficiaryName: pick(h, ["Vendor Beneficiary Name", "Beneficiary Name"]) || vendorMaster?.beneficiary_name || vendorMaster?.vendor_name || "",
        };

        // Build company snapshot — excel overrides, master fills
        const companySnap = {
          companyCode:  company.company_code,
          companyName:  pick(h, ["Company Name"])   || company.company_name || "",
          gstin:        pick(h, ["Company GSTIN"])  || company.gstin        || "",
          pan:          pick(h, ["Company PAN", "Company Pan"]) || company.pan || "",
          phone:        pick(h, ["Company Phone"])  || company.phone        || "",
          address:      company.address || "",
          logo_url:     company.logo_url || "",
          stamp_url:    company.stamp_url || "",
          sign_url:     company.sign_url || "",
          personName:   company.person_name || "",
          designation:  company.designation || "",
        };

        // Build site snapshot
        const siteSnap = {
          siteCode: site.site_code,
          siteName: site.site_name || "",
          city: site.city || "",
          state: site.state || "",
          siteAddress: site.site_address || "",
          billingAddress: site.billing_address || "",
        };

        // Parse description: multi-line cell (Alt+Enter) or ||| separator → array of points
        const descToPoints = (v) => {
          if (!v) return [];
          let s = String(v).trim();
          if (!s) return [];
          if (s.startsWith('[')) {
            try { const arr = JSON.parse(s); return Array.isArray(arr) ? arr : [s]; } catch { return [s]; }
          }
          return s.split(/\r?\n|\|\|\|/).map(x => x.trim()).filter(Boolean);
        };
        const pointsToStorage = (points) => {
          if (!points || points.length === 0) return "";
          if (points.length === 1) return points[0];
          return JSON.stringify(points);
        };
        const parseDescription = (v) => pointsToStorage(descToPoints(v));

        // Build raw items (one per Excel row)
        const rawItems = group.items.map(({ r }) => ({
          material_name: String(pick(r, ["Item Name"])).trim(),
          _descPoints:   descToPoints(pick(r, ["Description", "Specification"])),
          model_number:  String(pick(r, ["Model No", "Model Number"])).trim(),
          make:          String(pick(r, ["Brand Name", "Brand"])).trim(),
          unit:          String(pick(r, ["Unit"])).trim() || "nos",
          qty:           num(pick(r, ["Quantity", "Qty"])),
          unit_rate:     num(pick(r, ["Unit Price (₹)", "Unit Price", "Rate"])),
          tax_pct:       num(pick(r, ["Tax (%)", "Tax%", "Tax Pct"])),
          discount_pct:  num(pick(r, ["Discount (%)", "Discount%", "Discount Pct"])),
          amount:        num(pick(r, ["Amount"])) || (num(pick(r, ["Quantity", "Qty"])) * num(pick(r, ["Unit Price (₹)", "Unit Price", "Rate"]))),
          remarks:       String(pick(r, ["Remarks"])).trim(),
        })).filter(it => it.material_name || it.qty > 0);

        // Consolidate: consecutive rows with same (Item Name + Unit) AND blank qty → merge as additional description points
        const consolidated = [];
        for (const raw of rawItems) {
          const last = consolidated[consolidated.length - 1];
          const isContinuation = last
            && last.material_name.toLowerCase() === raw.material_name.toLowerCase()
            && last.unit.toLowerCase() === raw.unit.toLowerCase()
            && raw.material_name
            && (!raw.qty || raw.qty === 0);

          if (isContinuation) {
            last._descPoints = [...last._descPoints, ...raw._descPoints];
            if (!last.model_number && raw.model_number) last.model_number = raw.model_number;
            if (!last.make && raw.make) last.make = raw.make;
            if (!last.remarks && raw.remarks) last.remarks = raw.remarks;
          } else {
            consolidated.push(raw);
          }
        }

        // Final items — strip temp fields, flatten points to storage format
        const itemRows = consolidated.map(it => ({
          material_name: it.material_name,
          description:   pointsToStorage(it._descPoints),
          model_number:  it.model_number,
          make:          it.make,
          unit:          it.unit,
          qty:           it.qty,
          unit_rate:     it.unit_rate,
          tax_pct:       it.tax_pct,
          discount_pct:  it.discount_pct,
          amount:        it.amount,
          remarks:       it.remarks,
        }));

        // Totals
        const subtotal   = itemRows.reduce((s, it) => s + (it.qty * it.unit_rate), 0);
        const discAmt    = itemRows.reduce((s, it) => s + (it.qty * it.unit_rate * (it.discount_pct || 0) / 100), 0);
        const itemGst    = itemRows.reduce((s, it) => {
          const net = (it.qty * it.unit_rate) * (1 - (it.discount_pct || 0) / 100);
          return s + (net * (it.tax_pct || 0) / 100);
        }, 0);
        const fright     = num(pick(h, ["Fright", "Freight"]));
        const totalTax   = num(pick(h, ["Total Tax", "Total Tax (₹)"])) || itemGst;
        const grandTotal = num(pick(h, ["Total Amount", "Total Amount (₹)", "Grand Total"])) || (subtotal - discAmt + fright + totalTax);

        const issuedAt = parseDate(pick(h, ["Issued At", "Issued Date"])) || (status === "Issued" ? new Date().toISOString() : null);

        const totals = {
          subtotal,
          totalDiscountAmt: discAmt,
          discount_mode: "line",
          gst: totalTax,
          frightCharges: fright,
          grandTotal,
          showModel: itemRows.some(it => it.model_number),
          showBrand: itemRows.some(it => it.make),
          showRemarks: itemRows.some(it => it.remarks),
          issuedAt,
          bulkImported: true,
        };

        const arrify = (v) => {
          if (!v) return [];
          const s = String(v).trim();
          if (!s) return [];
          // split on newlines or semicolons
          return s.split(/\r?\n|;/).map(x => x.trim()).filter(Boolean);
        };

        const insertRow = {
          order_number: orderNumber,
          order_type: orderType,
          status,
          subject:       String(pick(h, ["Subject"])).trim(),
          ref_number:    String(pick(h, ["Reference Number", "Ref No"])).trim() || null,
          company_id:    company.id,
          site_id:       site.id,
          vendor_id:     vendorMaster?.id || null,
          made_by:       String(pick(h, ["Created By"]) || createdBy || "Bulk Import").trim(),
          request_by:    String(pick(h, ["Requisition By"])).trim() || null,
          date_of_creation: parseDate(pick(h, ["Created On", "Created Date", "Order Date"])) || new Date().toISOString(),
          notes:         String(pick(h, ["Order Notes"])).trim() || null,
          terms_conditions: arrify(pick(h, ["Term Condition", "Terms & Conditions"])),
          payment_terms:    arrify(pick(h, ["Payment Terms"])),
          governing_laws:   arrify(pick(h, ["Governlaws", "Governing Laws"])),
          annexures:        arrify(pick(h, ["Annexure", "Annexures"])),
          totals,
          // FREEZE snapshot at import time so later master edits don't affect this order
          snapshot: {
            company: companySnap,
            site: siteSnap,
            vendor: vendorSnap,
            contacts: [],
          },
        };

        const { data: inserted, error: insErr } = await supabase.schema("procurement")
          .from("purchase_orders").insert(insertRow).select().single();
        if (insErr) throw insErr;

        if (itemRows.length > 0) {
          const itemInserts = itemRows.map(it => ({ ...it, order_id: inserted.id }));
          const { error: itmErr } = await supabase.schema("procurement")
            .from("purchase_order_items").insert(itemInserts);
          if (itmErr) throw itmErr;
        }

        if (incrementSerial && serialObj) {
          await supabase.schema("procurement")
            .from("serialization_settings")
            .update({ current_number: serialObj.current_number + 1 })
            .eq("id", serialObj.id);
        }

        results.inserted++;
        results.orders.push({ id: inserted.id, order_number: orderNumber, status });
      } catch (grpErr) {
        results.failed.push({ row: headRowNo, orderKey: group.key, reason: grpErr.message });
      }
    }

    res.json({ success: true, ordersInExcel: groups.size, ...results });
  } catch (err) {
    console.error("Bulk import error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", upload.fields([
  { name: "quotation", maxCount: 1 },
  { name: "comparative", maxCount: 1 }
]), async (req, res) => {
  try {
    const bodyData = JSON.parse(req.body.data || "{}");
    const files    = req.files || {};
    let { mainData, items } = bodyData;
    mainData = sanitizeRichTextDeep(mainData || {});
    items = sanitizeRichTextDeep(items || []);

    // Fetch existing urls
    const { data: existing } = await supabase.schema("procurement")
      .from("purchase_orders").select("quotation_url, comparative_sheet_url")
      .eq("id", req.params.id).single();

    let quotationUrl    = existing?.quotation_url    || "";
    let comparativeUrl  = existing?.comparative_sheet_url || "";

    if (files.quotation) {
      quotationUrl = await uploadToStorage(
        "procurement-docs",
        `orders/${mainData.order_number}/quotation_${Date.now()}_${files.quotation[0].originalname}`,
        files.quotation[0].buffer, files.quotation[0].mimetype
      );
    }
    if (files.comparative) {
      comparativeUrl = await uploadToStorage(
        "procurement-docs",
        `orders/${mainData.order_number}/comparative_${Date.now()}_${files.comparative[0].originalname}`,
        files.comparative[0].buffer, files.comparative[0].mimetype
      );
    }

    // 2.1 Override order_number to DRAFT if not Issued (prevent premature numbering on Edit)
    if (mainData.status !== 'Issued' && !mainData.order_number?.startsWith("PENDING-")) {
        // Find existing order number to see if it was already PENDING
        const { data: curr } = await supabase.schema("procurement")
          .from("purchase_orders").select("order_number").eq("id", req.params.id).single();

        if (!curr?.order_number?.startsWith("PENDING-")) {
          mainData.order_number = `PENDING-${Date.now()}`;
        } else {
          mainData.order_number = curr.order_number; // Preserve existing pending ID
        }
    }

    // 2.2 Assign final order number when status → Issued and current number is PENDING-
    if (mainData.status === 'Issued') {
      // Stamp issuedAt into totals JSON for display
      mainData.totals = { ...(mainData.totals || {}), issuedAt: new Date().toISOString() };

      const { data: curr } = await supabase.schema("procurement")
        .from("purchase_orders")
        .select("order_number, order_type, site_id, sites(site_code), companies(company_code)")
        .eq("id", req.params.id)
        .single();

      const needsNumber = curr && (!mainData.order_number || mainData.order_number.startsWith("PENDING-") || curr.order_number?.startsWith("PENDING-"));
      if (needsNumber && curr.site_id) {
        try {
          const fy = getFinancialYear();
          let { data: serialObj } = await supabase.schema("procurement")
            .from("serialization_settings")
            .select("*")
            .eq("site_id", curr.site_id)
            .eq("financial_year", fy)
            .single();

          if (!serialObj) {
            const { data: created } = await supabase.schema("procurement")
              .from("serialization_settings")
              .insert({ site_id: curr.site_id, financial_year: fy, current_number: 1 })
              .select()
              .single();
            serialObj = created;
          }

          if (serialObj) {
            const serialNum = serialObj.current_number;
            const typeCode  = (curr.order_type === 'Supply') ? 'PO' : 'WO';
            const compCode  = curr.companies?.company_code || 'CO';
            const siteCode  = curr.sites?.site_code || 'SITE';
            mainData.order_number = `${compCode}/${siteCode}/${typeCode}/${fy}/${String(serialNum).padStart(3, '0')}`;

            await supabase.schema("procurement")
              .from("serialization_settings")
              .update({ current_number: serialNum + 1 })
              .eq("id", serialObj.id);
          }
        } catch (numErr) {
          console.error("Number assignment failed:", numErr.message);
        }
      }
    }

    const { error: orderErr } = await supabase.schema("procurement")
      .from("purchase_orders")
      .update({ ...mainData, quotation_url: quotationUrl, comparative_sheet_url: comparativeUrl, updated_at: new Date().toISOString() })
      .eq("id", req.params.id);
    if (orderErr) throw orderErr;

    // Replace items ONLY if items array was provided in the request
    // (prevents accidental item wipe on status-only updates)
    if (Array.isArray(items)) {
      await supabase.schema("procurement").from("purchase_order_items").delete().eq("order_id", req.params.id);
      if (items.length > 0) {
        const itemInserts = items.map(it => ({ ...it, order_id: req.params.id }));
        const { error: itemErr } = await supabase.schema("procurement").from("purchase_order_items").insert(itemInserts);
        if (itemErr) throw itemErr;
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Order update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════
   PDF GENERATION (Puppeteer)
   ════════════════════════════════════ */
const { renderPdf } = require("../services/pdfService");
const { renderOrderHtml, renderHeaderTemplate, renderFooterTemplate, renderPreviewHeader } = require("../pdf/orderTemplate");

const loadOrderForRender = async (orderId) => {
  const [orderRes, itemRes] = await Promise.all([
    supabase.schema("procurement")
      .from("purchase_orders")
      .select("*, sites(*), companies(*), vendors(*), contact_person:contacts(*)")
      .eq("id", orderId)
      .single(),
    supabase.schema("procurement")
      .from("purchase_order_items")
      .select("*, items(*)")
      .eq("order_id", orderId),
  ]);
  if (orderRes.error) throw orderRes.error;
  if (itemRes.error) throw itemRes.error;
  const order = orderRes.data;
  const items = itemRes.data;

  const cleanOrder = sanitizeRichTextDeep(order);
  const cleanItems = sanitizeRichTextDeep(items || []).map((row) => ({
    ...row,
    material_name: row.material_name || row.items?.material_name,
  }));
  const comp = cleanOrder.companies || {};
  const vend = cleanOrder.vendors || {};
  const site = cleanOrder.sites || {};
  // Use contacts from snapshot (same as ViewOrder component)
  const finalContacts = cleanOrder.snapshot?.contacts || [];
  
  return { cleanOrder, cleanItems, comp, vend, site, contacts: finalContacts };
};

const previewHtmlCache = new Map();
const PREVIEW_CACHE_MAX = 50;

router.get("/:id/preview", async (req, res) => {
  try {
    const { cleanOrder, cleanItems, comp, vend, site, contacts } = await loadOrderForRender(req.params.id);

    const cacheKey = `${cleanOrder.id}__${cleanOrder.updated_at || cleanOrder.created_at || ""}`;
    let html = previewHtmlCache.get(cacheKey);

    if (!html) {
      const [logoDataUri, stampDataUri, signDataUri] = await Promise.all([
        fetchAsDataUri(comp.logo_url || comp.logoUrl),
        fetchAsDataUri(comp.stamp_url || comp.stampUrl),
        fetchAsDataUri(comp.sign_url || comp.signUrl),
      ]);
      const compWithImages = { ...comp, stampDataUri, signDataUri };
      html = renderOrderHtml(
        {
          order: cleanOrder,
          items: cleanItems,
          comp: compWithImages,
          vend,
          site,
          contacts,
          previewHeaderHtml: renderPreviewHeader(cleanOrder, comp, logoDataUri),
        },
        { preview: true }
      );
      if (previewHtmlCache.size >= PREVIEW_CACHE_MAX) previewHtmlCache.delete(previewHtmlCache.keys().next().value);
      previewHtmlCache.set(cacheKey, html);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=60");
    res.end(html);
  } catch (err) {
    console.error("PDF preview error:", err);
    res.status(500).send(`<pre>${err.message}</pre>`);
  }
});

const logoCache = new Map();
const LOGO_TTL_MS = 24 * 60 * 60 * 1000;

let sharp = null;
try { sharp = require("sharp"); } catch { console.warn("sharp not available — images embedded without compression"); }

const compressImage = async (buf) => {
  if (!sharp) return { buf, ct: "image/png" };
  try {
    const img = sharp(buf, { failOn: "none" });
    const meta = await img.metadata();
    const MAX = 500;
    if ((meta.width || 0) > MAX) img.resize({ width: MAX, withoutEnlargement: true });
    if (meta.hasAlpha) {
      const out = await img.png({ compressionLevel: 9, palette: true }).toBuffer();
      return { buf: out, ct: "image/png" };
    }
    const out = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return { buf: out, ct: "image/jpeg" };
  } catch (e) {
    console.warn("Image compress failed, using original:", e.message);
    return { buf, ct: "image/png" };
  }
};

const fetchAsDataUri = async (url) => {
  if (!url) return "";
  const cached = logoCache.get(url);
  if (cached && Date.now() - cached.t < LOGO_TTL_MS) return cached.v;
  try {
    const r = await fetch(url);
    if (!r.ok) return "";
    const rawBuf = Buffer.from(await r.arrayBuffer());
    const { buf, ct } = await compressImage(rawBuf);
    const v = `data:${ct};base64,${buf.toString("base64")}`;
    logoCache.set(url, { v, t: Date.now() });
    return v;
  } catch (e) {
    console.warn("Logo fetch failed:", e.message);
    return "";
  }
};

const pdfCache = new Map();
const PDF_CACHE_MAX = 50;

router.get("/:id/pdf", async (req, res) => {
  try {
    const { cleanOrder, cleanItems, comp, vend, site, contacts } = await loadOrderForRender(req.params.id);
    const [logoDataUri, stampDataUri, signDataUri] = await Promise.all([
      fetchAsDataUri(comp.logo_url || comp.logoUrl),
      fetchAsDataUri(comp.stamp_url || comp.stampUrl),
      fetchAsDataUri(comp.sign_url || comp.signUrl),
    ]);
    const compWithImages = { ...comp, stampDataUri, signDataUri };
    const html = renderOrderHtml({ order: cleanOrder, items: cleanItems, comp: compWithImages, vend, site, contacts });
    const headerTemplate = renderHeaderTemplate(cleanOrder, comp, logoDataUri);
    const footerTemplate = renderFooterTemplate(comp);
    const cacheKey = crypto
      .createHash("sha1")
      .update([
        cleanOrder.id,
        cleanOrder.updated_at || cleanOrder.created_at || "",
        html,
        headerTemplate,
        footerTemplate,
      ].join("__"))
      .digest("hex");

    let pdfBuffer = pdfCache.get(cacheKey);
    if (!pdfBuffer) {
      pdfBuffer = await renderPdf(html, {
        headerTemplate,
        footerTemplate,
      });
      if (pdfCache.size >= PDF_CACHE_MAX) pdfCache.delete(pdfCache.keys().next().value);
      pdfCache.set(cacheKey, pdfBuffer);
    }

    const disposition = req.query.download === "1" ? "attachment" : "inline";
    const filename = `${cleanOrder.order_number || "order"}.pdf`.replace(/[\/\\]/g, "_");

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await supabase.schema("procurement").from("purchase_order_items").delete().eq("order_id", req.params.id);
    const { error } = await supabase.schema("procurement").from("purchase_orders").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
