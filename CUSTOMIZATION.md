# Customization Guide

This guide will help you customize the fullstack-monorepo-starter template for your project.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Renaming the Project](#renaming-the-project)
3. [Package Scopes](#package-scopes)
4. [Environment Variables](#environment-variables)
5. [Database Schema](#database-schema)
6. [Removing Applications](#removing-applications)
7. [Adding New Applications](#adding-new-applications)
8. [Customizing UI Theme](#customizing-ui-theme)
9. [Authentication](#authentication)
10. [Deployment Configuration](#deployment-configuration)

---

## Initial Setup

After cloning/generating from the template:

```bash
# 1. Install dependencies
pnpm install

# 2. Run the interactive setup script
pnpm setup

# 3. Start local Supabase
pnpm supabase:start

# 4. Copy environment files
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
cp apps/extension/.env.example apps/extension/.env
```

---

## Renaming the Project

### 1. Update Package Names

**Root `package.json`:**
```json
{
  "name": "your-project-name",
  "description": "Your project description"
}
```

**Each app/package `package.json`:**
```json
{
  "name": "@your-org/app-name"
}
```

### 2. Update Package Scopes

Find and replace `@repo` with your organization scope:

```bash
# Using sed (macOS)
find . -type f -name "package.json" -exec sed -i '' 's/@repo/@your-org/g' {} +

# Or manually update:
# - apps/web/package.json
# - apps/mobile/package.json
# - apps/extension/package.json
# - packages/api/package.json
# - packages/database/package.json
```

### 3. Update Import Paths

If you changed the package scope, update imports:

```bash
# Find all imports
grep -r "@repo/" --include="*.ts" --include="*.tsx"

# Replace (be careful with this!)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/@repo/@your-org/g' {} +
```

### 4. Update Repository URLs

**Root `package.json`:**
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo.git"
  }
}
```

**README.md:**
- Update all GitHub URLs
- Update shields.io badges
- Update clone commands

---

## Package Scopes

The template uses `@repo` as the default package scope. Change this to match your organization:

### Option 1: Keep as @repo
No changes needed. Good for personal projects.

### Option 2: Use Organization Scope
```json
{
  "name": "@your-company/web",
  "name": "@your-company/mobile",
  "name": "@your-company/extension",
  "name": "@your-company/api",
  "name": "@your-company/database"
}
```

### Option 3: Use Project-Specific Scope
```json
{
  "name": "@my-project/web",
  "name": "@my-project/mobile"
}
```

---

## Environment Variables

### Local Development

The template works out-of-the-box with local Supabase. Environment variables are pre-configured in `.env.example`.

### Production

1. **Create Supabase Project** at https://supabase.com

2. **Update `.env`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

3. **Add CI/CD Secrets:**
   - `SUPABASE_ACCESS_TOKEN`
   - `STAGING_PROJECT_REF`
   - `PRODUCTION_PROJECT_REF`
   - `VERCEL_TOKEN` (if using Vercel)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Environment Variable Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your app's URL | ✅ |
| `SUPABASE_ACCESS_TOKEN` | For CI/CD | Production only |

---

## Database Schema

### Modify Existing Schema

Edit `packages/database/src/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const yourTable = pgTable('your_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Generate Migration

```bash
pnpm db:generate
```

### Apply Migration

```bash
# Local
pnpm db:push

# Production (via Supabase CLI)
pnpm db:deploy:production
```

### Example: Add a New Table

```typescript
// packages/database/src/schema.ts
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: uuid('author_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Removing Applications

### Remove Mobile App

```bash
pnpm remove:mobile
```

This will:
- Delete `apps/mobile` directory
- Update `pnpm-workspace.yaml`
- Remove mobile-specific scripts
- Update documentation

### Remove Extension

```bash
pnpm remove:extension
```

### Manual Removal

If scripts fail, see [docs/REMOVAL_GUIDES.md](docs/REMOVAL_GUIDES.md) for manual steps.

---

## Adding New Applications

### Add a New Next.js App

```bash
cd apps
pnpm create next-app@latest my-app --typescript --tailwind --app
```

Update `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "apps/my-app"  # Add this
  - "packages/*"
```

### Add a New Package

```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

Update `package.json`:
```json
{
  "name": "@repo/my-package",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

---

## Customizing UI Theme

### Change Color Scheme

Edit `apps/web/src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Change primary color */
  --radius: 0.75rem;              /* Change border radius */
}
```

### Use Different Base Color

Update `apps/web/tailwind.config.ts`:

```typescript
const config: Config = {
  theme: {
    extend: {
      colors: {
        // Add custom colors
        brand: {
          50: '#...',
          100: '#...',
          // ... through 900
        },
      },
    },
  },
};
```

### Add shadcn/ui Components

```bash
cd apps/web
npx shadcn-ui@latest add button card input
```

---

## Authentication

### Using Supabase Auth

The template is pre-configured with Supabase Auth.

**Add OAuth Providers:**

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub, Google, etc.
3. Add credentials

**Update Auth Component:**
```typescript
// apps/web/src/components/AuthButton.tsx
import { useAuth } from '@/lib/auth';

export function AuthButton() {
  const { user, signIn, signOut } = useAuth();

  const handleGitHubSignIn = () => {
    signIn('github');
  };

  // ...
}
```

### Switch to Different Auth Provider

See [docs/guides/AUTH_PROVIDERS.md](docs/guides/AUTH_PROVIDERS.md) for:
- Clerk
- NextAuth.js
- Auth0
- Custom solution

---

## Deployment Configuration

### Vercel (Web App)

1. Import project to Vercel
2. Set environment variables
3. Deploy automatically on push to `main`

### Supabase (Database)

Already configured! Migrations run via GitHub Actions.

### Expo (Mobile App)

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
eas submit
```

### Chrome Web Store (Extension)

```bash
cd apps/extension
pnpm build
# Upload dist/ folder to Chrome Web Store
```

---

## Common Customizations

### Change Port Numbers

**Web:**
```json
// apps/web/package.json
{
  "scripts": {
    "dev": "next dev -p 4000"
  }
}
```

**Update Playwright:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:4000',
  },
});
```

### Add More Scripts

**Root `package.json`:**
```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

### Customize CI/CD

Edit `.github/workflows/ci.yml`:

```yaml
jobs:
  test:
    steps:
      # Add your custom steps
      - name: Custom step
        run: echo "Custom CI step"
```

---

## Next Steps

After customization:

1. ✅ Run `pnpm validate` to check setup
2. ✅ Test all apps: `pnpm dev`
3. ✅ Run tests: `pnpm test`
4. ✅ Build everything: `pnpm build`
5. ✅ Update documentation
6. ✅ Commit your changes

---

## Getting Help

- 📖 [Full Documentation](docs/)
- 🐛 [Report Issues](https://github.com/pycatcedar/fullstack-monorepo-starter/issues)
- 💬 [Discussions](https://github.com/pycatcedar/fullstack-monorepo-starter/discussions)
