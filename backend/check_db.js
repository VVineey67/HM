const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local"), override: true });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const supabase = require("./src/helpers/supabaseHelper");

async function checkSchema() {
  try {
    const { data, error } = await supabase.schema("procurement").from("purchase_orders").select("*").limit(1);
    if (error) {
      console.error("Error fetching data:", error.message);
      return;
    }
    if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data found to check columns. Please ensure at least one order exists.");
    }
  } catch (err) {
    console.error(err);
  }
}

checkSchema();
