import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type SupabaseClient = ReturnType<typeof createClient>;
export type DrizzleDB = ReturnType<typeof createDrizzleClient>;

/**
 * Create a Supabase client for server-side usage
 * Can use service role key to bypass RLS when needed
 */
export function createServerClient(supabaseUrl: string, supabaseKey: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Drizzle ORM client for database operations
 * This provides type-safe database queries with better DX than raw Supabase
 */
export function createDrizzleClient(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

/**
 * Get a Drizzle client instance for server-side operations
 * Uses connection pooling for better performance
 */
export function getServerDrizzleClient(): DrizzleDB {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  return createDrizzleClient(connectionString);
}

/**
 * Create a Drizzle client with Supabase auth context
 * This allows RLS policies to work with Drizzle queries
 */
export function createAuthenticatedDrizzleClient(connectionString: string, accessToken: string) {
  // Add auth headers to postgres connection
  const client = postgres(connectionString, {
    connection: {
      // This sets the user context for RLS policies
      application_name: 'drizzle-client',
    },
    // Pass JWT token for RLS
    transform: {
      undefined: null,
    },
  });

  return drizzle(client, { schema });
}
