// ─────────────────────────────────────────────────────────────────────────────
// Redis connection with graceful degradation. When REDIS_URL is unset (or the
// server is unreachable) the API still runs: the cache layer (lib/cache.ts,
// Phase 3) treats a null client as "always miss, never store". This keeps local
// dev and the test suite runnable without Redis while production gets the real
// caching + stampede protection the spec mandates.
// ─────────────────────────────────────────────────────────────────────────────

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let client: Redis | null = null;

if (env.REDIS_URL) {
  client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    // Bounded backoff: don't hammer a down Redis, but recover when it returns.
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  client.on('error', (err) => {
    logger.warn({ err: err.message }, 'redis error (continuing without cache)');
  });
  client.on('connect', () => logger.info('redis connected'));

  client.connect().catch((err) => {
    logger.warn({ err: err.message }, 'redis initial connect failed (cache disabled)');
  });
} else {
  logger.warn('REDIS_URL not set — running without cache (every read computes live)');
}

/** The shared client, or null when Redis is not configured/available. */
export function getRedis(): Redis | null {
  return client;
}

/** True only when a live, ready connection exists. Used by /health and cache. */
export function redisReady(): boolean {
  return client !== null && client.status === 'ready';
}

/** Liveness probe for /health. Returns false instead of throwing. */
export async function pingRedis(): Promise<boolean> {
  if (!client) return false;
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/** Graceful shutdown hook. */
export async function closeRedis(): Promise<void> {
  if (client) await client.quit().catch(() => undefined);
}
