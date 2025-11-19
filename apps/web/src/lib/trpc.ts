import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@grasp/api';

/**
 * Type-safe tRPC React hooks
 * This provides end-to-end type safety from server to client
 */
export const trpc = createTRPCReact<AppRouter>();
