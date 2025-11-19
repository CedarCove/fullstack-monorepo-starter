import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { appRouter } from '@grasp/api';
import { createContext } from '@grasp/api/context';
import { getServerDrizzleClient } from '@grasp/database/client/server';

/**
 * tRPC API handler for Next.js App Router
 * Now includes Drizzle ORM client for type-safe queries
 * Uses @supabase/ssr to read auth cookies for proper authentication
 */
const handler = async (req: Request) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get cookies from Next.js
  const cookieStore = cookies();

  // Create Supabase client that can read cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const db = getServerDrizzleClient();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      // Get user from cookies via Supabase SSR
      const {
        data: { session },
      } = await supabase.auth.getSession();

      return createContext({
        supabase,
        db,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      });
    },
  });
};

export { handler as GET, handler as POST };
