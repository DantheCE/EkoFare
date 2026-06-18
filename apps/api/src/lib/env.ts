// ─────────────────────────────────────────────────────────────────────────────
// Typed, validated environment. Parsed once at boot; import `env` everywhere.
// Defaults mirror the build spec §2.1. REDIS_URL and the admin vars are optional
// so the API boots in a degraded-but-working mode for local dev (cache no-ops,
// admin login disabled) without them.
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import { z } from 'zod';

const intFromEnv = (def: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .pipe(z.number().int().nonnegative());

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  PORT: intFromEnv(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  RATE_LIMIT_CONTRIB_PER_HOUR: intFromEnv(5),
  RATE_LIMIT_READ_PER_MIN: intFromEnv(100),
  MIN_REPORTS_FOR_ROUTING: intFromEnv(3),
  OUTLIER_SIGMA: intFromEnv(2),
  ROUTE_CACHE_TTL_SECONDS: intFromEnv(300),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // Fail fast and loud — a misconfigured env is never worth a half-booted server.
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
