// Structured JSON logging (build spec §11). Pretty only in local dev; raw JSON
// in prod and test (test must not depend on the pino-pretty transport worker).
import pino from 'pino';
import { env, isProd } from './env';

const pretty = env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  ...(pretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
