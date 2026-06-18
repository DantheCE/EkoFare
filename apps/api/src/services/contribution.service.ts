// ─────────────────────────────────────────────────────────────────────────────
// Contribution shred (build spec §5.2). A submission is a single ordered path
// (submitted_name + stops[]). We do NOT store it as a route. Instead we shred it
// into N-1 directed connections (one per adjacent pair, on the submission's
// vehicle) and file one FareReport per connection as evidence. Consensus is then
// recomputed per touched connection. Everything runs in one transaction so a
// half-shredded path is never visible; the graph version is bumped afterwards so
// computed-route caches fall out.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { resolveStops } from './normalize.service';
import { recomputeConsensus } from './consensus.service';
import { bumpGraphVersion } from '../lib/graphVersion';
import type { ContributionInput, ContributionSuccess, ResolvedStop, Vehicle } from '../types';

// A fingerprint may report a given connection at most once per this window;
// resubmissions inside it are dropped (spec §7.2 — cheap anti-spam, paired with
// outlier detection). 24h.
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type IngestResult = ContributionSuccess;

/** Ingest one contribution: resolve stops, shred into edges, file reports,
 *  recompute consensus, bump the graph version. */
export async function ingest(input: ContributionInput, fingerprint: string): Promise<IngestResult> {
  const names = input.stops.map((s) => s.name);
  const fares = input.stops.map((s) => s.leg_fare);
  const vehicle = input.vehicle as Vehicle;

  const { created, verified } = await prisma.$transaction(
    async (tx) => {
      const resolved: ResolvedStop[] = await resolveStops(names, tx);

      let connectionsCreated = 0;
      let connectionsVerified = 0;

      // Walk adjacent pairs. stops[i].leg_fare is the fare FROM stops[i-1] TO
      // stops[i], so the edge resolved[i-1] -> resolved[i] carries fares[i].
      for (let i = 1; i < resolved.length; i++) {
        const from = resolved[i - 1];
        const to = resolved[i];
        const legFare = fares[i];

        // Self-loop (e.g. a repeated/duplicate stop name after normalization):
        // there is no edge to draw. Skip rather than create a degenerate node.
        if (from.id === to.id) continue;

        const existing = await tx.connection.findUnique({
          where: {
            from_stop_id_to_stop_id_vehicle: {
              from_stop_id: from.id,
              to_stop_id: to.id,
              vehicle,
            },
          },
          select: { id: true },
        });

        let connectionId: string;
        if (existing) {
          connectionId = existing.id;
          connectionsVerified++;
        } else {
          // First sighting of this edge — seed median_fare with this report so
          // the NOT-NULL column has a value before consensus recompute.
          const conn = await tx.connection.create({
            data: {
              from_stop_id: from.id,
              to_stop_id: to.id,
              vehicle,
              median_fare: legFare,
            },
            select: { id: true },
          });
          connectionId = conn.id;
          connectionsCreated++;
        }

        // 24h per-fingerprint dedupe: same device, same edge, within the window
        // → ignore this leg's report (but the edge still counts as touched).
        const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
        const dup = await tx.fareReport.findFirst({
          where: { connection_id: connectionId, fingerprint, created_at: { gte: since } },
          select: { id: true },
        });
        if (dup) continue;

        await tx.fareReport.create({
          data: { connection_id: connectionId, fare: legFare, fingerprint },
        });
        await recomputeConsensus(connectionId, tx);
      }

      return { created: connectionsCreated, verified: connectionsVerified };
    },
    { timeout: 15_000 },
  );

  // Outside the transaction: invalidate computed-route caches. Best-effort;
  // a failed bump only risks briefly-stale reads, never data integrity.
  await bumpGraphVersion();

  // Superset of the frontend's ContributionSuccess (spec §4 seam). Option A has
  // no approval queue, so status is a nominal 'PENDING' and warnings is always [].
  return {
    id: randomUUID(),
    status: 'PENDING',
    warnings: [],
    connections_created: created,
    connections_verified: verified,
  };
}
