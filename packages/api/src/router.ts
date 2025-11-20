import { router } from './trpc';
import { todoRouter } from './routers/todo';
import { profileRouter } from './routers/profile';
import { postRouter } from './routers/post';
import { categoryRouter } from './routers/category';
import { commentRouter } from './routers/comment';

/**
 * Main app router that merges all sub-routers
 *
 * This is the root router for the entire API.
 * Each sub-router is namespaced under its own key.
 *
 * Example usage in client:
 *   trpc.todo.list.useQuery()
 *   trpc.post.list.useQuery({ limit: 10 })
 *   trpc.profile.getCurrent.useQuery()
 */
export const appRouter = router({
  todo: todoRouter,
  profile: profileRouter,
  post: postRouter,
  category: categoryRouter,
  comment: commentRouter,
});

/**
 * Export type router type signature for type-safe clients
 * This is what enables end-to-end type safety across the monorepo
 *
 * The AppRouter type is imported in:
 * - apps/web/src/utils/trpc.ts (Next.js client)
 * - apps/mobile/src/utils/trpc.ts (Expo client)
 * - apps/extension/src/utils/trpc.ts (Chrome extension client)
 */
export type AppRouter = typeof appRouter;
