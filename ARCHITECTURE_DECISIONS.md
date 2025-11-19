# Architecture Decisions

This document explains the technical choices made in this template and the reasoning behind them.

## Table of Contents

1. [Monorepo Architecture](#monorepo-architecture)
2. [Build System](#build-system)
3. [API Layer](#api-layer)
4. [Database & ORM](#database--orm)
5. [Backend Services](#backend-services)
6. [UI Framework](#ui-framework)
7. [Testing Strategy](#testing-strategy)
8. [Code Quality](#code-quality)

---

## Monorepo Architecture

### Decision: Turborepo + pnpm Workspaces

**Why?**
- ✅ **Fast builds**: Intelligent caching and parallel execution
- ✅ **Shared dependencies**: Single `node_modules` reduces disk space
- ✅ **Code sharing**: Easy to share code between apps
- ✅ **Atomic changes**: Change multiple packages in one PR
- ✅ **Type safety**: TypeScript works across package boundaries

**Alternatives Considered:**
- **Nx**: More features but steeper learning curve
- **Lerna**: Outdated, less active maintenance
- **Yarn Workspaces alone**: Missing build orchestration

**Trade-offs:**
- ⚠️ More complex than separate repos
- ⚠️ Requires understanding of workspace protocols

---

## Build System

### Decision: Turborepo

**Why?**
- ✅ **Remote caching**: Share build cache across team
- ✅ **Incremental builds**: Only rebuild what changed
- ✅ **Task pipelines**: Define task dependencies
- ✅ **Simple config**: Minimal setup required
- ✅ **Great DX**: Fast feedback loop

**Configuration Highlights:**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

**Alternatives:**
- **Nx**: More powerful but complex
- **Rush**: Enterprise-focused, overkill for most projects
- **Custom scripts**: Maintena nce burden

---

## API Layer

### Decision: tRPC v11

**Why?**
- ✅ **End-to-end type safety**: No code generation needed
- ✅ **Great DX**: Autocomplete everywhere
- ✅ **Small bundle**: Lightweight client
- ✅ **React Query integration**: Built-in caching/mutations
- ✅ **Zod integration**: Runtime validation

**Example:**
```typescript
// Define once
export const todoRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(todos);
  }),
});

// Use anywhere with full type safety
const { data } = trpc.todo.list.useQuery();
//      ^? Todo[]
```

**Alternatives:**
- **GraphQL**: More complex setup, over-fetching issues
- **REST**: No type safety, manual typing
- **gRPC**: Not web-friendly

**Trade-offs:**
- ⚠️ Coupled to TypeScript
- ⚠️ Not ideal for public APIs (use REST/GraphQL for that)

---

## Database & ORM

### Decision: Drizzle ORM

**Why?**
- ✅ **Superior TypeScript support**: Best-in-class type inference
- ✅ **SQL-like syntax**: Easy to learn if you know SQL
- ✅ **Lightweight**: Minimal runtime overhead
- ✅ **Great migrations**: Simple, predictable
- ✅ **No magic**: Explicit and clear

**Example:**
```typescript
// Type-safe queries
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.id, userId));
//  ^? { id: string, name: string, ... }[]

// Joins with full type safety
const postsWithAuthors = await db
  .select()
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id));
```

**Alternatives:**
- **Prisma**: Slower, more magical, better docs
- **TypeORM**: Decorator-based, less type-safe
- **Kysely**: Similar to Drizzle, smaller ecosystem

**Why not Prisma?**
- Slower query building
- Generated client adds build step
- Less control over queries
- Migration workflow more complex

---

## Backend Services

### Decision: Supabase

**Why?**
- ✅ **Complete backend**: Database, Auth, Storage, Functions
- ✅ **PostgreSQL**: Industry-standard database
- ✅ **Self-hostable**: Not locked into their cloud
- ✅ **Great local DX**: Docker-based local development
- ✅ **Generous free tier**: Perfect for side projects

**What Supabase Provides:**
- PostgreSQL database
- Authentication (email, OAuth, magic links)
- File storage
- Real-time subscriptions
- Edge functions
- Database backups

**Alternatives:**
- **Firebase**: Less flexible, NoSQL
- **AWS Amplify**: More complex, vendor lock-in
- **PlanetScale**: Database only
- **Custom backend**: More work to maintain

**Trade-offs:**
- ⚠️ Vendor lock-in (mitigated by self-hosting option)
- ⚠️ Less control than custom backend

---

## UI Framework

### Decision: shadcn/ui + Tailwind CSS

**Why shadcn/ui?**
- ✅ **You own the code**: Components live in your repo
- ✅ **Fully customizable**: Change anything
- ✅ **Accessible**: Built on Radix UI primitives
- ✅ **No bundle bloat**: Only ship what you use
- ✅ **Beautiful defaults**: Professional design out of the box

**Why Tailwind?**
- ✅ **Utility-first**: Fast development
- ✅ **Consistent design**: Design tokens built-in
- ✅ **Small CSS**: PurgeCSS removes unused styles
- ✅ **Great DX**: IntelliSense support
- ✅ **Dark mode**: First-class support

**Alternatives:**
- **MUI/Chakra**: Heavier, less customizable
- **Ant Design**: Opinionated Chinese aesthetic
- **Pure Tailwind**: No component library
- **CSS Modules**: More boilerplate

---

## Testing Strategy

### Decision: Vitest + React Testing Library + Playwright

**Why Vitest?**
- ✅ **Fast**: ESM-first, parallel execution
- ✅ **Jest-compatible**: Easy migration
- ✅ **Great DX**: Watch mode, UI, coverage
- ✅ **Vite integration**: Share config with dev server

**Why React Testing Library?**
- ✅ **Best practices**: Test like users interact
- ✅ **Accessible**: Encourages semantic HTML
- ✅ **Simple API**: Easy to learn

**Why Playwright?**
- ✅ **Multi-browser**: Chrome, Firefox, Safari
- ✅ **Auto-wait**: Reliable tests
- ✅ **Modern**: Better than Selenium/Cypress
- ✅ **Great API**: Easy to write tests

**Testing Philosophy:**
- Unit tests for business logic
- Component tests for UI behavior
- E2E tests for critical paths
- Focus on user behavior, not implementation

**Alternatives:**
- **Jest**: Slower than Vitest
- **Cypress**: Component testing not as good
- **Testing Library alone**: Need E2E solution

---

## Code Quality

### Decision: ESLint + Prettier + Husky

**Why ESLint 9 (Flat Config)?**
- ✅ **Modern**: New flat config format
- ✅ **Flexible**: Easy to customize
- ✅ **TypeScript**: First-class support

**Why Prettier?**
- ✅ **Consistent**: No style debates
- ✅ **Auto-fix**: Format on save
- ✅ **Zero config**: Works out of box

**Why Husky + lint-staged?**
- ✅ **Pre-commit**: Catch issues before commit
- ✅ **Fast**: Only lint staged files
- ✅ **Enforce quality**: Can't commit bad code

**Why Commitlint?**
- ✅ **Conventional commits**: Standardized messages
- ✅ **Changelog generation**: Automated release notes
- ✅ **Semantic versioning**: Clear version bumps

---

## Package Manager

### Decision: pnpm

**Why?**
- ✅ **Fast**: Faster than npm/yarn
- ✅ **Disk efficient**: Shared global store
- ✅ **Strict**: No phantom dependencies
- ✅ **Workspace support**: First-class monorepo support

**Alternatives:**
- **npm**: Slower, less efficient
- **Yarn**: Classic is deprecated, Berry is different
- **Bun**: Too new, ecosystem not mature

---

## Framework Choices

### Web: Next.js 14 (App Router)

**Why?**
- ✅ **React Server Components**: Better performance
- ✅ **File-based routing**: Intuitive
- ✅ **Built-in optimization**: Images, fonts, etc.
- ✅ **Full-stack**: API routes + frontend
- ✅ **Vercel integration**: Easy deployment

### Mobile: Expo

**Why?**
- ✅ **Managed workflow**: Less native code
- ✅ **OTA updates**: Update without app store
- ✅ **Great DX**: Fast refresh, dev tools
- ✅ **Cross-platform**: iOS + Android from one codebase

### Extension: React

**Why?**
- ✅ **Familiar**: Same as web app
- ✅ **Component reuse**: Share UI components
- ✅ **Modern**: Hooks, etc.

---

## Design Principles

### 1. Developer Experience First
- Fast feedback loops
- Clear error messages
- Great tooling

### 2. Type Safety Everywhere
- Runtime validation with Zod
- Compile-time safety with TypeScript
- Database types from schema

### 3. Convention Over Configuration
- Sensible defaults
- Easy to change when needed
- Clear file structure

### 4. Performance By Default
- Build-time optimization
- Code splitting
- Image optimization
- Caching strategies

### 5. Production Ready
- Security best practices
- Error handling
- Monitoring hooks
- Deployment automation

---

## Future Considerations

### Potential Additions

- **Monitoring**: Sentry, LogRocket
- **Analytics**: PostHog, Plausible
- **Feature Flags**: LaunchDarkly, Flagsmith
- **Email**: Resend, SendGrid
- **Payments**: Stripe
- **Search**: Algolia, Meilisearch

### Potential Changes

- **Bun**: When ecosystem matures
- **Astro**: For content-heavy sites
- **Solid.js**: For max performance
- **Tauri**: For desktop apps

---

## Questions or Suggestions?

This template makes opinionated choices to provide a great starting point. Don't agree with something? That's okay!

- Open an issue to discuss alternatives
- Fork and customize for your needs
- Contribute improvements back

The best stack is the one that works for your team and project.
