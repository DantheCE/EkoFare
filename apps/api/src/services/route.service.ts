// ─────────────────────────────────────────────────────────────────────────────
// Route service (build spec §6). Computes route VIEWS on demand from the graph
// and serves them through the stampede-protected cache. Two entry points:
//   - findRoute(from, to, vehicle?) — resolve stop names, pathfind, hydrate.
//   - getRouteById(id) — a dyn:{fromId}:{toId}:{vehicle} computed id, or a stored
//     FeaturedRoute id (Phase 4 populates that table).
// Cache keys fold in the graph_version so a contribution silently invalidates
// every stale computed route (no key enumeration needed).
// ─────────────────────────────────────────────────────────────────────────────

import type { FeaturedRoute } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { cached } from '../lib/cache';
import { noRoute, notFound, stopNotFound } from '../lib/errors';
import { resolveExisting, suggestStops } from './normalize.service';
import { loadRoutableGraph, type RoutableGraph } from './graph.service';
import { dijkstra, type Adjacency, type GraphEdge, type PathResult } from './pathfind';
import { dynRouteId, hydrateRoute } from './routeview.service';
import type { Route, Vehicle } from '../types';

const VEHICLES: Vehicle[] = ['DANFO', 'BRT', 'KEKE', 'OKADA', 'FERRY', 'RIDESHARE'];

/** Best (cheapest-fare) path between two stop ids. If `vehicle` is given, search
 *  only that vehicle's subgraph; otherwise pick the cheapest single-vehicle path
 *  across all vehicles (routes never mix vehicles — see the dyn id shape). */
function bestPath(
  graph: RoutableGraph,
  fromId: string,
  toId: string,
  vehicle?: Vehicle,
): { path: PathResult; vehicle: Vehicle } | null {
  const search = (v: Vehicle): { path: PathResult; vehicle: Vehicle } | null => {
    const adj = graph.byVehicle.get(v);
    if (!adj) return null;
    const path = dijkstra(adj, fromId, toId);
    return path ? { path, vehicle: v } : null;
  };

  if (vehicle) return search(vehicle);

  let best: { path: PathResult; vehicle: Vehicle } | null = null;
  for (const v of VEHICLES) {
    const candidate = search(v);
    if (candidate && (!best || candidate.path.total_fare < best.path.total_fare)) {
      best = candidate;
    }
  }
  return best;
}

/** Resolve a query stop name to an existing stop id, or throw STOP_NOT_FOUND
 *  with trigram suggestions. Query path never creates stops. */
async function resolveQueryStop(name: string): Promise<string> {
  const stop = await resolveExisting(name);
  if (stop) return stop.id;
  const suggestions = await suggestStops(name);
  throw stopNotFound(suggestions);
}

/** Find the best route between two stop names. Cached by normalized names +
 *  vehicle + graph_version. Throws STOP_NOT_FOUND / NO_ROUTE_FOUND. */
export async function findRoute(from: string, to: string, vehicle?: Vehicle): Promise<Route> {
  const [fromId, toId] = await Promise.all([resolveQueryStop(from), resolveQueryStop(to)]);
  const graph = await loadRoutableGraph();

  const key = `route:find:${vehicle ?? 'any'}:${fromId}:${toId}:v${graph.version}`;
  const route = await cached(key, env.ROUTE_CACHE_TTL_SECONDS, async () => {
    const found = bestPath(graph, fromId, toId, vehicle);
    if (!found) return null;
    return hydrateRoute(dynRouteId(fromId, toId, found.vehicle), found.path, found.vehicle, graph.stopName);
  });

  if (!route) throw noRoute();
  return route;
}

/** Look up an edge in an adjacency (used to re-hydrate a stored featured path). */
function findEdge(adj: Adjacency | undefined, fromId: string, toId: string): GraphEdge | undefined {
  return adj?.get(fromId)?.find((e) => e.to === toId);
}

/** Rebuild a PathResult from an ordered list of stop ids on one vehicle. Returns
 *  null if any leg is no longer routable (the stored featured route went stale). */
export function reconstructPath(adj: Adjacency | undefined, ids: string[]): PathResult | null {
  if (ids.length < 2) return null;
  const edges: GraphEdge[] = [];
  for (let i = 1; i < ids.length; i++) {
    const edge = findEdge(adj, ids[i - 1], ids[i]);
    if (!edge) return null;
    edges.push(edge);
  }
  return {
    stops: ids,
    edges,
    total_fare: edges.reduce((a, e) => a + e.fare, 0),
    total_duration: edges.reduce((a, e) => a + e.duration, 0),
  };
}

/** Resolve a route id to a Route. `dyn:` ids recompute between two stop ids;
 *  anything else is a stored FeaturedRoute id. */
export async function getRouteById(id: string): Promise<Route> {
  const graph = await loadRoutableGraph();

  if (id.startsWith('dyn:')) {
    const [, fromId, toId, vehicle] = id.split(':');
    if (!fromId || !toId || !vehicle || !VEHICLES.includes(vehicle as Vehicle)) {
      throw notFound('Malformed route id.');
    }
    const key = `route:id:${id}:v${graph.version}`;
    const route = await cached(key, env.ROUTE_CACHE_TTL_SECONDS, async () => {
      const found = bestPath(graph, fromId, toId, vehicle as Vehicle);
      if (!found) return null;
      return hydrateRoute(id, found.path, found.vehicle, graph.stopName);
    });
    if (!route) throw noRoute();
    return route;
  }

  // Stored featured route.
  const featured = await prisma.featuredRoute.findUnique({ where: { id } });
  if (!featured) throw notFound('Route not found.');

  const route = hydrateFeatured(featured, graph);
  if (!route) throw noRoute(); // featured route went stale (a leg dropped below routing)
  return route;
}

/** Hydrate a stored FeaturedRoute against the current graph. Returns null when a
 *  leg has dropped below the routing threshold since the row was built (the
 *  caller decides whether that's a 404 or just a skip in a list). */
export function hydrateFeatured(featured: FeaturedRoute, graph: RoutableGraph): Route | null {
  const path = reconstructPath(graph.byVehicle.get(featured.vehicle), featured.path);
  if (!path) return null;
  const id = dynRouteId(featured.path[0], featured.path[featured.path.length - 1], featured.vehicle);
  return hydrateRoute(id, path, featured.vehicle, graph.stopName);
}
