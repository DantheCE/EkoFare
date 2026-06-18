// ─────────────────────────────────────────────────────────────────────────────
// Integration: the Redis-backed cache path (only meaningful when Redis is up).
// Unit tests cover the no-Redis degradation and the XFetch math; this proves the
// real round-trip — a value is persisted and the second call is served from
// Redis without recomputing. Run with `pnpm test:int` against a live Redis.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from 'vitest';
import { cached } from './cache';
import { getRedis, redisReady } from './redis';

const redis = getRedis();

describe('cache (Redis-backed)', () => {
  beforeAll(async () => {
    // lazyConnect: make sure we're connected before asserting on cache behavior.
    if (redis && redis.status !== 'ready') {
      await redis.connect().catch(() => undefined);
    }
  });

  it('persists a value and serves the second call from cache (computes once)', async () => {
    if (!redisReady()) {
      // No live Redis in this environment — the unit suite covers degradation.
      return;
    }
    const key = 'test:cache:persist';
    await redis!.del(key);

    let calls = 0;
    const compute = async () => {
      calls++;
      return { answer: 42 };
    };

    const first = await cached(key, 300, compute);
    const second = await cached(key, 300, compute);

    expect(first).toEqual({ answer: 42 });
    expect(second).toEqual({ answer: 42 });
    expect(calls).toBe(1); // second call hit Redis, did not recompute

    // Confirm it really landed in Redis with the wrapper shape.
    const raw = await redis!.get(key);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toMatchObject({ value: { answer: 42 } });

    await redis!.del(key);
  });
});
