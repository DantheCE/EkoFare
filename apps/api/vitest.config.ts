import { defineConfig } from 'vitest/config';

// Unit lane: pure tests with no I/O. Integration tests (src/**/*.int.test.ts)
// hit the Postgres test DB and run under their own config (vitest.int.config.ts,
// `pnpm test:int`) so a missing DB never breaks the gate-green unit run.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.int.test.ts', 'node_modules/**'],
    // A dummy DATABASE_URL lets modules that construct PrismaClient import
    // cleanly in pure unit tests (Prisma connects lazily, on first query).
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/ekofare_test',
    },
  },
});
