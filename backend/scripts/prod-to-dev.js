/**
 * prod-to-dev.js — Production Supabase → Dev Supabase data copy
 * Run: node scripts/prod-to-dev.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { createClient } = require("@supabase/supabase-js");

// Read prod credentials from .env
const prod = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Dev credentials hardcoded (only used in this script)
const dev = createClient(
  "https://lhxgohcxcslbtnuubrsg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeGdvaGN4Y3NsYnRudXVicnNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMyMjgwOSwiZXhwIjoyMDkwODk4ODA5fQ.Iz07eHk5x5IostQk7aKd04y8azhVYoP8i4fH8n_Djx8"
);

const ok   = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const err  = (msg) => console.log(`  ❌ ${msg}`);

/* ── Fetch ALL rows with pagination (bypass 1000 row limit) ── */
async function fetchAll(tableName) {
  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await prod
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

/* ── Copy one table ── */
async function copyTable(tableName, { omit = [], chunkSize = 500 } = {}) {
  console.log(`\n📋 Copying ${tableName}...`);
  try {
    const data = await fetchAll(tableName);
    if (!data || data.length === 0) { warn(`${tableName} — no data in prod`); return; }

    // Remove omitted columns
    const rows = data.map(r => {
      const row = { ...r };
      omit.forEach(k => delete row[k]);
      return row;
    });

    // Insert in chunks to avoid request size limits
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error: insErr } = await dev.from(tableName).insert(chunk);
      if (insErr) throw insErr;
    }

    ok(`${tableName} — ${rows.length} rows copied`);
  } catch (e) {
    err(`${tableName} failed: ${e.message}`);
  }
}

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║   Production → Dev Migration         ║");
  console.log("╚══════════════════════════════════════╝");

  // Procurement tables
  await copyTable("items");
  await copyTable("vendors");
  await copyTable("sites");
  await copyTable("uom");
  await copyTable("companies");

  // Attendance tables
  await copyTable("attendance");
  await copyTable("guard_attendance");
  await copyTable("staff_contacts");
  await copyTable("guard_contacts");

  // Modules (seed data)
  await copyTable("modules", { omit: [] });

  // Users — copy profiles (NOT auth.users, woh copy nahi ho sakta)
  // Dev mein alag test user banana hoga via Supabase dashboard
  console.log("\n⚠️  Users table skip — auth.users copy nahi hoti.");
  console.log("   Dev mein test user banao: autox-dev dashboard → Authentication → Add user");

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   Done ✅                             ║");
  console.log("╚══════════════════════════════════════╝");
}

main().catch(e => {
  console.error("\n❌ Script failed:", e.message);
  process.exit(1);
});
