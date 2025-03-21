const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkProviderEnum() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Query the information schema to check the provider column type
    const { data, error } = await supabase
      .rpc('get_column_type', { 
        table_name: 'bcl_emails_accounts',
        column_name: 'provider'
      });

    if (error) {
      console.error('Error checking provider column:', error);
    } else {
      console.log('Provider column type:', data);
    }

    // Try to insert with explicit type cast
    const { data: insertData, error: insertError } = await supabase
      .from('bcl_emails_accounts')
      .insert({
        email: 'test@example.com',
        provider: 'gmail',
        app_password: 'test_password'
      })
      .select();

    if (insertError) {
      console.error('Error inserting with type cast:', insertError);
    } else {
      console.log('Successfully inserted with type cast:', insertData);
    }
  } catch (error) {
    console.error('Failed to check provider enum:', error);
    process.exit(1);
  }
}

checkProviderEnum();
