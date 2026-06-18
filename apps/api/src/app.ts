// ─────────────────────────────────────────────────────────────────────────────
// Express app factory. Kept separate from index.ts (which calls listen) so the
// integration suite can mount the app with Supertest without binding a port.
// Routers mount at ROOT (/routes, /contributions, /stops) — the frontend calls
// un-prefixed paths (see apps/web/src/lib/api/client.ts). Do NOT add an /api
// prefix; it would break the wire contract.
// ─────────────────────────────────────────────────────────────────────────────

import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { ZodError } from 'zod';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { pingRedis, redisReady } from './lib/redis';
import { ApiError } from './lib/errors';
import { env, isProd } from './lib/env';
import { contribLimiter, readLimiter } from './middleware/rateLimit';
import { contributionsRouter } from './routes/contributions.router';
import { routesRouter } from './routes/routes.router';
import { stopsRouter } from './routes/stops.router';
import { flagsRouter } from './routes/flags.router';
import { adminRouter } from './routes/admin.router';

export function createApp(): Express {
  const app = express();

  // Behind a platform proxy (Railway/Render) in prod, trust the first hop so
  // req.ip is the real client (rate limiting keys on it).
  if (isProd) app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  // Liveness + readiness. DB is required; Redis is optional (cache degrades to a
  // no-op), so its absence is reported but does not fail the check. A DB outage
  // returns 503 so orchestrators stop routing traffic here.
  app.get('/health', async (_req: Request, res: Response) => {
    const [dbOk, redisOk] = await Promise.all([
      prisma
        .$queryRaw`SELECT 1`
        .then(() => true)
        .catch(() => false),
      pingRedis(),
    ]);

    const status = dbOk ? 200 : 503;
    res.status(status).json({
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      redis: redisOk ? 'up' : redisReady() ? 'up' : env.REDIS_URL ? 'down' : 'disabled',
    });
  });

  // ── Routers (mounted at root — no /api prefix; see header note) ─────────────
  // Writes are limited per fingerprint/hour; reads per IP/minute.
  app.use('/contributions', contribLimiter, contributionsRouter);
  app.use('/routes', readLimiter, routesRouter);
  app.use('/stops', readLimiter, stopsRouter);
  app.use('/flags', readLimiter, flagsRouter);
  app.use('/admin', readLimiter, adminRouter);

  // 404 for anything unmatched.
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` });
  });

  // Central error handler: typed ApiError → its status; ZodError → 400; else 500.
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json(err.toBody());
    }
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Request validation failed.', details });
    }
    req.log?.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'INTERNAL', message: 'Something went wrong.' });
  });

  return app;
}
