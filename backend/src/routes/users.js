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
  if (!["global_admin", "super_admin", "admin"].includes(req.user.role))
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
  const { name, email, contact_no, designation, department, role, profile_permissions } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name aur email required hai" });

  // global_admin role KABHI bhi app se assign nahi hoga — sirf Supabase Dashboard se
  if (role === "global_admin")
    return res.status(403).json({ error: "Global Admin sirf database se set hota hai" });
  // Only global_admin can assign super_admin
  if (role === "super_admin" && req.user.role !== "global_admin")
    return res.status(403).json({ error: "Sirf Global Admin, Super Admin bana sakta hai" });
  // admin can only create plain users
  if (req.user.role === "admin" && role === "admin")
    return res.status(403).json({ error: "Sirf Global Admin ya Super Admin, Admin bana sakta hai" });
  // super_admin can create admin and user, not super_admin
  if (req.user.role === "super_admin" && role === "super_admin")
    return res.status(403).json({ error: "Sirf Global Admin, Super Admin bana sakta hai" });

  const admin = getAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: process.env.FRONTEND_URL + "/",
  });
  if (authError) return res.status(400).json({ error: authError.message });

  const { data: profile, error: profileError } = await admin.from("users").insert({
    id:                  authData.user.id,
    name,
    email,
    contact_no:          contact_no          || "",
    designation:         designation         || "",
    department:          department          || "",
    role:                role                || "user",
    profile_permissions: profile_permissions || null,
    created_by_id:       req.body.createdById || null,
    created_by_name:     req.body.createdByName || null,
  }).select().single();

  if (profileError) return res.status(500).json({ error: profileError.message });
  res.json({ success: true, user: profile });
});

/* PUT /api/users/:id */
router.put("/:id", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { id } = req.params;
  const { name, contact_no, designation, department, role, is_active, profile_permissions } = req.body;

  // Fetch target user's current role first to prevent unauthorized edits
  const admin = getAdminClient();
  const { data: targetUser } = await admin.from("users").select("role").eq("id", id).single();
  
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  // Security: Super Admin cannot edit Global Admin or other Super Admins
  if (req.user.role === "super_admin" && ["global_admin", "super_admin"].includes(targetUser.role)) {
    return res.status(403).json({ error: "Aap is level ke user ko edit nahi kar sakte" });
  }

  const updates = {};
  if (name        !== undefined) updates.name        = name;
  if (contact_no  !== undefined) updates.contact_no  = contact_no;
  if (designation !== undefined) updates.designation = designation;
  if (department  !== undefined) updates.department  = department;

  if (role !== undefined) {
    if (req.user.role === "global_admin") {
      // Global admin can set any role except making someone another global_admin (handled by DB/Policy usually)
      if (role !== "global_admin") updates.role = role;
    } else if (req.user.role === "super_admin") {
      // Super admin can only set Admin or User
      if (["admin", "user"].includes(role)) updates.role = role;
    }
  }

  if (is_active !== undefined) updates.is_active = is_active;

  if (profile_permissions !== undefined) {
    if (req.user.role === "global_admin" || req.user.role === "super_admin") {
      updates.profile_permissions = profile_permissions;
    }
  }
  const { data, error } = await admin.from("users").update(updates).eq("id", id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, user: data });
});

/* DELETE /api/users/:id — permanently remove user (global_admin only) */
router.delete("/:id", requireAuth, requireGlobalAdmin, async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id)
    return res.status(400).json({ error: "Apne aap ko delete nahi kar sakte" });

  const admin = getAdminClient();

  // Remove from our users table first
  const { error: dbError } = await admin.from("users").delete().eq("id", id);
  if (dbError) return res.status(500).json({ error: dbError.message });

  // Remove from Supabase auth
  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) console.warn("Auth delete warning:", authError.message);

  res.json({ success: true });
});

/* GET /api/users/:id/permissions */
router.get("/:id/permissions", requireAuth, requireAdminOrAbove, async (req, res) => {
  const admin = getAdminClient();
  const { data: modules } = await admin.from("modules").select("*").eq("is_active", true).order("id");
  const { data: user }   = await admin.from("users").select("profile_permissions").eq("id", req.params.id).single();
  const { data: perms }   = await admin.from("permissions").select("*").eq("user_id", req.params.id);

  const result = (modules || []).map(mod => {
    const perm = perms?.find(p => p.module_id === mod.id) || {};
    return {
      module_id:             mod.id,
      module_key:            mod.module_key,
      module_name:           mod.module_name,
      can_view:              perm.can_view              || false,
      can_add:               perm.can_add               || false,
      can_edit:              perm.can_edit              || false,
      can_delete:            perm.can_delete            || false,
      can_bulk_upload:       perm.can_bulk_upload       || false,
      can_export:            perm.can_export            || false,
      can_download_document: perm.can_download_document || false,
    };
  });

  res.json({ permissions: result, profile_permissions: user?.profile_permissions || {} });
});

/* PUT /api/users/:id/permissions */
router.put("/:id/permissions", requireAuth, requireAdminOrAbove, async (req, res) => {
  const { id } = req.params;
  const { permissions, profile_permissions } = req.body;

  if (permissions && !Array.isArray(permissions))
    return res.status(400).json({ error: "permissions array chahiye" });

  const admin = getAdminClient();

  if (permissions) {
    const rows = permissions.map(p => ({
      user_id:               id,
      module_id:             p.module_id,
      can_view:              p.can_view              || false,
      can_add:               p.can_add               || false,
      can_edit:              p.can_edit              || false,
      can_delete:            p.can_delete            || false,
      can_bulk_upload:       p.can_bulk_upload       || false,
      can_export:            p.can_export            || false,
      can_download_document: p.can_download_document || false,
    }));
    const { error: permError } = await admin.from("permissions").upsert(rows, { onConflict: "user_id,module_id" });
    if (permError) return res.status(500).json({ error: permError.message });
  }

  if (profile_permissions) {
    const { error: profError } = await admin.from("users").update({ profile_permissions }).eq("id", id);
    if (profError) return res.status(500).json({ error: profError.message });
  }

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
  const { createdById, createdByName } = req.body;
  const { data, error } = await admin.from("modules").insert({ 
    module_key, module_name,
    created_by_id: createdById || null,
    created_by_name: createdByName || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, module: data });
});

module.exports = router;
