// ─────────────────────────────────────────────────────────────────────────────
// Fare math (Spec §5) — pure, deterministic, fully unit-tested.
// All fares are integer naira. Display always uses tabular figures (.tnum).
// ─────────────────────────────────────────────────────────────────────────────

import type { Stop, Vehicle } from '../types';

/**
 * Fare between two selected stop indices, inclusive of the destination leg.
 * Returns 0 when the destination is at or before the origin.
 */
export function fareBetween(stops: Stop[], originIdx: number, destIdx: number): number {
  if (destIdx <= originIdx) return 0;
  return stops
    .slice(originIdx + 1, destIdx + 1)
    .reduce((sum, s) => sum + s.leg_fare, 0);
}

/**
 * Reverse a route: the leg INTO a stop becomes the leg OUT of it, so we mirror
 * the leg array and rebuild cumulative fares from the new origin (Spec §5).
 */
export function reverseStops(stops: Stop[]): Stop[] {
  const legs = stops.map((s) => s.leg_fare);
  const rev = [...stops].reverse();
  let cum = 0;
  return rev.map((s, i) => {
    const leg = i === 0 ? 0 : legs[stops.length - i]; // mirror the leg
    cum += leg;
    return { ...s, order: i, leg_fare: leg, cumulative_fare: cum };
  });
}

/** Total fare end-to-end (origin → final stop). */
export function totalFare(stops: Stop[]): number {
  return stops.reduce((sum, s) => sum + s.leg_fare, 0);
}

/**
 * The stops for a selected trip (origin..destination inclusive), with order and
 * cumulative_fare re-based so the boarding stop reads ₦0 (Spec §3.4 ticket).
 * The first stop's leg_fare is forced to 0 (it is now the origin).
 */
export function tripSlice(stops: Stop[], originIdx: number, destIdx: number): Stop[] {
  if (destIdx <= originIdx) return [];
  let cum = 0;
  return stops.slice(originIdx, destIdx + 1).map((s, i) => {
    const leg = i === 0 ? 0 : s.leg_fare;
    cum += leg;
    return { ...s, order: i, leg_fare: leg, cumulative_fare: cum };
  });
}

/** "₦550" with locale grouping. The ₦ sits in body font beside the digits. */
export function formatFare(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** "35 min" / "1 hr 15 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** Stop count excludes the origin (a 5-stop route is "4 stops" of travel). */
export function travelStopCount(stops: Stop[]): number {
  return Math.max(0, stops.length - 1);
}

const VEHICLE_META: Record<Vehicle, string> = {
  DANFO: 'Danfo',
  BRT: 'BRT',
  KEKE: 'Keke',
  OKADA: 'Okada',
  FERRY: 'Ferry',
  RIDESHARE: 'Ride',
};

/** "Danfo · 5 stops · ~35 min" meta line for a RouteCard. */
export function routeMeta(vehicle: Vehicle, stops: Stop[], durationMin: number): string {
  const n = stops.length;
  return `${VEHICLE_META[vehicle]} · ${n} stop${n === 1 ? '' : 's'} · ~${formatDuration(durationMin)}`;
}

/**
 * Time-aware greeting. `hour` is injectable so the greeting is testable without
 * mocking the clock; defaults to the local hour at call time.
 */
export function greeting(hour: number = new Date().getHours(), name?: string): string {
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}
