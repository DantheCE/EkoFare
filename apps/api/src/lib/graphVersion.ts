// ─────────────────────────────────────────────────────────────────────────────
// Global graph version (build spec §5.5). Bumped on any connection change and
// folded into cache keys so stale computed routes fall out naturally instead of
// being individually enumerated and deleted. Lives in Redis so it is shared
// across replicas; falls back to an in-process counter when Redis is absent
// (single-process dev — and with no Redis there is no cache to invalidate
// anyway, so the in-memory value is purely cosmetic).
// ─────────────────────────────────────────────────────────────────────────────

import { getRedis, redisReady } from './redis';
import { logger } from './logger';

const KEY = 'ekofare:graph_version';
let memVersion = 0;

export async function bumpGraphVersion(): Promise<number> {
  const redis = getRedis();
  if (redis && redisReady()) {
    try {
      return await redis.incr(KEY);
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'graph_version bump failed (using in-memory)');
    }
  }
  return ++memVersion;
}

export async function getGraphVersion(): Promise<number> {
  const redis = getRedis();
  if (redis && redisReady()) {
    try {
      const v = await redis.get(KEY);
      return v ? Number(v) : 0;
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'graph_version read failed (using in-memory)');
    }
  }
  return memVersion;
}
