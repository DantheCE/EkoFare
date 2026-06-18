// ─────────────────────────────────────────────────────────────────────────────
// Consensus recompute (build spec §5.3). Given a connection, reload its reports
// in submission order, run the pure consensus math, persist any changed outlier
// flags, and roll the connection's {median_fare, fare_reports, status} up to the
// new consensus. Called after every new report lands inside the same transaction
// so a connection is never observed mid-update.
// ─────────────────────────────────────────────────────────────────────────────

import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { computeConsensus, type ConsensusResult } from '../lib/consensus';

type Db = PrismaClient | Prisma.TransactionClient;

/** Recompute and persist consensus for one connection. Returns the result so
 *  callers can report connections_verified etc. without a second read. */
export async function recomputeConsensus(connectionId: string, db: Db = prisma): Promise<ConsensusResult> {
  // Order matters: outliers[] maps back to these rows positionally.
  const reports = await db.fareReport.findMany({
    where: { connection_id: connectionId },
    orderBy: { created_at: 'asc' },
    select: { id: true, fare: true, is_outlier: true },
  });

  const result = computeConsensus(
    reports.map((r) => r.fare),
    { sigma: env.OUTLIER_SIGMA },
  );

  // Only write the flags that actually flipped — keeps the update set minimal.
  const flips = reports
    .map((r, i) => ({ id: r.id, was: r.is_outlier, now: result.outliers[i] }))
    .filter((r) => r.was !== r.now);
  await Promise.all(
    flips.map((r) => db.fareReport.update({ where: { id: r.id }, data: { is_outlier: r.now } })),
  );

  await db.connection.update({
    where: { id: connectionId },
    data: {
      median_fare: result.median_fare,
      fare_reports: result.fare_reports,
      status: result.status,
    },
  });

  return result;
}
