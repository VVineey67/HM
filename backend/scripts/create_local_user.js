const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

// If .env.local not found or incomplete, fallback to .env
if (!process.env.SUPABASE_URL) {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createLocalUser(name, email, password, role = "user") {
  console.log(`--- Creating Local User ---`);
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Role: ${role}`);

  // 1. Create User in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Bypass email verification
    user_metadata: { name }
  });

  if (authError) {
    console.error("Auth Error:", authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log("Auth User Created:", userId);

  // 2. Create User Profile in 'users' table
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .insert({
      id: userId,
      name,
      email,
      role,
      is_active: true,
      created_at: new Date().toISOString()
    });

  if (profileError) {
    console.error("Profile Insert Error:", profileError.message);
    await supabase.auth.admin.deleteUser(userId);
    return;
  }

  // 3. Grant Permissions for all active modules
  console.log("Fetching active modules...");
  const { data: modules, error: modError } = await supabase.from("modules").select("id").eq("is_active", true);
  
  if (modError) {
    console.error("Module Fetch Error:", modError.message);
    return;
  }

  const isFullAccess = ["global_admin", "super_admin", "admin"].includes(role);
  console.log(`Granting ${isFullAccess ? "Full" : "View-only"} access to ${modules.length} modules...`);

  const permsToInsert = modules.map(mod => ({
    user_id: userId,
    module_id: mod.id,
    can_view: true,
    can_add: isFullAccess,
    can_edit: isFullAccess,
    can_delete: isFullAccess,
    can_export: isFullAccess
  }));

  const { error: permError } = await supabase.from("permissions").insert(permsToInsert);

  if (permError) {
    console.error("Permission Insert Error:", permError.message);
    return;
  }

  console.log("Permissions Granted Successfully!");
  console.log("Done! You can now login with these credentials.");
}

// Usage: node scripts/create_local_user.js "Name" "email" "password" "role"
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node scripts/create_local_user.js "John Doe" "john@example.com" "password123" "admin"');
  process.exit(1);
}

createLocalUser(args[0], args[1], args[2], args[3] || "user");
