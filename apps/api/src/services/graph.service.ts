// ─────────────────────────────────────────────────────────────────────────────
// In-memory routable graph (build spec §5.4). The pathfinder must NEVER walk the
// DB row-by-row, so we load the whole routable subgraph once and memoize it,
// keyed by the global graph_version. A contribution bumps that version (see
// graphVersion.ts), so the next load rebuilds from fresh rows; until then every
// route query runs against the in-memory snapshot.
//
// "Routable" = a connection with at least MIN_REPORTS_FOR_ROUTING non-outlier
// reports. Below that there is not enough evidence to route on (spec §3).
// Adjacency is partitioned by vehicle so a route stays single-vehicle (matching
// the dyn:{from}:{to}:{vehicle} id shape).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { getGraphVersion } from '../lib/graphVersion';
import { logger } from '../lib/logger';
import type { Vehicle } from '../types';
import type { Adjacency, GraphEdge } from './pathfind';

const DEFAULT_LEG_MINUTES = 15; // when a connection has no avg_duration_min yet

export interface RoutableGraph {
  version: number;
  byVehicle: Map<Vehicle, Adjacency>; // vehicle -> (fromStopId -> edges)
  stopName: Map<string, string>; // stopId -> display name
}

let snapshot: RoutableGraph | null = null;

/** Load (or return the memoized) routable graph. Rebuilds when graph_version
 *  has advanced since the last load. */
export async function loadRoutableGraph(): Promise<RoutableGraph> {
  const version = await getGraphVersion();
  if (snapshot && snapshot.version === version) return snapshot;

  const connections = await prisma.connection.findMany({
    where: { fare_reports: { gte: env.MIN_REPORTS_FOR_ROUTING } },
    select: {
      from_stop_id: true,
      to_stop_id: true,
      vehicle: true,
      median_fare: true,
      avg_duration_min: true,
      fare_reports: true,
      status: true,
      last_verified: true,
    },
  });

  const byVehicle = new Map<Vehicle, Adjacency>();
  const stopIds = new Set<string>();

  for (const c of connections) {
    stopIds.add(c.from_stop_id);
    stopIds.add(c.to_stop_id);

    let adj = byVehicle.get(c.vehicle);
    if (!adj) {
      adj = new Map();
      byVehicle.set(c.vehicle, adj);
    }
    const edge: GraphEdge = {
      to: c.to_stop_id,
      vehicle: c.vehicle,
      fare: c.median_fare,
      duration: c.avg_duration_min ?? DEFAULT_LEG_MINUTES,
      reports: c.fare_reports,
      status: c.status,
      last_verified: c.last_verified.toISOString(),
    };
    const list = adj.get(c.from_stop_id);
    if (list) list.push(edge);
    else adj.set(c.from_stop_id, [edge]);
  }

  // One query for every stop name we touched (hydration needs display names).
  const stops = stopIds.size
    ? await prisma.stop.findMany({
        where: { id: { in: [...stopIds] } },
        select: { id: true, name: true },
      })
    : [];
  const stopName = new Map(stops.map((s) => [s.id, s.name]));

  snapshot = { version, byVehicle, stopName };
  logger.debug(
    { version, vehicles: byVehicle.size, edges: connections.length, stops: stopName.size },
    'routable graph loaded',
  );
  return snapshot;
}

/** Drop the memoized snapshot. Tests call this between cases (the in-process
 *  graph_version counter does not change when the DB is truncated directly). */
export function invalidateGraphCache(): void {
  snapshot = null;
}
