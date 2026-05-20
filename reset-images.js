const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: null })
    .neq('id', 'dummy'); // Dummy condition to update all rows

  if (error) {
    console.error("Error updating products:", error);
  } else {
    console.log("Successfully reset all product images to null!");
  }
}

run();
