// ─────────────────────────────────────────────────────────────────────────────
// In-memory pathfinding (build spec §5.4 — day-one non-negotiable). Routes are
// COMPUTED, never stored: Dijkstra over an in-memory adjacency built from the
// routable subgraph (graph.service.ts), minimizing total fare. This module is
// pure — it takes an adjacency and two stop ids and returns a path or null. No
// DB, no I/O; exhaustively unit-tested.
// ─────────────────────────────────────────────────────────────────────────────

import { MinHeap } from '../lib/heap';
import type { Vehicle } from '../types';
import type { ConnStatusValue } from '../lib/consensus';

export interface GraphEdge {
  to: string;
  vehicle: Vehicle;
  fare: number; // median_fare (the edge weight)
  duration: number; // avg_duration_min, already defaulted by the loader
  reports: number; // fare_reports — used for the route's weakest-leg verification
  status: ConnStatusValue;
  last_verified: string; // ISO
}

// fromStopId -> outgoing edges
export type Adjacency = Map<string, GraphEdge[]>;

export interface PathResult {
  stops: string[]; // ordered stop ids, origin → destination inclusive
  edges: GraphEdge[]; // length === stops.length - 1
  total_fare: number;
  total_duration: number;
}

/** Cheapest-fare path from `from` to `to`, or null if none exists. Ties on fare
 *  are broken by fewer hops (shorter, simpler routes win). */
export function dijkstra(adj: Adjacency, from: string, to: string): PathResult | null {
  if (from === to) {
    return { stops: [from], edges: [], total_fare: 0, total_duration: 0 };
  }

  const dist = new Map<string, number>();
  const hops = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: GraphEdge }>();
  const visited = new Set<string>();

  dist.set(from, 0);
  hops.set(from, 0);

  const pq = new MinHeap<string>();
  pq.push(from, 0);

  while (!pq.isEmpty()) {
    const node = pq.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    if (node === to) break;

    const baseDist = dist.get(node) ?? Infinity;
    const baseHops = hops.get(node) ?? 0;

    for (const edge of adj.get(node) ?? []) {
      if (visited.has(edge.to)) continue;
      const nextDist = baseDist + edge.fare;
      const nextHops = baseHops + 1;
      const knownDist = dist.get(edge.to) ?? Infinity;
      const knownHops = hops.get(edge.to) ?? Infinity;

      // Relax on cheaper fare, or equal fare with fewer hops.
      if (nextDist < knownDist || (nextDist === knownDist && nextHops < knownHops)) {
        dist.set(edge.to, nextDist);
        hops.set(edge.to, nextHops);
        prev.set(edge.to, { node, edge });
        // Priority folds in hops as a tiny tie-breaker so the heap prefers
        // shorter equal-fare paths without affecting fare ordering.
        pq.push(edge.to, nextDist + nextHops * 1e-6);
      }
    }
  }

  if (!prev.has(to)) return null;

  // Walk predecessors back to the origin, then reverse.
  const stops: string[] = [to];
  const edges: GraphEdge[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = prev.get(cursor)!;
    edges.push(step.edge);
    stops.push(step.node);
    cursor = step.node;
  }
  stops.reverse();
  edges.reverse();

  return {
    stops,
    edges,
    total_fare: edges.reduce((a, e) => a + e.fare, 0),
    total_duration: edges.reduce((a, e) => a + e.duration, 0),
  };
}
