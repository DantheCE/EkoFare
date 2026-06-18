import { defineConfig } from 'vitest/config';

// Integration lane: tests that hit a real Postgres test DB (src/**/*.int.test.ts).
// Run with `pnpm test:int`. Needs DATABASE_URL pointed at the ekofare_test DB
// (the migration must already be applied there). Single-threaded so suites that
// TRUNCATE between tests don't race each other.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.int.test.ts'],
    fileParallelism: false,
    setupFiles: ['src/test/setup.int.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        process.env.DATABASE_URL ??
        'postgresql://postgres:root@localhost:5432/ekofare_test',
      // Admin auth secret for the security suite (dotenv won't override this).
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-jwt-secret-do-not-use-in-prod',
    },
  },
});
