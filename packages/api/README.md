# @grasp/api

Shared API package providing tRPC router definitions for the entire monorepo.

## Features

- Type-safe API routes with tRPC
- Drizzle ORM for database queries
- Zod schema validation
- Centralized business logic
- End-to-end type inference
- Authentication middleware
- Full IntelliSense support

## Usage

### Defining a New Router

1. Create a new file in `src/routers/`:

```typescript
// src/routers/posts.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { posts, eq, desc } from '@grasp/database';
import { TRPCError } from '@trpc/server';

export const postRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(posts)
      .where(eq(posts.userId, ctx.user.id))
      .orderBy(desc(posts.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [post] = await ctx.db
        .insert(posts)
        .values({
          title: input.title,
          content: input.content,
          userId: ctx.user.id,
        })
        .returning();

      if (!post) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create post',
        });
      }

      return post;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(posts)
        .set({
          ...(input.title && { title: input.title }),
          ...(input.content && { content: input.content }),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(posts).where(eq(posts.id, input.id));
    }),
});
```

2. Add to main router:

```typescript
// src/router.ts
import { postRouter } from './routers/posts';

export const appRouter = router({
  todo: todoRouter,
  profile: profileRouter,
  post: postRouter, // Add your new router
});
```

### Using in Apps

```typescript
// In any app (web, mobile, extension)
import { trpc } from '~/lib/trpc';

function PostList() {
  const { data, isLoading } = trpc.post.list.useQuery();
  const createPost = trpc.post.create.useMutation();

  return (
    <div>
      {data?.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Architecture

```
api/
├── src/
│   ├── routers/       # Individual route handlers (use Drizzle queries)
│   │   ├── todo.ts    # Todo CRUD operations
│   │   └── profile.ts # Profile management
│   ├── trpc.ts        # tRPC initialization + middleware
│   ├── context.ts     # Request context (Drizzle + Supabase)
│   ├── router.ts      # Main app router
│   └── index.ts       # Public exports
└── package.json
```

## Context

The context provides both Drizzle and Supabase clients:

```typescript
export interface Context {
  db: DrizzleDB; // For database queries
  supabase: SupabaseClient; // For auth/storage
  user: { id: string; email?: string } | null;
}
```

## Procedures

### Public Procedure

No authentication required:

```typescript
publicProcedure.query(async ({ ctx }) => {
  // Anyone can call this
});
```

### Protected Procedure

Requires authentication:

```typescript
protectedProcedure.query(async ({ ctx }) => {
  // ctx.user is guaranteed to exist
});
```

## Type Safety

The `AppRouter` type is exported and used by all apps for full type inference:

```typescript
export type AppRouter = typeof appRouter;
```

This enables:

- Auto-completion in your IDE
- Type checking at compile time
- Runtime validation with Zod
- Automatic error handling
- Type-safe database queries with Drizzle

## Best Practices

### Database Queries

Always use Drizzle ORM for database operations:

```typescript
// ✅ Good - Type-safe Drizzle query
const todos = await ctx.db.select().from(todos).where(eq(todos.userId, ctx.user.id));

// ❌ Bad - Don't use Supabase for database queries
const { data } = await ctx.supabase.from('todos').select('*');
```

### Error Handling

Use tRPC error codes:

```typescript
import { TRPCError } from '@trpc/server';

if (!result) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Resource not found',
  });
}
```

### Input Validation

Always validate inputs with Zod:

```typescript
.input(z.object({
  title: z.string().min(1).max(200),
  completed: z.boolean().optional(),
}))
```

### Transactions

Use Drizzle transactions for related operations:

```typescript
await ctx.db.transaction(async (tx) => {
  const [user] = await tx.insert(profiles).values({...}).returning();
  await tx.insert(todos).values({ userId: user.id, ... });
});
```
