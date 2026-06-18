// ─────────────────────────────────────────────────────────────────────────────
// Wire contract shared with the frontend (apps/web/src/types/index.ts).
// The backend COMPUTES these shapes from the graph; the frontend consumes them
// unchanged. Keep this in lockstep with the web contract — see the build spec
// §4 (the critical integration seam).
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
  id: string; // FeaturedRoute id OR dyn:{fromId}:{toId}:{vehicle}
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

// Body the frontend POSTs to /contributions (+ user_confirmed flag).
export interface ContributionInput {
  route_id?: string | null;
  submitted_name: string;
  vehicle: Vehicle;
  notes?: string;
  stops: { name: string; leg_fare: number }[];
}

// ── Search (GET /routes/search) ──────────────────────────────────────────────
export interface StopSearchHit {
  name: string;
  route_ids: string[];
}
export interface SearchResult {
  routes: Route[];
  stops: StopSearchHit[];
}

// ── Transfer planning (GET /stops/:name/routes) ──────────────────────────────
export interface StopRoutesResult {
  stop: string;
  routes: (Route & { matching_stop_position?: number })[];
}

// ── POST /contributions responses ────────────────────────────────────────────
// Option A never emits DUPLICATE/SUB_ROUTE; warnings is [] on the happy path.
// The response is a superset of the frontend's ContributionSuccess: it carries
// id + status:'PENDING' (so the locked frontend type holds) plus additive
// connection telemetry the frontend ignores.
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
  connections_created: number;
  connections_verified: number;
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

// ── Resolved stop (output of normalize.service resolution) ───────────────────
export interface ResolvedStop {
  id: string;
  name: string;
  name_normalized: string;
  created: boolean; // true if this resolution created a new Stop node
}
