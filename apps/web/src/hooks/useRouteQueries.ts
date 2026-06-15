// ─────────────────────────────────────────────────────────────────────────────
// React Query hooks over the v3.2 data layer (src/lib/api/routes.ts).
// Stale-while-revalidate so route detail stays readable offline (Spec §7).
// Kept separate from the legacy hooks/useRoutes.ts during the overhaul.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import {
  getRoutes,
  getRoute,
  searchRoutes,
  getStopRoutes,
  type RouteQuery,
} from '../lib/api/routes';

export function useRoutesQuery(query: RouteQuery = {}) {
  return useQuery({
    queryKey: ['routes', query.vehicle ?? 'ALL', query.status ?? 'ANY'],
    queryFn: () => getRoutes(query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRouteQuery(id: string) {
  return useQuery({
    queryKey: ['route', id],
    queryFn: () => getRoute(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}

export function useSearchQuery(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ['search', term],
    queryFn: () => searchRoutes(term),
    enabled: term.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useStopRoutesQuery(name: string | null) {
  return useQuery({
    queryKey: ['stop-routes', name],
    queryFn: () => getStopRoutes(name as string),
    enabled: Boolean(name),
    staleTime: 5 * 60 * 1000,
  });
}
