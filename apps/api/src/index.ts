// Server entry point. Boots the Express app and wires graceful shutdown so the
// Prisma and Redis connections close cleanly on SIGTERM/SIGINT (Railway/Render
// send SIGTERM on deploy).
import { createApp } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeRedis } from './lib/redis';
import { rebuildFeaturedRoutes } from './services/featured.service';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`EkoFare API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Featured-route board: rebuild shortly after boot, then hourly. A plain
// interval (not node-cron) keeps this dependency-free — "every hour" needs no
// cron expression. Failures are logged and swallowed so the job never crashes
// the process. unref() lets the timer not hold the event loop open on shutdown.
const FEATURED_REBUILD_MS = 60 * 60 * 1000;
const rebuildFeatured = () =>
  rebuildFeaturedRoutes().catch((err) =>
    logger.error({ err: (err as Error).message }, 'featured rebuild failed'),
  );
setTimeout(rebuildFeatured, 10_000).unref();
setInterval(rebuildFeatured, FEATURED_REBUILD_MS).unref();

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`);
  server.close();
  await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
