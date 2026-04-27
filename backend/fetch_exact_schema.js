const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local"), override: true });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getFullSchema() {
  const tables = ['approval_modules', 'approval_points', 'approval_workflows', 'approval_steps', 'approval_requests', 'approval_logs'];
  console.log("--- START SCHEMA FETCH ---");
  
  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`  Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`  Columns:`, Object.keys(data[0]));
      console.log(`  Sample Data:`, data[0]);
    } else {
      console.log(`  Table exists but is empty.`);
      // If empty, try to get column names via RPC or a different hack if needed, 
      // but usually the first row check works if data exists.
    }
  }

  // Also check trigger points data exactly
  console.log("\n--- TRIGGER POINTS DATA ---");
  const { data: points } = await supabase.from('approval_points').select("*");
  console.log(points);

  console.log("\n--- END SCHEMA FETCH ---");
}

getFullSchema();
