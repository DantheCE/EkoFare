import { describe, it, expect } from 'vitest';
import { shouldRecompute, cached } from './cache';

describe('shouldRecompute (XFetch gate)', () => {
  const storedAt = 1_000_000;
  const ttlMs = 60_000; // expires at 1_060_000
  const delta = 200; // cheap-ish compute

  it('serves the cached value early in the TTL window', () => {
    // rand≈1 → ln≈0 → effective deadline ≈ real expiry; well before it we serve.
    expect(shouldRecompute(storedAt, ttlMs, delta, storedAt + 1_000, 0.99)).toBe(false);
  });

  it('recomputes once the real expiry has passed regardless of rand', () => {
    expect(shouldRecompute(storedAt, ttlMs, delta, storedAt + ttlMs + 1, 0.999)).toBe(true);
  });

  it('recomputes earlier for an expensive key (large delta) on an unlucky rand', () => {
    const cheap = shouldRecompute(storedAt, ttlMs, 10, storedAt + 59_000, 0.0001);
    const expensive = shouldRecompute(storedAt, ttlMs, 100_000, storedAt + 59_000, 0.0001);
    // Same moment + same rand: the expensive key is the one that refreshes early.
    expect(expensive).toBe(true);
    expect(cheap).toBe(false);
  });
});

describe('cached (no Redis — degrades to single-flighted compute)', () => {
  it('computes and returns the value', async () => {
    const v = await cached('k1', 60, async () => 42);
    expect(v).toBe(42);
  });

  it('collapses concurrent identical computes into a single call (single-flight)', async () => {
    let calls = 0;
    const compute = () =>
      new Promise<number>((resolve) => {
        calls++;
        setTimeout(() => resolve(7), 20);
      });
    const [a, b, c] = await Promise.all([
      cached('k2', 60, compute),
      cached('k2', 60, compute),
      cached('k2', 60, compute),
    ]);
    expect([a, b, c]).toEqual([7, 7, 7]);
    expect(calls).toBe(1); // three callers, one compute
  });

  it('recomputes after the in-flight promise settles (no Redis persistence)', async () => {
    let calls = 0;
    const compute = async () => {
      calls++;
      return calls;
    };
    expect(await cached('k3', 60, compute)).toBe(1);
    expect(await cached('k3', 60, compute)).toBe(2); // nothing cached without Redis
  });
});
