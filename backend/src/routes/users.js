const express = require("express");
const router = express.Router();
const supabase = require("../helpers/supabaseHelper");

/* ─────────────────────────────────────────
   Middleware: Token verify + role check
───────────────────────────────────────── */
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  const { data: profile } = await supabase
    .from("users").select("*").eq("id", user.id).single();

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

/* ─────────────────────────────────────────
   GET /api/users — All users list
   Admin: apne banaye users dekh sakta hai
   Global Admin: sab dekh sakta hai
───────────────────────────────────────── */
router.get("/", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, contact_no, designation, department, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

/* ─────────────────────────────────────────
   POST /api/users — New user add karo
   Admin sirf 'user' role de sakta hai
   Global Admin 'admin' bhi de sakta hai
───────────────────────────────────────── */
router.post("/", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { name, email, contact_no, designation, department, role } = req.body;

  if (!name || !email) return res.status(400).json({ error: "Name aur email required hai" });

  // Admin 'admin' role nahi de sakta
  if (req.user.role === "admin" && role === "admin")
    return res.status(403).json({ error: "Sirf Global Admin, Admin bana sakta hai" });

  // Supabase Auth mein user banao (invite flow)
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name }
  });

  if (authError) return res.status(400).json({ error: authError.message });

  // Users table mein profile banao
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      name,
      email,
      contact_no: contact_no || "",
      designation: designation || "",
      department: department || "",
      role: role || "user",
    })
    .select()
    .single();

  if (profileError) return res.status(500).json({ error: profileError.message });

  res.json({ success: true, user: profile });
});

/* ─────────────────────────────────────────
   PUT /api/users/:id — User update karo
───────────────────────────────────────── */
router.put("/:id", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { id } = req.params;
  const { name, contact_no, designation, department, role, is_active } = req.body;

  // Admin role change nahi kar sakta
  if (req.user.role === "admin" && role !== undefined)
    return res.status(403).json({ error: "Admin role change nahi kar sakta" });

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (contact_no !== undefined) updates.contact_no = contact_no;
  if (designation !== undefined) updates.designation = designation;
  if (department !== undefined) updates.department = department;
  if (role !== undefined && req.user.role === "global_admin") updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from("users").update(updates).eq("id", id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, user: data });
});

/* ─────────────────────────────────────────
   GET /api/users/:id/permissions
───────────────────────────────────────── */
router.get("/:id/permissions", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { data: modules } = await supabase
    .from("modules").select("*").eq("is_active", true).order("id");

  const { data: perms } = await supabase
    .from("permissions").select("*").eq("user_id", req.params.id);

  // Har module ke liye permission state return karo
  const result = modules.map(mod => {
    const perm = perms?.find(p => p.module_id === mod.id) || {};
    return {
      module_id: mod.id,
      module_key: mod.module_key,
      module_name: mod.module_name,
      can_view:   perm.can_view   || false,
      can_add:    perm.can_add    || false,
      can_edit:   perm.can_edit   || false,
      can_delete: perm.can_delete || false,
    };
  });

  res.json({ permissions: result });
});

/* ─────────────────────────────────────────
   PUT /api/users/:id/permissions
   Body: [{ module_id, can_view, can_add, can_edit, can_delete }]
───────────────────────────────────────── */
router.put("/:id/permissions", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions))
    return res.status(400).json({ error: "permissions array chahiye" });

  // Upsert — exist kare toh update, nahi kare toh insert
  const rows = permissions.map(p => ({
    user_id:    id,
    module_id:  p.module_id,
    can_view:   p.can_view   || false,
    can_add:    p.can_add    || false,
    can_edit:   p.can_edit   || false,
    can_delete: p.can_delete || false,
  }));

  const { error } = await supabase
    .from("permissions")
    .upsert(rows, { onConflict: "user_id,module_id" });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

/* ─────────────────────────────────────────
   GET /api/users/modules — All active modules
───────────────────────────────────────── */
router.get("/modules/list", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("modules").select("*").eq("is_active", true).order("id");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ modules: data });
});

/* ─────────────────────────────────────────
   POST /api/users/modules — Naaya module add (Global Admin only)
───────────────────────────────────────── */
router.post("/modules", requireAuth, requireGlobalAdmin, async (req, res) => {
  const { module_key, module_name } = req.body;
  if (!module_key || !module_name)
    return res.status(400).json({ error: "module_key aur module_name required hai" });

  const { data, error } = await supabase
    .from("modules").insert({ module_key, module_name }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, module: data });
});

module.exports = router;
