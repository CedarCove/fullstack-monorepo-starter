# Fullstack Monorepo Starter

> A production-ready TypeScript monorepo template with Next.js, Expo, Chrome Extension, Supabase, tRPC, Drizzle ORM, and comprehensive testing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-1.12-EF4444)](https://turbo.build/repo)

## Features

- 🏗️ **Monorepo Architecture** - Turborepo + pnpm workspaces for optimal build performance
- 🎨 **Modern UI** - shadcn/ui + Tailwind CSS with dark mode support
- 🔐 **Type-Safe API** - tRPC v11 with end-to-end type safety
- 🗄️ **Database** - Drizzle ORM with PostgreSQL via Supabase
- ✅ **Comprehensive Testing** - Vitest, React Testing Library, Playwright
- 📱 **Multi-Platform** - Next.js 14, Expo, and Chrome Extension MV3
- 🔄 **CI/CD Ready** - GitHub Actions workflows included
- 🎯 **Code Quality** - ESLint, Prettier, Husky, lint-staged, commitlint
- 📦 **Template Ready** - Easy customization and app removal scripts

## Quick Start

### Using This Template

1. Click "Use this template" on GitHub or:
   ```bash
   git clone https://github.com/pycatcedar/fullstack-monorepo-starter.git my-project
   cd my-project
   ```

2. Run the setup script:
   ```bash
   pnpm install
   pnpm setup
   ```

3. Start local Supabase:
   ```bash
   pnpm supabase:start
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

Visit:
- Web: http://localhost:3000
- Mobile: Use Expo Go app
- Extension: Load unpacked from `apps/extension/dist`

## Project Structure

```
fullstack-monorepo-starter/
├── apps/
│   ├── web/          # Next.js 14 (App Router)
│   ├── mobile/       # Expo/React Native
│   └── extension/    # Chrome Extension (MV3)
├── packages/
│   ├── api/          # tRPC routers
│   └── database/     # Drizzle ORM + Supabase
├── scripts/          # Automation utilities
└── docs/             # Documentation
```

## Tech Stack

### Core
- **Build System**: Turborepo, pnpm workspaces
- **Language**: TypeScript 5.7+
- **Package Manager**: pnpm 8+

### Frontend
- **Web**: Next.js 14 (App Router), React 18
- **Mobile**: Expo, React Native, Expo Router
- **Extension**: Chrome Extension Manifest v3
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **State**: TanStack Query (React Query)

### Backend
- **API**: tRPC v11, Zod validation
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

### Testing
- **Unit/Integration**: Vitest, React Testing Library
- **E2E**: Playwright
- **Coverage**: V8 provider

### Code Quality
- **Linting**: ESLint 9+ (flat config)
- **Formatting**: Prettier
- **Git Hooks**: Husky, lint-staged
- **Commits**: Conventional Commits (commitlint)

## Available Scripts

### Development
```bash
pnpm dev              # Start all apps
pnpm dev:web          # Start web app only
pnpm dev:mobile       # Start mobile app only
pnpm dev:extension    # Build extension in watch mode
```

### Building
```bash
pnpm build            # Build all apps
pnpm build:web        # Build web app only
pnpm build:mobile     # Build mobile app only
pnpm build:extension  # Build extension only
```

### Testing
```bash
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests
pnpm test:e2e         # Run E2E tests
```

### Database
```bash
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database with example data
```

### Code Quality
```bash
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm type-check       # Check TypeScript types
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting
```

### Template Utilities
```bash
pnpm setup            # Interactive project setup
pnpm remove:mobile    # Remove mobile app
pnpm remove:extension # Remove extension app
pnpm validate         # Validate setup completion
```

### Supabase
```bash
pnpm supabase:start   # Start local Supabase
pnpm supabase:stop    # Stop local Supabase
pnpm supabase:status  # Check Supabase status
```

## Customization

See [CUSTOMIZATION.md](CUSTOMIZATION.md) for detailed customization guide including:
- Renaming the project
- Updating package scopes
- Configuring environment variables
- Adding/removing applications
- Customizing the tech stack

## Removing Apps

Don't need all three apps? Remove them easily:

```bash
# Remove mobile app
pnpm remove:mobile

# Remove extension
pnpm remove:extension
```

Or see [docs/REMOVAL_GUIDES.md](docs/REMOVAL_GUIDES.md) for manual removal instructions.

## Documentation

- **Getting Started**
  - [Quick Start](docs/getting-started/QUICK_START.md)
  - [Customization Guide](CUSTOMIZATION.md)

- **Development**
  - [Architecture Decisions](ARCHITECTURE_DECISIONS.md)
  - [Testing Guide](docs/testing/SETUP.md)
  - [Database Workflow](docs/development/DATABASE.md)

- **Deployment**
  - [CI/CD Setup](docs/deployment/SETUP.md)
  - [Deployment Workflows](docs/deployment/WORKFLOWS.md)

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

For local development, Supabase is configured to work out of the box. For production, see the [Production Setup Guide](docs/getting-started/PRODUCTION_SETUP.md).

## Architecture Decisions

This template makes opinionated choices to provide a cohesive developer experience:

- **Turborepo**: Best-in-class monorepo build system with intelligent caching
- **tRPC**: End-to-end type safety without code generation
- **Drizzle**: Modern ORM with superior TypeScript support
- **Supabase**: Complete backend (database, auth, storage) with great DX
- **shadcn/ui**: Customizable components you own, not a dependency
- **Vitest**: Fast, modern testing framework with great DX

See [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) for detailed reasoning.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT © [Your Name]

---

## What's Included

### Apps

**Web** (`apps/web`)
- Next.js 14 with App Router
- shadcn/ui components
- Server-side rendering
- tRPC integration
- Supabase auth

**Mobile** (`apps/mobile`)
- Expo with Expo Router
- React Native
- tRPC integration
- Cross-platform (iOS & Android)

**Extension** (`apps/extension`)
- Chrome Extension Manifest v3
- React-based popup
- Background service worker
- Content scripts

### Packages

**API** (`packages/api`)
- tRPC router definitions
- Zod schemas for validation
- Shared API logic
- Type-safe procedures

**Database** (`packages/database`)
- Drizzle ORM schemas
- Supabase client configuration
- Database utilities
- Migration management

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/pycatcedar/fullstack-monorepo-starter/issues)
- 💬 [Discussions](https://github.com/pycatcedar/fullstack-monorepo-starter/discussions)

## Acknowledgments

Built with amazing open-source projects:
- [Turborepo](https://turbo.build)
- [Next.js](https://nextjs.org)
- [tRPC](https://trpc.io)
- [Drizzle](https://orm.drizzle.team)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Expo](https://expo.dev)
