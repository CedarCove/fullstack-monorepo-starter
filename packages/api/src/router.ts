import { router } from './trpc';
import { todoRouter } from './routers/todo';
import { profileRouter } from './routers/profile';

/**
 * Main app router that merges all sub-routers
 */
export const appRouter = router({
  todo: todoRouter,
  profile: profileRouter,
});

/**
 * Export type router type signature for type-safe clients
 * This is what enables end-to-end type safety
 */
export type AppRouter = typeof appRouter;
