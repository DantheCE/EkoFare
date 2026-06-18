// ─────────────────────────────────────────────────────────────────────────────
// Integration-test DB helpers. Truncate-and-restart between tests so each case
// starts from an empty graph. Only ever runs against the test DB (NODE_ENV=test);
// it refuses otherwise so a stray import can never wipe a real database.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../lib/prisma';

const TABLES = [
  'FareReport',
  'Connection',
  'StopAlias',
  'FeaturedRoute',
  'AbuseFlag',
  'Stop',
] as const;

/** Wipe all graph tables. CASCADE handles FK order; RESTART IDENTITY resets any
 *  serial sequences. Guarded to the test environment. */
export async function resetDb(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDb() refused: NODE_ENV is not "test"');
  }
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

export { prisma };
