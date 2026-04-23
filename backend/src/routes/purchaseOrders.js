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

    const { error: orderErr } = await supabase.schema("procurement")
      .from("purchase_orders")
      .update({ ...mainData, quotation_url: quotationUrl, comparative_sheet_url: comparativeUrl, updated_at: new Date().toISOString() })
      .eq("id", req.params.id);
    if (orderErr) throw orderErr;

    // Replace items
    await supabase.schema("procurement").from("purchase_order_items").delete().eq("order_id", req.params.id);
    if (items && items.length > 0) {
      const itemInserts = items.map(it => ({ ...it, order_id: req.params.id }));
      const { error: itemErr } = await supabase.schema("procurement").from("purchase_order_items").insert(itemInserts);
      if (itemErr) throw itemErr;
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
  const { data: order, error: orderErr } = await supabase.schema("procurement")
    .from("purchase_orders")
    .select("*, sites(*), companies(*), vendors(*), contact_person:contacts(*)")
    .eq("id", orderId)
    .single();
  if (orderErr) throw orderErr;

  const { data: items, error: itemErr } = await supabase.schema("procurement")
    .from("purchase_order_items")
    .select("*, items(*)")
    .eq("order_id", orderId);
  if (itemErr) throw itemErr;

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

router.get("/:id/preview", async (req, res) => {
  try {
    const { cleanOrder, cleanItems, comp, vend, site, contacts } = await loadOrderForRender(req.params.id);
    const logoDataUri = await fetchAsDataUri(comp.logo_url || comp.logoUrl);
    const stampDataUri = await fetchAsDataUri(comp.stamp_url || comp.stampUrl);
    const signDataUri = await fetchAsDataUri(comp.sign_url || comp.signUrl);
    const compWithImages = { ...comp, stampDataUri, signDataUri };
    const html = renderOrderHtml(
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
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (err) {
    console.error("PDF preview error:", err);
    res.status(500).send(`<pre>${err.message}</pre>`);
  }
});

const logoCache = new Map();
const LOGO_TTL_MS = 60 * 60 * 1000;

const fetchAsDataUri = async (url) => {
  if (!url) return "";
  const cached = logoCache.get(url);
  if (cached && Date.now() - cached.t < LOGO_TTL_MS) return cached.v;
  try {
    const r = await fetch(url);
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await r.arrayBuffer());
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
    const stampDataUri = await fetchAsDataUri(comp.stamp_url || comp.stampUrl);
    const signDataUri = await fetchAsDataUri(comp.sign_url || comp.signUrl);
    const compWithImages = { ...comp, stampDataUri, signDataUri };
    const html = renderOrderHtml({ order: cleanOrder, items: cleanItems, comp: compWithImages, vend, site, contacts });
    const logoDataUri = await fetchAsDataUri(comp.logo_url || comp.logoUrl);
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
