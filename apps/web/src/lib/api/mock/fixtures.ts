// ─────────────────────────────────────────────────────────────────────────────
// Mock fixtures (Spec §4.4 seed data). Leg fares are authored compactly; the
// builder computes cumulative_fare, ids, and order so the fixtures can never
// drift from the fare math. Includes "Murtala Muhammed International Airport"
// to exercise long-name wrapping (Spec §7).
// ─────────────────────────────────────────────────────────────────────────────

import type { Route, RouteStatus, Vehicle, Stop } from '../../../types';

interface SeedRoute {
  id: string;
  vehicle: Vehicle;
  status: RouteStatus;
  duration_min: number;
  verification_count: number;
  last_updated: string;
  /** [name, legFareFromPrevious] — first leg is always 0. */
  legs: [string, number][];
}

function buildStops(routeId: string, legs: [string, number][]): Stop[] {
  let cum = 0;
  return legs.map(([name, leg], i) => {
    cum += leg;
    return {
      id: `${routeId}-stop-${i}`,
      name,
      order: i,
      leg_fare: leg,
      cumulative_fare: cum,
    };
  });
}

function buildRoute(seed: SeedRoute): Route {
  const stops = buildStops(seed.id, seed.legs);
  const from_stop = stops[0].name;
  const to_stop = stops[stops.length - 1].name;
  return {
    id: seed.id,
    name: `${from_stop} → ${to_stop}`,
    from_stop,
    to_stop,
    vehicle: seed.vehicle,
    status: seed.status,
    verification_count: seed.verification_count,
    duration_min: seed.duration_min,
    stops,
    last_updated: seed.last_updated,
  };
}

const SEED: SeedRoute[] = [
  {
    id: 'mile2-cms',
    vehicle: 'DANFO',
    status: 'MAJOR',
    duration_min: 35,
    verification_count: 47,
    last_updated: '2026-06-06T07:40:00Z',
    legs: [
      ['Mile 2', 0],
      ['Orile', 200],
      ['Costain', 100],
      ['National Theatre', 100],
      ['CMS', 150],
    ],
  },
  {
    id: 'berger-tbs',
    vehicle: 'BRT',
    status: 'MAJOR',
    duration_min: 52,
    verification_count: 63,
    last_updated: '2026-06-07T06:15:00Z',
    legs: [
      ['Berger', 0],
      ['Ojota', 150],
      ['Maryland', 100],
      ['Palmgrove', 100],
      ['Fadeyi', 100],
      ['Yaba', 150],
      ['CMS', 200],
      ['TBS', 100],
    ],
  },
  {
    id: 'airport-tbs',
    vehicle: 'BRT',
    status: 'VERIFIED',
    duration_min: 14,
    verification_count: 14,
    last_updated: '2026-06-05T09:30:00Z',
    legs: [
      ['Murtala Muhammed International Airport', 0],
      ['Ikeja Along', 200],
      ['Oshodi', 200],
      ['Costain', 150],
      ['CMS', 100],
      ['TBS', 100],
    ],
  },
  {
    id: 'ikeja-oshodi',
    vehicle: 'DANFO',
    status: 'VERIFIED',
    duration_min: 8,
    verification_count: 9,
    last_updated: '2026-06-04T17:05:00Z',
    legs: [
      ['Ikeja', 0],
      ['Allen Junction', 100],
      ['Oregun', 150],
      ['Oshodi', 100],
    ],
  },
  {
    id: 'ikorodu-mile12',
    vehicle: 'DANFO',
    status: 'VERIFIED',
    duration_min: 11,
    verification_count: 12,
    last_updated: '2026-06-06T12:20:00Z',
    legs: [
      ['Ikorodu', 0],
      ['Owutu', 150],
      ['Agric', 150],
      ['Benson', 100],
      ['Mile 12', 200],
    ],
  },
];

export const MOCK_ROUTES: Route[] = SEED.map(buildRoute);

export function findMockRoute(id: string): Route | undefined {
  return MOCK_ROUTES.find((r) => r.id === id);
}
