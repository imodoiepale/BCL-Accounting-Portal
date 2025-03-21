import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get environment variables based on environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with appropriate configuration for Edge Runtime
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: isBrowser, // Only persist sessions in browser
      autoRefreshToken: isBrowser, // Only auto-refresh tokens in browser
      detectSessionInUrl: isBrowser, // Only detect sessions in browser
    },
    global: {
      headers: {
        'X-Client-Info': `bcl-accounting-portal@${process.env.npm_package_version || '0.1.0'}`,
      },
    },
  }
);
