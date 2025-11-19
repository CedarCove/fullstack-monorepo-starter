# Removal Guides

This guide explains how to remove applications or features you don't need from the template.

## Table of Contents

1. [Quick Removal (Automated)](#quick-removal-automated)
2. [Remove Mobile App](#remove-mobile-app)
3. [Remove Chrome Extension](#remove-chrome-extension)
4. [Remove shadcn/ui](#remove-shadcnui)
5. [Remove Testing Infrastructure](#remove-testing-infrastructure)
6. [Switch Database Providers](#switch-database-providers)

---

## Quick Removal (Automated)

Use the built-in scripts for easy removal:

```bash
# Remove mobile app
pnpm remove:mobile

# Remove extension
pnpm remove:extension
```

These scripts will:
- Delete the app directory
- Update workspace configuration
- Remove related scripts from root `package.json`
- Update documentation references

---

## Remove Mobile App

### Automated

```bash
pnpm remove:mobile
```

### Manual Steps

1. **Delete directory:**
   ```bash
   rm -rf apps/mobile
   ```

2. **Update `pnpm-workspace.yaml`:**
   ```yaml
   packages:
     - "apps/*"
     - "!apps/mobile"  # Exclude mobile
     - "packages/*"
   ```

3. **Update root `package.json`:**
   Remove these scripts:
   ```json
   {
     "scripts": {
       "dev:mobile": "...",
       "build:mobile": "..."
     }
   }
   ```

4. **Clean up:**
   ```bash
   pnpm install  # Update lockfile
   ```

5. **Verify:**
   ```bash
   pnpm dev  # Should work without mobile
   ```

---

## Remove Chrome Extension

### Automated

```bash
pnpm remove:extension
```

### Manual Steps

1. **Delete directory:**
   ```bash
   rm -rf apps/extension
   ```

2. **Update `pnpm-workspace.yaml`:**
   ```yaml
   packages:
     - "apps/*"
     - "!apps/extension"  # Exclude extension
     - "packages/*"
   ```

3. **Update root `package.json`:**
   Remove these scripts:
   ```json
   {
     "scripts": {
       "dev:extension": "...",
       "build:extension": "..."
     }
   }
   ```

4. **Clean up:**
   ```bash
   pnpm install
   ```

---

## Remove shadcn/ui

If you prefer a different UI library or no component library:

### 1. Remove shadcn/ui components

```bash
rm -rf apps/web/src/components/ui
rm apps/web/components.json
```

### 2. Simplify Tailwind config

Replace `apps/web/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

### 3. Simplify globals.css

Replace `apps/web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Remove dependencies

```bash
cd apps/web
pnpm remove @radix-ui/react-slot class-variance-authority clsx tailwind-merge tailwindcss-animate
```

### 5. Remove utils

```bash
rm apps/web/src/lib/utils.ts
```

---

## Remove Testing Infrastructure

If you don't want the testing setup:

### Remove Vitest

1. **Delete test files:**
   ```bash
   find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | xargs rm
   rm -rf apps/web/test
   rm vitest.workspace.ts
   ```

2. **Remove from turbo.json:**
   ```json
   {
     "pipeline": {
       // Remove these:
       "test": {...},
       "test:unit": {...},
     }
   }
   ```

3. **Remove scripts:**
   ```json
   // root package.json
   {
     "scripts": {
       // Remove test scripts
     }
   }
   ```

### Remove Playwright

1. **Delete E2E tests:**
   ```bash
   rm -rf apps/web/e2e
   rm playwright.config.ts
   ```

2. **Remove dependencies:**
   ```bash
   pnpm remove -D @playwright/test
   ```

---

## Switch Database Providers

### From Supabase to Another Provider

#### 1. Remove Supabase

```bash
rm -rf supabase
pnpm remove @supabase/supabase-js @supabase/ssr
```

#### 2. Update Drizzle Config

Edit `packages/database/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg',  // or 'mysql', 'better-sqlite'
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

#### 3. Update Database Client

Replace `packages/database/src/client.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
```

#### 4. Remove Supabase Auth

Update auth implementation in:
- `apps/web/src/lib/auth.tsx`
- `apps/web/src/lib/supabase.ts`

Replace with your auth provider (Clerk, NextAuth, Auth0, etc.)

### From Drizzle to Prisma

1. **Install Prisma:**
   ```bash
   cd packages/database
   pnpm add prisma @prisma/client
   pnpm prisma init
   ```

2. **Create schema:**
   Create `packages/database/prisma/schema.prisma`

3. **Update exports:**
   Replace `packages/database/src/index.ts`:
   ```typescript
   export * from '@prisma/client';
   export { prisma } from './client';
   ```

4. **Remove Drizzle:**
   ```bash
   pnpm remove drizzle-orm drizzle-kit
   rm -rf src/schema.ts drizzle.config.ts
   ```

---

## Remove Turborepo

To use a simpler monorepo setup:

1. **Remove Turborepo:**
   ```bash
   pnpm remove -w turbo
   rm turbo.json
   ```

2. **Update scripts** to use pnpm workspaces directly:
   ```json
   {
     "scripts": {
       "dev": "pnpm -r --parallel dev",
       "build": "pnpm -r build",
       "test": "pnpm -r test"
     }
   }
   ```

3. **Remove caching:**
   - Delete `.turbo` from `.gitignore`
   - Remove `--filter` flags from scripts

---

## Remove Specific Features

### Remove Husky (Git Hooks)

```bash
pnpm remove -w husky lint-staged
rm -rf .husky
```

Update `package.json`:
```json
{
  "scripts": {
    // Remove "prepare": "husky"
  }
}
```

### Remove Commitlint

```bash
pnpm remove -w @commitlint/cli @commitlint/config-conventional
rm commitlint.config.js
rm .husky/commit-msg
```

### Remove ESLint

```bash
pnpm remove -w eslint @typescript-eslint/* eslint-*
rm eslint.config.js
```

Remove from each app/package:
```bash
find . -name "eslint.config.js" -not -path "*/node_modules/*" | xargs rm
```

### Remove Prettier

```bash
pnpm remove -w prettier
rm .prettierrc .prettierrc.js
```

---

## After Removal

After removing any components:

1. **Clean install:**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

2. **Update documentation:**
   - Update README.md
   - Update CUSTOMIZATION.md
   - Remove relevant docs

3. **Test everything:**
   ```bash
   pnpm dev
   pnpm build
   ```

4. **Commit changes:**
   ```bash
   git add -A
   git commit -m "chore: remove [feature]"
   ```

---

## Common Removal Scenarios

### Minimal Web-Only Setup

Remove:
- ✅ Mobile app
- ✅ Extension
- ✅ Testing (if not needed)

Keep:
- ✅ Web app
- ✅ API package
- ✅ Database package
- ✅ Code quality tools

### API-First Setup

Remove:
- ✅ All frontend apps
- ✅ shadcn/ui
- ✅ Tailwind

Keep:
- ✅ API package
- ✅ Database package
- ✅ Testing
- ✅ Code quality

### Backend-Free Frontend

Remove:
- ✅ API package
- ✅ Database package
- ✅ Supabase

Keep:
- ✅ Frontend apps
- ✅ shadcn/ui
- ✅ Testing

---

## Need Help?

If you encounter issues:

1. Check the [Troubleshooting Guide](getting-started/TROUBLESHOOTING.md)
2. [Open an issue](https://github.com/pycatcedar/fullstack-monorepo-starter/issues)
3. [Start a discussion](https://github.com/pycatcedar/fullstack-monorepo-starter/discussions)
