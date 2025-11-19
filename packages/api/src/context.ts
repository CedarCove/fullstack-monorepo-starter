import type { SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';
import type { DrizzleDB } from '@grasp/database';

/**
 * Context that will be available in all tRPC procedures
 * This includes both Supabase client and Drizzle ORM client
 */
export interface Context {
  supabase: SupabaseClientBase<any, 'public', any>;
  db: DrizzleDB;
  user: {
    id: string;
    email?: string;
  } | null;
}

/**
 * Create context for tRPC procedures
 * This is called for each request
 */
export type CreateContextOptions = {
  supabase: SupabaseClientBase<any, 'public', any>;
  db: DrizzleDB;
  userId?: string;
  userEmail?: string;
};

export function createContext(opts: CreateContextOptions): Context {
  return {
    supabase: opts.supabase,
    db: opts.db,
    user: opts.userId
      ? {
          id: opts.userId,
          email: opts.userEmail,
        }
      : null,
  };
}
