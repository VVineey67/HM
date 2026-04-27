const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkTable() {
  console.log('URL:', process.env.SUPABASE_URL);
  
  // Try to select from order_amendments
  const { data, error } = await supabase
    .from('order_amendments')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching order_amendments:', error.message);
    console.log('Hint: Check if the table "order_amendments" exists in public schema.');
  } else {
    console.log('SUCCESS: Table "order_amendments" exists.');
  }
}

checkTable();
