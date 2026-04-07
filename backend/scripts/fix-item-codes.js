/**
 * fix-item-codes.js — One-time migration
 * Reassigns item codes:
 *   Supply items -> ITM-001, ITM-002, ...  (sorted by created_at)
 *   SITC   items -> SIT-001, SIT-002, ...  (sorted by created_at)
 *
 * Run: node scripts/fix-item-codes.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("ERR: SUPABASE_URL or SUPABASE_SERVICE_KEY missing from .env");
  process.exit(1);
}

const BASE    = SUPABASE_URL + "/rest/v1";
const HEADERS = {
  "apikey":          SERVICE_KEY,
  "Authorization":   "Bearer " + SERVICE_KEY,
  "Content-Type":    "application/json",
  "Accept-Profile":  "procurement",   // target the procurement schema
  "Content-Profile": "procurement",
};

async function apiFetch(path, opts = {}) {
  const res = await fetch(BASE + path, { headers: HEADERS, ...opts });
  const text = await res.text();
  if (!res.ok) throw new Error("API " + res.status + ": " + text);
  return text ? JSON.parse(text) : null;
}

const pad  = (n) => String(n).padStart(3, "0");
const ok   = (msg) => console.log("  OK  " + msg);
const info = (msg) => console.log("  ..  " + msg);
const fail = (msg) => console.log("  ERR " + msg);

async function main() {
  console.log("=== Item Code Fix Migration ===\n");
  console.log("Supabase URL: " + SUPABASE_URL + "\n");

  // 1. Fetch all items
  const items = await apiFetch("/items?select=id,item_code,item_type,material_name,created_at&order=created_at.asc");

  if (!items || items.length === 0) {
    info("No items found. Nothing to do.");
    return;
  }

  console.log("Found " + items.length + " items total.\n");

  const supplyItems = items.filter(i => (i.item_type || "Supply") !== "SITC");
  const sitcItems   = items.filter(i => i.item_type === "SITC");

  info("Supply items: " + supplyItems.length);
  info("SITC   items: " + sitcItems.length + "\n");

  const updates = [];

  supplyItems.forEach((item, idx) => {
    const newCode = "ITM-" + pad(idx + 1);
    if (item.item_code !== newCode)
      updates.push({ id: item.id, newCode, oldCode: item.item_code, name: item.material_name });
  });

  sitcItems.forEach((item, idx) => {
    const newCode = "SIT-" + pad(idx + 1);
    if (item.item_code !== newCode)
      updates.push({ id: item.id, newCode, oldCode: item.item_code, name: item.material_name });
  });

  if (updates.length === 0) {
    ok("All item codes already correct. Nothing to update.");
    return;
  }

  console.log(updates.length + " item(s) need updating:\n");
  updates.forEach(u => console.log("  [" + u.oldCode + "] -> [" + u.newCode + "]  " + u.name));
  console.log();

  let successCount = 0;
  for (const u of updates) {
    try {
      await apiFetch("/items?id=eq." + encodeURIComponent(u.id), {
        method: "PATCH",
        body: JSON.stringify({ item_code: u.newCode }),
      });
      ok(u.oldCode + " -> " + u.newCode + "  (" + u.name + ")");
      successCount++;
    } catch (e) {
      fail("Failed " + u.oldCode + " -> " + u.newCode + ": " + e.message);
    }
  }

  console.log("\n=== Done: " + successCount + "/" + updates.length + " items updated ===");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error("Script failed:", e.message);
    process.exit(1);
  });
