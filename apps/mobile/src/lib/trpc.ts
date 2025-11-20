import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@repo/api';

/**
 * Type-safe tRPC React hooks for React Native
 */
export const trpc = createTRPCReact<AppRouter>();
