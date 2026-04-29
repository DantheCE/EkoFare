// ─────────────────────────────────────────────────────────────────────────────
// EkoFare — Shared Types  (packages/types/src/index.ts)
// Source of truth for both apps/web and apps/api.
// ─────────────────────────────────────────────────────────────────────────────

// ── §5.1 Backend wire format (authoritative) ─────────────────────────────────

export type VehicleType =
  | 'danfo'
  | 'brt'
  | 'keke'
  | 'okada'
  | 'ferry'
  | 'uber';

export interface BackendStop {
  /** Stop display name. */
  name: string;
  /** Naira fare from the previous stop. 0 for the origin. */
  legFare: number;
}

export interface BackendRoute {
  id: number;
  /** Human-readable route name, e.g. "CMS → Lekki Phase 1". */
  name: string;
  vehicle: VehicleType;
  /** Semantic category, e.g. "island-loop". */
  type: string;
  /** Estimated journey duration in minutes. */
  duration: number;
  /** Reference id matching the VehicleIcon component. */
  icon: string;
  /** Denormalized hex accent color. */
  color: string;
  confirmations: number;
  isVerified: boolean;
  stops: BackendStop[];
}

export interface ContributionPayload {
  /** "From → To" string. */
  route_name: string;
  vehicle: VehicleType;
  stops_data: { name: string; fare_from_previous: number }[];
  notes?: string;
}

export interface VerificationResponse {
  success: boolean;
  confirmations: number;
  isVerified: boolean;
}

// ── §5.2 Frontend transformation (denormalized, ready to render) ──────────────

export interface Stop {
  /** Stable id for React key — `${routeId}-stop-${order}`. */
  id: string;
  name: string;
  /** Renamed from legFare; naira from the previous stop. */
  leg_fare: number;
  /** sum(stops[0..i].leg_fare). Origin is always 0. */
  cumulative_fare: number;
  order: number;
}

export interface Route {
  /** String-cast backend id. */
  id: string;
  /** Full display name, e.g. "CMS → Lekki Phase 1". */
  name: string;
  /** First segment of name before " → ". */
  from: string;
  /** Segment after " → ". */
  to: string;
  vehicle: VehicleType;
  /** Renamed from duration. */
  duration_min: number;
  stops: Stop[];
  /** ISO date string. */
  last_updated: string;
  contributor_count: number;
  confirmations: number;
  isVerified: boolean;
}

// ── §5.3 Contributions & Verification ────────────────────────────────────────

export interface Contribution {
  id: string;
  /** Omitted for brand-new route proposals. */
  routeId?: string;
  route_name: string;
  vehicle: VehicleType;
  stops_data: { name: string; fare_from_previous: number }[];
  notes?: string;
  status: 'pending' | 'verified' | 'rejected';
  confirmations: number;
  disputes: number;
  /** ISO date string. */
  created_at: string;
  /** Anonymized device id. */
  submitted_by?: string;
  /** Set of device ids that have already voted. */
  votedBy: string[];
}
