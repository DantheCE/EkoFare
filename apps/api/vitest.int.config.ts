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
    // Each test reseeds the graph (several ingests + a rebuild) against a real
    // Postgres; that runs 4-5s on a slow box, right at vitest's 5s default. Give
    // the lane headroom so the suite doesn't flake on timing alone.
    testTimeout: 20000,
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
