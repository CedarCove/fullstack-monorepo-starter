'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState, useEffect } from 'react';
import superjson from 'superjson';
import { trpc } from '~/lib/trpc';
import { getSupabase } from '~/lib/supabase';
import { AuthProvider } from '~/lib/auth';

/**
 * Providers component that wraps the app with tRPC and React Query
 * Includes auth state listener to automatically refetch queries on login/logout
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  );

  // Listen for auth state changes globally
  useEffect(() => {
    const supabase = getSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // When auth state changes, invalidate all queries to refetch with new context
      // This handles both sign in and sign out events
      // Note: AuthButton.tsx also handles sign out immediately for better UX
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        queryClient.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <AuthProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </AuthProvider>
  );
}
