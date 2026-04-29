import type { BackendRoute, Route, Stop, VehicleType } from '@ekofare/types';

// ─────────────────────────────────────────────────────────────────────────────
// transformRoute — converts BackendRoute → frontend Route
// ─────────────────────────────────────────────────────────────────────────────

export function transformRoute(b: BackendRoute): Route {
  // Compute cumulative fares as we walk the stops
  let runningTotal = 0;
  const stops: Stop[] = b.stops.map((s, i) => {
    const leg_fare = s.legFare;
    runningTotal += leg_fare;
    return {
      id: `${b.id}-stop-${i}`,
      name: s.name,
      leg_fare,
      cumulative_fare: runningTotal,
      order: i,
    };
  });

  // Split "CMS → Lekki Phase 1" into from / to
  const [from = b.name, to = ''] = b.name.split(' → ');

  return {
    id: String(b.id),
    name: b.name,
    from,
    to,
    vehicle: b.vehicle,
    duration_min: b.duration,
    stops,
    last_updated: new Date().toISOString(),
    contributor_count: b.confirmations,
    confirmations: b.confirmations,
    isVerified: b.isVerified,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateFare — sum of leg fares between origin and destination indices
// ─────────────────────────────────────────────────────────────────────────────

export function calculateFare(stops: Stop[], originIdx: number, destIdx: number): number {
  const [from, to] = originIdx < destIdx
    ? [originIdx, destIdx]
    : [destIdx, originIdx];
  return stops
    .slice(from + 1, to + 1)
    .reduce((sum, s) => sum + s.leg_fare, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// formatDuration — "45 min" or "1 hr 15 min"
// ─────────────────────────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

// ─────────────────────────────────────────────────────────────────────────────
// getVehicleColor — primary fill color from the design token table
// ─────────────────────────────────────────────────────────────────────────────

export function getVehicleColor(vehicle: VehicleType): string {
  const map: Record<VehicleType, string> = {
    danfo:  '#F4B41A',
    brt:    '#1E88E5',
    keke:   '#E53935',
    okada:  '#FB8C00',
    ferry:  '#00897B',
    uber:   '#1C1A18',
  };
  return map[vehicle];
}

// ─────────────────────────────────────────────────────────────────────────────
// getVehicleLabel — display name for each vehicle type
// ─────────────────────────────────────────────────────────────────────────────

export function getVehicleLabel(vehicle: VehicleType): string {
  const map: Record<VehicleType, string> = {
    danfo:  'Danfo',
    brt:    'BRT',
    keke:   'Keke Napep',
    okada:  'Okada',
    ferry:  'Ferry',
    uber:   'Uber/Bolt',
  };
  return map[vehicle];
}

// ─────────────────────────────────────────────────────────────────────────────
// formatFare — ₦ with locale commas, e.g. ₦12,300
// ─────────────────────────────────────────────────────────────────────────────

export function formatFare(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// getGreetingWithName — time-based greeting
// ─────────────────────────────────────────────────────────────────────────────

export function getGreetingWithName(name = 'friend'): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// formatRelativeTime — "2 hours ago", "just now", etc. (no library)
// ─────────────────────────────────────────────────────────────────────────────

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
