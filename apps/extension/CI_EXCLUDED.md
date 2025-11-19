# CI Exclusion Notice

⚠️ This package is currently **excluded from CI checks**.

## Why?

This package is a placeholder for future browser extension development and is not yet ready for continuous integration.

## What This Means

- ⏭️ Linting is skipped in CI
- ⏭️ Type checking is skipped in CI
- ⏭️ Build is skipped in CI
- ✅ Local development is unaffected

## When Will This Be Enabled?

When the browser extension development begins and the package has:

- Working build configuration
- Passing lint checks
- Passing type checks
- Valid package.json scripts

## How to Enable

See [docs/PLACEHOLDER_PACKAGES.md](../../docs/PLACEHOLDER_PACKAGES.md) for instructions on enabling this package in CI.

## Testing Locally

You can still run checks locally:

```bash
cd apps/extension
pnpm lint
pnpm type-check
pnpm build
```

Or from root:

```bash
pnpm --filter=@grasp/extension lint
pnpm --filter=@grasp/extension type-check
pnpm --filter=@grasp/extension build
```
