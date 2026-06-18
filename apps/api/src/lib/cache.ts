// ─────────────────────────────────────────────────────────────────────────────
// Cache with stampede protection (build spec §5.6 — day-one non-negotiable).
// Two guards against a thundering herd when a hot key expires:
//   1. Single-flight (in-process): concurrent identical computes collapse into
//      one in-flight promise, so one process never recomputes the same key twice
//      at once.
//   2. XFetch (probabilistic early recomputation): one request recomputes a hot
//      key slightly BEFORE it expires, so the value is refreshed while the old
//      one still serves everyone else — the herd never sees a cold miss.
// Degrades to a plain (single-flighted) compute when Redis is absent.
// ─────────────────────────────────────────────────────────────────────────────

import { getRedis, redisReady } from './redis';
import { logger } from './logger';

interface Wrapped<T> {
  value: T;
  delta: number; // ms the last compute took (XFetch scales early-refresh by this)
  storedAt: number; // epoch ms when stored
}

// XFetch aggressiveness. >1 refreshes earlier; 1.0 is the canonical default.
const BETA = 1.0;

/** Pure XFetch gate: should we recompute now rather than serve the cached value?
 *  Exposed for unit testing (rand is injected for determinism). */
export function shouldRecompute(
  storedAt: number,
  ttlMs: number,
  delta: number,
  now: number,
  rand: number,
): boolean {
  const expiry = storedAt + ttlMs;
  // Classic XFetch: recompute when now - delta*beta*ln(rand) >= expiry.
  // ln(rand) is negative, so this pulls the effective deadline earlier, more so
  // for expensive (high-delta) keys.
  return now - delta * BETA * Math.log(rand) >= expiry;
}

const inflight = new Map<string, Promise<unknown>>();

/** Get `key` from cache or compute it. `compute` runs at most once per key per
 *  process at a time, and is refreshed early (XFetch) before expiry. */
export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  const useRedis = Boolean(redis && redisReady());
  const ttlMs = ttlSeconds * 1000;

  if (useRedis) {
    try {
      const raw = await redis!.get(key);
      if (raw) {
        const w = JSON.parse(raw) as Wrapped<T>;
        if (!shouldRecompute(w.storedAt, ttlMs, w.delta, Date.now(), Math.random())) {
          return w.value;
        }
        // else fall through to recompute early (still single-flighted below).
      }
    } catch (err) {
      logger.warn({ err: (err as Error).message, key }, 'cache read failed (computing live)');
    }
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async () => {
    const start = Date.now();
    const value = await compute();
    const delta = Date.now() - start;
    if (useRedis) {
      try {
        const wrapped: Wrapped<T> = { value, delta, storedAt: Date.now() };
        await redis!.set(key, JSON.stringify(wrapped), 'EX', ttlSeconds);
      } catch (err) {
        logger.warn({ err: (err as Error).message, key }, 'cache write failed (value still returned)');
      }
    }
    return value;
  })().finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}
