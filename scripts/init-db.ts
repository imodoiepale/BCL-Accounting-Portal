const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get the directory name in CommonJS
const scriptDir = path.dirname(__filename);

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
    const migrationPath = path.join(scriptDir, '..', 'supabase', 'migrations', '20240321_init_email_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map((statement: string) => statement.trim())
      .filter((statement: string) => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Error executing statement:', error);
          // Continue with other statements even if one fails
          continue;
        }
      } catch (err) {
        console.error('Failed to execute statement:', err);
        // Continue with other statements even if one fails
        continue;
      }
    }

    console.log('Database initialization completed');

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('bcl_emails_accounts')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('Error verifying tables:', tablesError);
      process.exit(1);
    }

    console.log('Tables verified successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
