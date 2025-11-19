import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'web',
      root: './apps/web',
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/e2e/**'],
    },
  },
  {
    test: {
      name: 'mobile',
      root: './apps/mobile',
      environment: 'node',
      setupFiles: ['./test/setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'extension',
      root: './apps/extension',
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'api',
      root: './packages/api',
      environment: 'node',
      include: ['**/*.{test,spec}.ts'],
    },
  },
  {
    test: {
      name: 'database',
      root: './packages/database',
      environment: 'node',
      include: ['**/*.{test,spec}.ts'],
    },
  },
]);
