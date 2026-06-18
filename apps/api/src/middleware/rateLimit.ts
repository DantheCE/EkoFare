// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting (build spec §8). Two limiters:
//   - contributions: RATE_LIMIT_CONTRIB_PER_HOUR per hour, keyed by FINGERPRINT
//     (more stable than IP behind carrier NAT — the same anonymous device is
//     limited even if its IP shifts).
//   - reads: RATE_LIMIT_READ_PER_MIN per minute, keyed by IP.
// In production the counter lives in Redis (rate-limit-redis) so the limit is
// GLOBAL across instances — three replicas still enforce one shared budget, not
// three. In test/dev-without-Redis it falls back to an in-process store. The 429
// body matches the frontend's ContributionRateLimitError contract.
// ─────────────────────────────────────────────────────────────────────────────

import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request, Response } from 'express';
import { env, isTest } from '../lib/env';
import { getRedis } from '../lib/redis';
import { fingerprintFromRequest } from '../lib/fingerprint';

// A Redis-backed store keyed by prefix, or undefined to use the in-memory store.
// Disabled under test so suites are deterministic and isolated per app instance.
function store(prefix: string): Options['store'] | undefined {
  const redis = getRedis();
  if (!redis || isTest) return undefined;
  return new RedisStore({
    prefix,
    // rate-limit-redis speaks raw commands; ioredis `call` accepts them.
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<never>,
  });
}

function retryAfterSeconds(req: Request): number {
  // express-rate-limit attaches req.rateLimit; type it locally to avoid relying
  // on the global augmentation being in scope.
  const reset = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
  if (!reset) return 60;
  return Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000));
}

export const contribLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: env.RATE_LIMIT_CONTRIB_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => fingerprintFromRequest(req),
  store: store('rl:contrib:'),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many contributions. Please try again later.',
      retry_after: retryAfterSeconds(req),
    });
  },
  // We key on a fingerprint, not an IP, so express-rate-limit's IP/proxy
  // validation checks don't apply here.
  validate: false,
});

export const readLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: env.RATE_LIMIT_READ_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  store: store('rl:read:'),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
      retry_after: retryAfterSeconds(req),
    });
  },
});
