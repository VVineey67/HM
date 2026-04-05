const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const supabase  = require("../helpers/supabaseHelper");

const upload = multer({ storage: multer.memoryStorage() });

/* ─── Upload project logo to Supabase Storage ─── */
const uploadLogo = async (files) => {
  if (!files?.logo) return null;
  const file = files.logo[0];
  const path = `projects/logo_${Date.now()}_${file.originalname}`;
  const { error } = await supabase.storage
    .from("procurement-images")
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from("procurement-images").getPublicUrl(path);
  return data.publicUrl;
};

/* ── GET all projects ── */
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const projects = (data || []).map(r => ({
      id:          r.id,
      projectName: r.project_name || "",
      projectCode: r.project_code || "",
      city:        r.city         || "",
      state:       r.state        || "",
      pincode:     r.pincode      || "",
      address:     r.address      || "",
      logoUrl:     r.logo_url     || "",
      isActive:    r.is_active !== false,
    }));
    res.json({ projects });
  } catch (err) {
    console.error("Projects read error:", err.message);
    res.json({ projects: [] });
  }
});

/* ── POST add project ── */
router.post("/", upload.fields([{ name: "logo", maxCount: 1 }]), async (req, res) => {
  try {
    const b = req.body;
    const logoUrl = await uploadLogo(req.files);
    const { data, error } = await supabase.from("projects").insert({
      project_name: b.projectName || "",
      project_code: b.projectCode || "",
      city:         b.city        || "",
      state:        b.state       || "",
      pincode:      b.pincode     || "",
      address:      b.address     || "",
      logo_url:     logoUrl       || "",
      is_active:    true,
    }).select().single();
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Project add error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── PUT update project ── */
router.put("/:id", upload.fields([{ name: "logo", maxCount: 1 }]), async (req, res) => {
  try {
    const b = req.body;
    const newLogo = await uploadLogo(req.files);
    const { error } = await supabase.from("projects").update({
      project_name: b.projectName || "",
      project_code: b.projectCode || "",
      city:         b.city        || "",
      state:        b.state       || "",
      pincode:      b.pincode     || "",
      address:      b.address     || "",
      logo_url:     newLogo || b.logoUrl || "",
    }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Project update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── PATCH toggle active/inactive ── */
router.patch("/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    const { error } = await supabase.from("projects")
      .update({ is_active: isActive })
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Project status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE project ── */
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("projects").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Project delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST bulk insert projects ── */
router.post("/bulk", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !rows.length) return res.status(400).json({ error: "No rows provided" });
    const inserts = rows.map(r => ({
      project_name: r.projectName || "",
      project_code: r.projectCode || "",
      city:         r.city        || "",
      state:        r.state       || "",
      pincode:      r.pincode     || "",
      address:      r.address     || "",
      logo_url:     "",
      is_active:    true,
    }));
    const { error } = await supabase.from("projects").insert(inserts);
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("Bulk project insert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
