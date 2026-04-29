import { useQuery } from '@tanstack/react-query';
import { fetchRoutes } from '../api/axios';
import type { VehicleType } from '@ekofare/types';

// ─────────────────────────────────────────────────────────────────────────────
// useRoutes — React Query wrapper around fetchRoutes
// vehicle: 'all' | VehicleType — filters by transit mode
// q: string — optional search query (name, from, to)
// staleTime: 5 minutes — data stays fresh without a background refetch
// ─────────────────────────────────────────────────────────────────────────────

export function useRoutes(vehicle: 'all' | VehicleType = 'all', q = '') {
  return useQuery({
    queryKey: ['routes', vehicle, q],
    queryFn: () => fetchRoutes(vehicle, q),
    staleTime: 5 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useRoute — fetch a single route by ID (used by RouteDetail)
// ─────────────────────────────────────────────────────────────────────────────

import { fetchRoute } from '../api/axios';

export function useRoute(id: string) {
  return useQuery({
    queryKey: ['route', id],
    queryFn: () => fetchRoute(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });
}
