// ─────────────────────────────────────────────────────────────────────────────
// Consensus math (build spec §5.3) — pure, no I/O, exhaustively unit-tested.
// A connection's fare is the MEDIAN of its non-outlier reports (robust to
// fat-finger entries in a way the mean is not). Outliers are flagged only once
// there is enough signal (>= 5 reports) as values beyond OUTLIER_SIGMA standard
// deviations from the median. Status is derived from the clean report count.
// ─────────────────────────────────────────────────────────────────────────────

export type ConnStatusValue = 'UNVERIFIED' | 'VERIFIED' | 'MAJOR';

// Reports needed before outlier detection kicks in (too few = no signal).
export const OUTLIER_MIN_REPORTS = 5;

/** Median of a list of integers. Even counts average the two middles, rounded
 *  (fares are whole naira). Empty list → 0. */
export function pickMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Population standard deviation (matches the spec's stddev(fares, mean)). */
export function stddev(xs: number[], m: number = mean(xs)): number {
  if (xs.length === 0) return 0;
  const variance = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

/** Per-edge confidence from the non-outlier report count (spec §3). */
export function deriveStatus(count: number): ConnStatusValue {
  if (count >= 20) return 'MAJOR';
  if (count >= 5) return 'VERIFIED';
  return 'UNVERIFIED';
}

export interface ConsensusResult {
  median_fare: number; // consensus price over clean reports
  fare_reports: number; // count of non-outlier reports
  status: ConnStatusValue;
  outliers: boolean[]; // same order as input fares
}

/** Compute consensus for one connection from its reports' fares (input order is
 *  preserved in `outliers` so callers can map flags back to report rows). */
export function computeConsensus(
  fares: number[],
  opts: { sigma: number; minForOutliers?: number },
): ConsensusResult {
  const minForOutliers = opts.minForOutliers ?? OUTLIER_MIN_REPORTS;
  const median = pickMedian(fares);

  let outliers = fares.map(() => false);
  if (fares.length >= minForOutliers) {
    const m = mean(fares);
    const sd = stddev(fares, m);
    // sd === 0 (all identical) → nothing can be an outlier.
    outliers = fares.map((f) => sd > 0 && Math.abs(f - median) > opts.sigma * sd);
  }

  const clean = fares.filter((_, i) => !outliers[i]);
  const count = clean.length;
  // If every value were flagged (cannot happen for a median-anchored test, but
  // guard anyway) fall back to the all-reports median.
  const median_fare = clean.length > 0 ? pickMedian(clean) : median;

  return { median_fare, fare_reports: count, status: deriveStatus(count), outliers };
}
