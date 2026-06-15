import { defineConfig } from 'vitest/config';

// Two implicit lanes: pure unit tests (*.test.ts under src/lib + src/services
// that don't touch I/O) and integration tests (src/**/*.int.test.ts, added in
// later phases, which hit the Postgres test DB). Both run under `vitest run`.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // A dummy DATABASE_URL lets modules that construct PrismaClient import
    // cleanly in pure unit tests (Prisma connects lazily, on first query).
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/ekofare_test',
    },
  },
});
