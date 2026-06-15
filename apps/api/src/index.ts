// Server entry point. Boots the Express app and wires graceful shutdown so the
// Prisma and Redis connections close cleanly on SIGTERM/SIGINT (Railway/Render
// send SIGTERM on deploy).
import { createApp } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeRedis } from './lib/redis';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`EkoFare API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`);
  server.close();
  await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
