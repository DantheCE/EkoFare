// ─────────────────────────────────────────────────────────────────────────────
// Seed (build spec §13). Builds a realistic Lagos network as pure graph data —
// stops, directed connections per vehicle, and synthetic fare reports tuned to
// land each connection at the intended confidence (UNVERIFIED / VERIFIED / MAJOR).
// Routes are never seeded: the headline Ikeja→TBS journey emerges only because
// its legs (Ikeja→Oshodi, Oshodi→CMS, CMS→TBS) are each well-reported — no single
// submission spans it.
//
// Idempotent: re-running tops each connection UP to its target report count and
// re-points nothing destructively, so `pnpm db:seed` is safe to run repeatedly.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../src/lib/prisma';
import { resolveOrCreate } from '../src/services/normalize.service';
import { recomputeConsensus } from '../src/services/consensus.service';
import { rebuildFeaturedRoutes } from '../src/services/featured.service';
import { bumpGraphVersion } from '../src/lib/graphVersion';
import { invalidateGraphCache } from '../src/services/graph.service';
import { closeRedis } from '../src/lib/redis';
import { logger } from '../src/lib/logger';
import type { Vehicle } from '../src/types';

interface Leg {
  from: string;
  to: string;
  vehicle: Vehicle;
  fare: number; // consensus target (₦)
  duration: number; // avg minutes
  reports: number; // → confidence: >=20 MAJOR, >=5 VERIFIED, 3-4 UNVERIFIED-but-routable
}

// Small, bounded jitter so reports cluster around the target without tripping
// outlier detection (well within OUTLIER_SIGMA standard deviations).
const JITTER = [0, 15, -15, 10, -10, 5, -5];

const NETWORK: Leg[] = [
  // ── Main spine: Ikeja → TBS, DANFO (the stitched-transfer showcase) ─────────
  { from: 'Ikeja', to: 'Oshodi', vehicle: 'DANFO', fare: 300, duration: 25, reports: 26 }, // MAJOR
  { from: 'Oshodi', to: 'CMS', vehicle: 'DANFO', fare: 400, duration: 30, reports: 22 }, // MAJOR
  { from: 'CMS', to: 'TBS', vehicle: 'DANFO', fare: 150, duration: 12, reports: 18 }, // VERIFIED

  // ── Parallel BRT corridor (same endpoints, cheaper, separate vehicle) ───────
  { from: 'Ikeja', to: 'Oshodi', vehicle: 'BRT', fare: 250, duration: 22, reports: 20 }, // MAJOR
  { from: 'Oshodi', to: 'CMS', vehicle: 'BRT', fare: 300, duration: 28, reports: 16 }, // VERIFIED
  { from: 'CMS', to: 'TBS', vehicle: 'BRT', fare: 100, duration: 10, reports: 12 }, // VERIFIED

  // ── Northern loop: Ikeja → Yaba → CMS (an alternative to Oshodi) ────────────
  { from: 'Ikeja', to: 'Maryland', vehicle: 'DANFO', fare: 150, duration: 12, reports: 13 }, // VERIFIED
  { from: 'Maryland', to: 'Yaba', vehicle: 'DANFO', fare: 200, duration: 15, reports: 11 }, // VERIFIED
  { from: 'Yaba', to: 'CMS', vehicle: 'DANFO', fare: 250, duration: 18, reports: 15 }, // VERIFIED

  // ── Western arm: Oshodi → Mile 2 → Festac ───────────────────────────────────
  { from: 'Oshodi', to: 'Mile 2', vehicle: 'DANFO', fare: 350, duration: 28, reports: 14 }, // VERIFIED
  { from: 'Mile 2', to: 'Festac', vehicle: 'DANFO', fare: 200, duration: 16, reports: 9 }, // VERIFIED
  { from: 'Festac', to: 'Mile 2', vehicle: 'DANFO', fare: 200, duration: 16, reports: 7 }, // VERIFIED (reverse)

  // ── Eastern arm: Ikeja → Ojota → Ketu → Mile 12 ─────────────────────────────
  { from: 'Ikeja', to: 'Ojota', vehicle: 'DANFO', fare: 180, duration: 14, reports: 8 }, // VERIFIED
  { from: 'Ojota', to: 'Ketu', vehicle: 'DANFO', fare: 120, duration: 10, reports: 6 }, // VERIFIED
  { from: 'Ketu', to: 'Mile 12', vehicle: 'DANFO', fare: 150, duration: 12, reports: 5 }, // VERIFIED
  { from: 'Ojota', to: 'Maryland', vehicle: 'DANFO', fare: 100, duration: 8, reports: 4 }, // UNVERIFIED (routable)
  { from: 'Berger', to: 'Ojota', vehicle: 'DANFO', fare: 200, duration: 18, reports: 3 }, // UNVERIFIED (just routable)

  // ── KEKE feeder (short hop) ─────────────────────────────────────────────────
  { from: 'Yaba', to: 'Ebute Metta', vehicle: 'KEKE', fare: 80, duration: 6, reports: 6 }, // VERIFIED

  // ── Below the routing threshold: present, but NOT routable (demonstrates the
  //    MIN_REPORTS_FOR_ROUTING gate — appears in the graph, excluded from paths)
  { from: 'Egbeda', to: 'Iyana Ipaja', vehicle: 'DANFO', fare: 150, duration: 14, reports: 2 },
];

async function seedLeg(leg: Leg): Promise<void> {
  const from = await resolveOrCreate(leg.from);
  const to = await resolveOrCreate(leg.to);

  const conn = await prisma.connection.upsert({
    where: {
      from_stop_id_to_stop_id_vehicle: {
        from_stop_id: from.id,
        to_stop_id: to.id,
        vehicle: leg.vehicle,
      },
    },
    create: {
      from_stop_id: from.id,
      to_stop_id: to.id,
      vehicle: leg.vehicle,
      median_fare: leg.fare,
      avg_duration_min: leg.duration,
    },
    update: { avg_duration_min: leg.duration },
    select: { id: true },
  });

  // Top up to the target report count (idempotent across re-runs).
  const have = await prisma.fareReport.count({ where: { connection_id: conn.id } });
  const toAdd = leg.reports - have;
  if (toAdd > 0) {
    const data = Array.from({ length: toAdd }, (_, i) => ({
      connection_id: conn.id,
      fare: leg.fare + JITTER[(have + i) % JITTER.length],
      fingerprint: `seed-${conn.id}-${have + i}`,
    }));
    await prisma.fareReport.createMany({ data });
  }

  await recomputeConsensus(conn.id);
}

async function main(): Promise<void> {
  logger.info(`seeding ${NETWORK.length} connections…`);
  for (const leg of NETWORK) {
    await seedLeg(leg);
  }

  // Invalidate caches and rebuild the featured board so the deployed API serves
  // a populated board immediately. bumpGraphVersion propagates to a running
  // server via Redis (its next read reloads the in-memory graph).
  await bumpGraphVersion();
  invalidateGraphCache();
  const featured = await rebuildFeaturedRoutes();

  const [stops, connections, reports] = await Promise.all([
    prisma.stop.count(),
    prisma.connection.count(),
    prisma.fareReport.count(),
  ]);
  logger.info({ stops, connections, reports, featured }, 'seed complete');
}

main()
  .catch((err) => {
    logger.error({ err: (err as Error).message }, 'seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
  });
