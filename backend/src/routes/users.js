const express = require("express");
const router  = express.Router();
const { createClient } = require("@supabase/supabase-js");

const getAdminClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const extractUserId = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return payload.sub || null;
  } catch { return null; }
};

/* ── Middleware: Token verify (no expiry check) ── */
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });

  const userId = extractUserId(token);
  if (!userId)  return res.status(401).json({ error: "Invalid token" });

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("*").eq("id", userId).single();

  if (!profile || !profile.is_active)
    return res.status(403).json({ error: "Account inactive" });

  req.user = profile;
  next();
};

const requireAdminOrAbove = (req, res, next) => {
  if (!["global_admin", "admin"].includes(req.user.role))
    return res.status(403).json({ error: "Access denied" });
  next();
};

const requireGlobalAdmin = (req, res, next) => {
  if (req.user.role !== "global_admin")
    return res.status(403).json({ error: "Sirf Global Admin yeh kar sakta hai" });
  next();
};

/* GET /api/users */
router.get("/", requireAuth, requireAdminOrAbove, async (req, res) => {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, name, email, contact_no, designation, department, role, is_active, avatar, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

/* POST /api/users — invite */
router.post("/", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { name, email, contact_no, designation, department, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name aur email required hai" });

  if (req.user.role === "admin" && role === "admin")
    return res.status(403).json({ error: "Sirf Global Admin, Admin bana sakta hai" });

  const admin = getAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, { data: { name } });
  if (authError) return res.status(400).json({ error: authError.message });

  const { data: profile, error: profileError } = await admin.from("users").insert({
    id:          authData.user.id,
    name,
    email,
    contact_no:  contact_no  || "",
    designation: designation || "",
    department:  department  || "",
    role:        role        || "user",
  }).select().single();

  if (profileError) return res.status(500).json({ error: profileError.message });
  res.json({ success: true, user: profile });
});

/* PUT /api/users/:id */
router.put("/:id", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { id } = req.params;
  const { name, contact_no, designation, department, role, is_active } = req.body;

  if (req.user.role === "admin" && role !== undefined)
    return res.status(403).json({ error: "Admin role change nahi kar sakta" });

  const updates = {};
  if (name        !== undefined) updates.name        = name;
  if (contact_no  !== undefined) updates.contact_no  = contact_no;
  if (designation !== undefined) updates.designation = designation;
  if (department  !== undefined) updates.department  = department;
  if (role !== undefined && req.user.role === "global_admin") updates.role = role;
  if (is_active   !== undefined) updates.is_active   = is_active;

  const admin = getAdminClient();
  const { data, error } = await admin.from("users").update(updates).eq("id", id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, user: data });
});

/* GET /api/users/:id/permissions */
router.get("/:id/permissions", requireAuth, requireAdminOrAbove, async (req, res) => {
  const admin = getAdminClient();
  const { data: modules } = await admin.from("modules").select("*").eq("is_active", true).order("id");
  const { data: perms }   = await admin.from("permissions").select("*").eq("user_id", req.params.id);

  const result = (modules || []).map(mod => {
    const perm = perms?.find(p => p.module_id === mod.id) || {};
    return {
      module_id:   mod.id,
      module_key:  mod.module_key,
      module_name: mod.module_name,
      can_view:    perm.can_view   || false,
      can_add:     perm.can_add    || false,
      can_edit:    perm.can_edit   || false,
      can_delete:  perm.can_delete || false,
    };
  });

  res.json({ permissions: result });
});

/* PUT /api/users/:id/permissions */
router.put("/:id/permissions", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions))
    return res.status(400).json({ error: "permissions array chahiye" });

  const rows = permissions.map(p => ({
    user_id:    id,
    module_id:  p.module_id,
    can_view:   p.can_view   || false,
    can_add:    p.can_add    || false,
    can_edit:   p.can_edit   || false,
    can_delete: p.can_delete || false,
  }));

  const admin = getAdminClient();
  const { error } = await admin.from("permissions").upsert(rows, { onConflict: "user_id,module_id" });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* GET /api/users/modules/list */
router.get("/modules/list", requireAuth, async (req, res) => {
  const admin = getAdminClient();
  const { data, error } = await admin.from("modules").select("*").eq("is_active", true).order("id");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ modules: data });
});

/* POST /api/users/modules */
router.post("/modules", requireAuth, requireGlobalAdmin, async (req, res) => {
  const { module_key, module_name } = req.body;
  if (!module_key || !module_name)
    return res.status(400).json({ error: "module_key aur module_name required hai" });

  const admin = getAdminClient();
  const { data, error } = await admin.from("modules").insert({ module_key, module_name }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, module: data });
});

module.exports = router;
