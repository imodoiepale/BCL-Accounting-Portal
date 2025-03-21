const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkSchema() {
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
    // Try to insert a test email account
    const { data, error } = await supabase
      .from('bcl_emails_accounts')
      .insert({
        email: 'test@example.com',
        provider: 'gmail',
        app_password: 'test_password'
      })
      .select();

    if (error) {
      console.error('Error inserting test data:', error);
    } else {
      console.log('Successfully inserted test data:', data);
    }

    // Clean up test data
    if (data && data[0]) {
      const { error: deleteError } = await supabase
        .from('bcl_emails_accounts')
        .delete()
        .eq('id', data[0].id);

      if (deleteError) {
        console.error('Error cleaning up test data:', deleteError);
      } else {
        console.log('Successfully cleaned up test data');
      }
    }
  } catch (error) {
    console.error('Failed to check schema:', error);
    process.exit(1);
  }
}

checkSchema();
