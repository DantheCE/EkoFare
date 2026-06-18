// Single PrismaClient per process (avoids exhausting connections under tsx watch
// hot-reload, which re-evaluates modules). See Prisma's "best practice" note.
import { PrismaClient } from '@prisma/client';
import { isProd } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
