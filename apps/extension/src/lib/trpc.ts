import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@grasp/api';

/**
 * Type-safe tRPC React hooks for Chrome extension
 */
export const trpc = createTRPCReact<AppRouter>();
