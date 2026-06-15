// ─────────────────────────────────────────────────────────────────────────────
// Client-side filter + sort for the All Routes list (Spec §3.2). Pure and
// unit-tested. Search matches route name OR any stop name (transfer-friendly).
// ─────────────────────────────────────────────────────────────────────────────

import type { Route, Vehicle } from '../types';
import { totalFare } from './fare';
import type { SortKey } from '../app/components/SortControl';

export interface RouteViewOptions {
  vehicle: Vehicle | 'ALL';
  query: string;
  sort: SortKey;
}

function matchesQuery(route: Route, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (route.name.toLowerCase().includes(needle)) return true;
  return route.stops.some((s) => s.name.toLowerCase().includes(needle));
}

export function filterAndSortRoutes(routes: Route[], opts: RouteViewOptions): Route[] {
  const filtered = routes.filter(
    (r) =>
      r.status !== 'FRAGMENT' &&
      (opts.vehicle === 'ALL' || r.vehicle === opts.vehicle) &&
      matchesQuery(r, opts.query.trim()),
  );

  const sorted = [...filtered];
  switch (opts.sort) {
    case 'shortest':
      sorted.sort((a, b) => a.duration_min - b.duration_min);
      break;
    case 'cheapest':
      sorted.sort((a, b) => totalFare(a.stops) - totalFare(b.stops));
      break;
    case 'verified':
    default:
      sorted.sort((a, b) => b.verification_count - a.verification_count);
      break;
  }
  return sorted;
}
