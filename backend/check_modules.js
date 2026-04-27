const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local"), override: true });
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkModules() {
  console.log("Checking approval_modules table...");
  const { data, error } = await supabase.from("approval_modules").select("*");
  if (error) {
    console.error("Error fetching approval_modules:", error.message);
  } else {
    console.log("approval_modules count:", data.length);
    console.log("Data:", data);
  }
}

checkModules();
