// ─────────────────────────────────────────────────────────────────────────────
// Typed data functions for routes/search. Each switches on USE_MOCKS so the UI
// ships before the backend exists; the mock and real branches return the exact
// same types (Spec §2.1). FRAGMENT routes are hidden from lists/search (§6.5).
// ─────────────────────────────────────────────────────────────────────────────

import type { Route, RouteStatus, SearchResult, StopRoutesResult, Vehicle } from '../../types';
import { apiClient } from './client';

export interface RouteQuery {
  vehicle?: Vehicle | 'ALL';
  status?: RouteStatus;
}

/** GET /routes?vehicle=&status= — FRAGMENTs excluded, sorted by verification desc. */
export async function getRoutes(query: RouteQuery = {}): Promise<Route[]> {
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

  const res = await apiClient.get<Route>(`/routes/${id}`);
  return res.data;
}

/** GET /routes/search?q= — matches route names and stop names. */
export async function searchRoutes(q: string): Promise<SearchResult> {
  const res = await apiClient.get<SearchResult>('/routes/search', { params: { q } });
  return res.data;
}

/** GET /stops/:name/routes — all routes through a stop (transfer planning). */
export async function getStopRoutes(name: string): Promise<StopRoutesResult> {

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
  last_verified?: string | null;
}

/** GET /routes/queue — community review queue of unverified connections */
export async function getQueue(): Promise<{ queue: QueueConnection[] }> {

  const res = await apiClient.get<{ queue: QueueConnection[] }>('/routes/queue');
  return res.data;
}
