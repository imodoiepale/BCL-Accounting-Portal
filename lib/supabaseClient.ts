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
      headers: {
        'X-Client-Info': 'bcl-accounting-portal',
      },
      fetch: (url, init) => {
        // Add default headers
        const headers = new Headers(init?.headers);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
        
        // Create new init object with updated headers
        const newInit = {
          ...init,
          headers,
          cache: 'no-store' as RequestCache,
          credentials: 'same-origin' as RequestCredentials,
        };

        return fetch(url, newInit);
      },
    },
  }
);
