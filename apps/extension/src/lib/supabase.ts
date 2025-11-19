import { createBrowserClient } from '@grasp/database/client';

// For Chrome extensions, we need to store env vars differently
// You can use chrome.storage or hardcode during build
const SUPABASE_URL = 'your-supabase-url'; // Replace with actual URL
const SUPABASE_ANON_KEY = 'your-supabase-anon-key'; // Replace with actual key

/**
 * Get the Supabase client for Chrome extension usage
 */
export function getSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
