const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
  const { data, error } = await supabase
    .from('order_amendments')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching order_amendments:', error.message);
  } else {
    console.log('Table order_amendments exists and is accessible.');
  }
}

checkTable();
