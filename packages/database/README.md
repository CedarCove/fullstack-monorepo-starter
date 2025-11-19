# @grasp/database

Shared database package providing Drizzle ORM schema, type-safe database queries, and Supabase client wrappers for the entire monorepo.

## Features

- **Drizzle ORM schema** - Single source of truth for database structure
- **Type-safe queries** - Full IntelliSense and auto-completion
- **Auto-inferred types** - No manual type generation needed
- **Migration management** - Track schema changes with Drizzle Kit
- **Supabase client wrappers** - For auth and storage operations
- **Singleton pattern** - Optimal client reuse

## Usage

### Import Schema and Types

```typescript
import { todos, profiles, eq, desc } from '@grasp/database';
import type { Todo, InsertTodo, Profile } from '@grasp/database';

// Types are automatically inferred from schema
const newTodo: InsertTodo = {
  title: 'Buy groceries',
  userId: 'user-123',
};
```

### Drizzle ORM Queries (Server-Side Only)

Use in tRPC routers and API routes:

```typescript
import { getServerDrizzleClient, todos, eq } from '@grasp/database';

const db = getServerDrizzleClient();

// Select all todos
const allTodos = await db.select().from(todos);

// Select with conditions
const userTodos = await db
  .select()
  .from(todos)
  .where(eq(todos.userId, userId))
  .orderBy(desc(todos.createdAt));

// Insert
const [newTodo] = await db.insert(todos).values({ title: 'New task', userId: userId }).returning();

// Update
const [updated] = await db
  .update(todos)
  .set({ completed: true })
  .where(eq(todos.id, todoId))
  .returning();

// Delete
await db.delete(todos).where(eq(todos.id, todoId));
```

### Supabase Client (Auth & Storage)

#### Browser/Client-Side

```typescript
import { getBrowserClient } from '@grasp/database';

const supabase = getBrowserClient();

// Authentication
const { data } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Storage
const { data } = await supabase.storage.from('avatars').upload(path, file);
```

#### Server-Side

```typescript
import { createServerClient } from '@grasp/database';

const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const { data } = await supabase.auth.getUser(token);
```

## Schema Management

### Modify Schema

Edit `src/schema.ts` to add or modify tables:

```typescript
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  completed: boolean('completed').default(false).notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Sync to Database

```bash
# Push schema directly (development)
pnpm db:push

# Generate migration files (production)
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open visual database browser
pnpm db:studio
```

### Type Inference

Types are automatically inferred from the schema:

```typescript
import { todos } from '@grasp/database';

// Inferred types
type Todo = typeof todos.$inferSelect;
type InsertTodo = typeof todos.$inferInsert;
```

## Architecture

```
database/
├── src/
│   ├── schema.ts        # Drizzle ORM schema (source of truth)
│   ├── client.ts        # Drizzle + Supabase client factories
│   ├── migrate.ts       # Migration runner
│   └── index.ts         # Public exports
├── drizzle.config.ts    # Drizzle Kit configuration
└── package.json
```

## Available Scripts

```bash
pnpm db:push       # Push schema to database (no migration files)
pnpm db:generate   # Generate migration files from schema
pnpm db:migrate    # Apply migrations to database
pnpm db:studio     # Open Drizzle Studio (visual browser)
pnpm type-check    # TypeScript type checking
```

## When to Use Drizzle vs Supabase

**Use Drizzle ORM:**

- All database queries and mutations (server-side only)
- Complex business logic
- Type-safe operations with IntelliSense
- Transactions and aggregations

**Use Supabase Client:**

- Authentication (sign in/up/out)
- Storage operations (file uploads)
- Real-time subscriptions

## Example tRPC Router

```typescript
import { router, protectedProcedure } from '../trpc';
import { todos, eq } from '@grasp/database';
import { z } from 'zod';

export const todoRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(todos).where(eq(todos.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [todo] = await ctx.db
        .insert(todos)
        .values({ title: input.title, userId: ctx.user.id })
        .returning();
      return todo;
    }),
});
```
