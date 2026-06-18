// ─────────────────────────────────────────────────────────────────────────────
// Featured routes (build spec §7). The "board" the frontend shows is a cache of
// popular computed routes, not stored truth. A background job (hourly; see
// index.ts) recomputes it: for each vehicle, take the highest-degree hub stops,
// pathfind between every hub pair, and keep the best-verified routes. Storing the
// path (ordered stop ids) keeps the row a thin pointer — it is re-hydrated
// against the live graph on read, so a featured route that goes stale (a leg
// drops below the routing threshold) simply falls out of the list.
//
// Without real traffic data, "popular" is proxied by min_verification (the
// weakest leg's report count) — the routes the crowd has corroborated most.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { cached } from '../lib/cache';
import { logger } from '../lib/logger';
import { loadRoutableGraph } from './graph.service';
import { dijkstra, type Adjacency } from './pathfind';
import { hydrateFeatured } from './route.service';
import type { Route, RouteStatus, SearchResult, Vehicle } from '../types';

const HUBS_PER_VEHICLE = 8; // top-degree stops considered as endpoints
const MAX_FEATURED = 30; // cap the board size

/** Total degree (in + out) of every stop within one vehicle's adjacency. */
function degrees(adj: Adjacency): Map<string, number> {
  const deg = new Map<string, number>();
  const bump = (id: string, n: number) => deg.set(id, (deg.get(id) ?? 0) + n);
  for (const [from, edges] of adj) {
    bump(from, edges.length);
    for (const e of edges) bump(e.to, 1);
  }
  return deg;
}

interface Candidate {
  vehicle: Vehicle;
  name: string;
  path: string[]; // ordered stop ids
  total_fare: number;
  total_duration: number;
  min_verification: number;
}

/** Recompute the featured-route board. Returns how many routes were stored. */
export async function rebuildFeaturedRoutes(): Promise<number> {
  const graph = await loadRoutableGraph();
  const candidates: Candidate[] = [];

  for (const [vehicle, adj] of graph.byVehicle) {
    const hubs = [...degrees(adj).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, HUBS_PER_VEHICLE)
      .map(([id]) => id);

    for (const from of hubs) {
      for (const to of hubs) {
        if (from === to) continue;
        const path = dijkstra(adj, from, to);
        if (!path || path.edges.length < 1) continue;
        candidates.push({
          vehicle,
          name: `${graph.stopName.get(from) ?? from} → ${graph.stopName.get(to) ?? to}`,
          path: path.stops,
          total_fare: path.total_fare,
          total_duration: path.total_duration,
          min_verification: Math.min(...path.edges.map((e) => e.reports)),
        });
      }
    }
  }

  // Best-verified first; richer (more stops) breaks ties. Dedupe by endpoints.
  candidates.sort(
    (a, b) => b.min_verification - a.min_verification || b.path.length - a.path.length,
  );
  const seen = new Set<string>();
  const chosen: Candidate[] = [];
  for (const c of candidates) {
    const key = `${c.path[0]}:${c.path[c.path.length - 1]}:${c.vehicle}`;
    if (seen.has(key)) continue;
    seen.add(key);
    chosen.push(c);
    if (chosen.length >= MAX_FEATURED) break;
  }

  // Replace the board atomically. This is a cache rebuild, not a destructive op:
  // FeaturedRoute holds no source-of-truth data, only pointers into the graph.
  await prisma.$transaction([
    prisma.featuredRoute.deleteMany({}),
    prisma.featuredRoute.createMany({
      data: chosen.map((c) => ({
        name: c.name,
        vehicle: c.vehicle,
        path: c.path,
        total_fare: c.total_fare,
        total_duration: c.total_duration,
        min_verification: c.min_verification,
        is_active: true,
      })),
    }),
  ]);

  logger.info({ stored: chosen.length, considered: candidates.length }, 'featured routes rebuilt');
  return chosen.length;
}

/** Hydrate all active featured rows against the current graph, dropping any that
 *  have gone stale. Shared by the list / search / stop-routes reads. */
export async function activeFeaturedRoutes(): Promise<Route[]> {
  const graph = await loadRoutableGraph();
  const rows = await prisma.featuredRoute.findMany({
    where: { is_active: true },
    orderBy: { min_verification: 'desc' },
  });
  return rows
    .map((r) => hydrateFeatured(r, graph))
    .filter((r): r is Route => r !== null);
}

export interface RouteListFilter {
  vehicle?: Vehicle;
  status?: RouteStatus;
}

/** GET /routes — the board. Active featured routes, filtered by vehicle/status.
 *  Cached per filter + graph_version (a contribution bumps the version, so the
 *  board self-invalidates). */
export async function listRoutes(filter: RouteListFilter = {}): Promise<Route[]> {
  const graph = await loadRoutableGraph();
  const key = `routes:list:${filter.vehicle ?? 'all'}:${filter.status ?? 'all'}:v${graph.version}`;
  return cached(key, env.ROUTE_CACHE_TTL_SECONDS, async () => {
    let routes = await activeFeaturedRoutes();
    if (filter.vehicle) routes = routes.filter((r) => r.vehicle === filter.vehicle);
    if (filter.status) routes = routes.filter((r) => r.status === filter.status);
    return routes;
  });
}

/** GET /routes/search?q= — routes whose name/endpoints/stops match, plus stops
 *  (on the board) matching the query with the route ids that serve them. */
export async function searchRoutesAndStops(q: string): Promise<SearchResult> {
  const graph = await loadRoutableGraph();
  const needle = q.trim().toLowerCase();
  const key = `routes:search:${needle}:v${graph.version}`;
  return cached(key, env.ROUTE_CACHE_TTL_SECONDS, async () => {
    const all = await activeFeaturedRoutes();
    if (!needle) return { routes: [], stops: [] };

    const routes = all.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.from_stop.toLowerCase().includes(needle) ||
        r.to_stop.toLowerCase().includes(needle) ||
        r.stops.some((s) => s.name.toLowerCase().includes(needle)),
    );

    // Stops on the board whose name matches → the route ids passing through them.
    const byStop = new Map<string, Set<string>>();
    for (const r of all) {
      for (const s of r.stops) {
        if (!s.name.toLowerCase().includes(needle)) continue;
        const ids = byStop.get(s.name) ?? new Set<string>();
        ids.add(r.id);
        byStop.set(s.name, ids);
      }
    }
    const stops = [...byStop.entries()].map(([name, ids]) => ({ name, route_ids: [...ids] }));

    return { routes, stops };
  });
}
