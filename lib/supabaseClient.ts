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
      autoRefreshToken: isBrowser, // Only refresh token in browser
      detectSessionInUrl: isBrowser, // Only detect session in URL in browser
    },
    global: {
      fetch: (url, init) => {
        if (init) {
          init.cache = 'no-store';
          init.credentials = 'include';
        }
        return fetch(url, init);
      },
    },
  }
);
