import { createClient } from '@supabase/supabase-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema';

export type SupabaseClient = ReturnType<typeof createClient>;
export type DrizzleDB = PostgresJsDatabase<typeof schema>;

/**
 * Create a Supabase client for browser/client-side usage
 * Uses anon key which respects Row Level Security (RLS) policies
 */
export function createBrowserClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Singleton pattern for browser Supabase client
 */
let browserClientInstance: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClientInstance;
}
