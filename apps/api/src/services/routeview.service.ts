// ─────────────────────────────────────────────────────────────────────────────
// Route hydration (build spec §4.2). Turns a computed path (pathfind.PathResult)
// into the wire `Route` the frontend consumes. A route is only ever a VIEW over
// the graph — its confidence is its WEAKEST leg: status and verification_count
// come from the least-verified connection on the path, so a single fragile leg
// can't be masked by strong neighbours.
// ─────────────────────────────────────────────────────────────────────────────

import type { Route, RouteStatus, Stop, Vehicle } from '../types';
import type { ConnStatusValue } from '../lib/consensus';
import type { PathResult } from './pathfind';

const STATUS_RANK: Record<ConnStatusValue, number> = { UNVERIFIED: 1, VERIFIED: 2, MAJOR: 3 };
const RANK_STATUS: Record<number, RouteStatus> = { 1: 'UNVERIFIED', 2: 'VERIFIED', 3: 'MAJOR' };

/** Stable id for a computed route: dyn:{originId}:{destId}:{vehicle}. */
export function dynRouteId(fromId: string, toId: string, vehicle: Vehicle): string {
  return `dyn:${fromId}:${toId}:${vehicle}`;
}

/** Build the `Route` view from a path. `stopName` maps stop ids to display names
 *  (from the in-memory graph snapshot); ids missing a name fall back to the id. */
export function hydrateRoute(
  id: string,
  path: PathResult,
  vehicle: Vehicle,
  stopName: Map<string, string>,
): Route {
  const nameOf = (stopId: string) => stopName.get(stopId) ?? stopId;

  let cumulative = 0;
  const stops: Stop[] = path.stops.map((stopId, i) => {
    const legFare = i === 0 ? 0 : path.edges[i - 1].fare;
    cumulative += legFare;
    return {
      id: stopId,
      name: nameOf(stopId),
      order: i,
      leg_fare: legFare,
      cumulative_fare: cumulative,
    };
  });

  // Weakest leg drives confidence; a 0-edge path is a degenerate FRAGMENT.
  const weakestRank = path.edges.length
    ? Math.min(...path.edges.map((e) => STATUS_RANK[e.status]))
    : 0;
  const status: RouteStatus = path.edges.length ? RANK_STATUS[weakestRank] : 'FRAGMENT';
  const verification_count = path.edges.length
    ? Math.min(...path.edges.map((e) => e.reports))
    : 0;
  const last_updated = path.edges.length
    ? path.edges.map((e) => e.last_verified).sort().at(-1)!
    : new Date().toISOString();

  const fromName = nameOf(path.stops[0]);
  const toName = nameOf(path.stops[path.stops.length - 1]);

  return {
    id,
    name: `${fromName} → ${toName}`,
    from_stop: fromName,
    to_stop: toName,
    vehicle,
    status,
    verification_count,
    duration_min: path.total_duration,
    stops,
    last_updated,
  };
}
