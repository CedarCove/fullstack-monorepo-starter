import { createBrowserClient } from '@supabase/ssr';

/**
 * Get the Supabase client for browser usage
 * Uses @supabase/ssr for proper cookie handling with HttpOnly security
 */
export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Using the simplified browser client - cookies are handled automatically
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
