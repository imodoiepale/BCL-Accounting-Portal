const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function initializeDatabase() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240321_fix_provider_enum.sql');
    console.log('Reading migration file from:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration as a single statement to maintain transaction integrity
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error executing migration:', error);
      process.exit(1);
    }

    console.log('Database initialization completed');

    // Verify the provider column type
    const { data: columnType, error: typeError } = await supabase
      .rpc('get_column_type', { 
        table_name: 'bcl_emails_accounts',
        column_name: 'provider'
      });

    if (typeError) {
      console.error('Error checking provider column type:', typeError);
      process.exit(1);
    }

    console.log('Provider column type:', columnType);

    // Try a test insertion
    const { data: testData, error: testError } = await supabase
      .from('bcl_emails_accounts')
      .insert({
        email: 'test@example.com',
        provider: 'gmail',
        app_password: 'test_password'
      })
      .select();

    if (testError) {
      console.error('Error testing insertion:', testError);
      process.exit(1);
    }

    console.log('Test insertion successful:', testData);

    // Clean up test data
    if (testData && testData[0]) {
      const { error: cleanupError } = await supabase
        .from('bcl_emails_accounts')
        .delete()
        .eq('id', testData[0].id);

      if (cleanupError) {
        console.error('Error cleaning up test data:', cleanupError);
      } else {
        console.log('Test data cleaned up successfully');
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
