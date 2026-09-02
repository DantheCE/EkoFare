// ─────────────────────────────────────────────────────────────────────────────
// Typed data functions for routes/search. Each switches on USE_MOCKS so the UI
// ships before the backend exists; the mock and real branches return the exact
// same types (Spec §2.1). FRAGMENT routes are hidden from lists/search (§6.5).
// ─────────────────────────────────────────────────────────────────────────────

import type { Route, RouteStatus, SearchResult, StopRoutesResult, Vehicle } from '../../types';
import { apiClient, USE_MOCKS, mockLatency } from './client';
import { MOCK_ROUTES, findMockRoute } from './mock/fixtures';

export interface RouteQuery {
  vehicle?: Vehicle | 'ALL';
  status?: RouteStatus;
}

const STATUS_RANK: Record<RouteStatus, number> = {
  MAJOR: 3,
  VERIFIED: 2,
  UNVERIFIED: 1,
  FRAGMENT: 0,
};

/** GET /routes?vehicle=&status= — FRAGMENTs excluded, sorted by verification desc. */
export async function getRoutes(query: RouteQuery = {}): Promise<Route[]> {
  if (USE_MOCKS) {
    await mockLatency();
    let rows = MOCK_ROUTES.filter((r) => r.status !== 'FRAGMENT');
    if (query.vehicle && query.vehicle !== 'ALL') {
      rows = rows.filter((r) => r.vehicle === query.vehicle);
    }
    if (query.status) {
      rows = rows.filter((r) => r.status === query.status);
    }
    return [...rows].sort(
      (a, b) =>
        STATUS_RANK[b.status] - STATUS_RANK[a.status] ||
        b.verification_count - a.verification_count,
    );
  }

  const res = await apiClient.get<{ routes: Route[] }>('/routes', {
    params: {
      vehicle: query.vehicle && query.vehicle !== 'ALL' ? query.vehicle : undefined,
      status: query.status,
    },
  });
  return res.data.routes;
}

/** GET /routes/:id */
export async function getRoute(id: string): Promise<Route> {
  if (USE_MOCKS) {
    await mockLatency();
    const route = findMockRoute(id);
    if (!route) throw new Error(`Route not found: ${id}`);
    return route;
  }
  const res = await apiClient.get<Route>(`/routes/${id}`);
  return res.data;
}

/** GET /routes/search?q= — matches route names and stop names. */
export async function searchRoutes(q: string): Promise<SearchResult> {
  const query = q.trim().toLowerCase();
  if (USE_MOCKS) {
    await mockLatency(250);
    if (!query) return { routes: [], stops: [] };
    const visible = MOCK_ROUTES.filter((r) => r.status !== 'FRAGMENT');
    const routes = visible.filter((r) => r.name.toLowerCase().includes(query));

    const stopMap = new Map<string, Set<string>>();
    for (const r of visible) {
      for (const s of r.stops) {
        if (s.name.toLowerCase().includes(query)) {
          if (!stopMap.has(s.name)) stopMap.set(s.name, new Set());
          stopMap.get(s.name)!.add(r.id);
        }
      }
    }
    const stops = [...stopMap.entries()].map(([name, ids]) => ({
      name,
      route_ids: [...ids],
    }));
    return { routes, stops };
  }

  const res = await apiClient.get<SearchResult>('/routes/search', { params: { q } });
  return res.data;
}

/** GET /stops/:name/routes — all routes through a stop (transfer planning). */
export async function getStopRoutes(name: string): Promise<StopRoutesResult> {
  if (USE_MOCKS) {
    await mockLatency();
    const routes = MOCK_ROUTES.filter((r) => r.status !== 'FRAGMENT')
      .map((r) => {
        const pos = r.stops.findIndex((s) => s.name === name);
        return pos >= 0 ? { ...r, matching_stop_position: pos } : null;
      })
      .filter((r): r is Route & { matching_stop_position: number } => r !== null);
    return { stop: name, routes };
  }
  const res = await apiClient.get<StopRoutesResult>(
    `/stops/${encodeURIComponent(name)}/routes`,
  );
  return res.data;
}

export interface QueueConnection {
  id: string;
  from_stop: { id: string; name: string };
  to_stop: { id: string; name: string };
  vehicle: string;
  median_fare: number;
  fare_reports: number;
}

/** GET /routes/queue — community review queue of unverified connections */
export async function getQueue(): Promise<{ queue: QueueConnection[] }> {
  if (USE_MOCKS) {
    await mockLatency();
    return { queue: [] };
  }
  const res = await apiClient.get<{ queue: QueueConnection[] }>('/routes/queue');
  return res.data;
}
