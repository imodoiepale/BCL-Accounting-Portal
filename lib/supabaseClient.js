import { createClient } from '@supabase/supabase-js';

// Fetch environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if the connection is successful
const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('your_table_name').select('*').limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connected successfully. Data:', data);
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err.message);
  }
};

// Immediately check the connection
checkConnection();

export default supabase;