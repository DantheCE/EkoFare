// ─────────────────────────────────────────────────────────────────────────────
// EkoFare — Frontend data contract (Spec §4.1)
// The mock data layer and the real API both satisfy these interfaces, so the
// UI never changes when NEXT_PUBLIC_USE_MOCKS flips. This is the canonical
// v3.2 contract (uppercase Vehicle, RouteStatus, cumulative_fare); the legacy
// @ekofare/types package is reconciled with this in build-step 10.
// ─────────────────────────────────────────────────────────────────────────────

export type Vehicle = 'DANFO' | 'BRT' | 'KEKE' | 'OKADA' | 'FERRY' | 'RIDESHARE';

export type RouteStatus = 'FRAGMENT' | 'UNVERIFIED' | 'VERIFIED' | 'MAJOR';

export interface Stop {
  id: string;
  name: string;
  order: number; // 0-indexed
  leg_fare: number; // ₦ from previous stop; 0 for first
  cumulative_fare: number; // running total from first stop
}

export interface Route {
  id: string;
  name: string; // "Mile 2 → CMS"
  from_stop: string;
  to_stop: string;
  vehicle: Vehicle;
  status: RouteStatus;
  verification_count: number;
  duration_min: number;
  stops: Stop[];
  last_updated: string; // ISO
}

export interface ContributionInput {
  route_id?: string | null; // null = new route
  submitted_name: string;
  vehicle: Vehicle;
  notes?: string;
  stops: { name: string; leg_fare: number }[];
}

// ── Search (Spec §4.2 GET /routes/search) ────────────────────────────────────
export interface StopSearchHit {
  name: string;
  route_ids: string[];
}
export interface SearchResult {
  routes: Route[];
  stops: StopSearchHit[];
}

// ── Transfer planning (Spec §4.2 GET /stops/:name/routes) ────────────────────
export interface StopRoutesResult {
  stop: string;
  routes: (Route & { matching_stop_position?: number })[];
}

// ── POST /contributions responses (Spec §4.3) ────────────────────────────────
export type ContributionWarningType = 'SUB_ROUTE_WARNING' | 'INCOMPLETE_ROUTE';

export interface ContributionWarning {
  type: ContributionWarningType;
  message: string;
  parent_route?: { id: string; name: string };
}

export interface ContributionSuccess {
  id: string;
  status: 'PENDING';
  warnings: ContributionWarning[];
}

export interface ContributionDuplicateError {
  error: 'DUPLICATE_ROUTE';
  message: string;
  existing_route: { id: string; name: string };
}

export interface ContributionRateLimitError {
  error: 'RATE_LIMIT_EXCEEDED';
  message: string;
  retry_after: number;
}

export interface ContributionValidationError {
  error: 'VALIDATION_ERROR';
  details: { field: string; message: string }[];
}

// ── Display helpers ──────────────────────────────────────────────────────────
export const VEHICLE_LABEL: Record<Vehicle, string> = {
  DANFO: 'Danfo',
  BRT: 'BRT',
  KEKE: 'Keke Napep',
  OKADA: 'Okada',
  FERRY: 'Ferry',
  RIDESHARE: 'Uber/Bolt',
};
