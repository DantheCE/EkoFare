// Integration-suite teardown. Now that REDIS_URL is set, the cache opens a real
// Redis socket during these tests; close it (and Prisma) after each test file so
// no open handle keeps the worker alive.
import { afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { closeRedis } from '../lib/redis';

afterAll(async () => {
  await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
});
