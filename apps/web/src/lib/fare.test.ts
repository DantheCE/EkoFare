import { describe, it, expect } from 'vitest';
import {
  fareBetween,
  reverseStops,
  totalFare,
  formatFare,
  formatDuration,
  travelStopCount,
  routeMeta,
  greeting,
} from './fare';
import { MOCK_ROUTES, findMockRoute } from './api/mock/fixtures';
import type { Stop } from '../types';

// Mile 2 → CMS: legs [0,200,100,100,150] → cumulative [0,200,300,400,550]
const mile2 = findMockRoute('mile2-cms')!;
const stops: Stop[] = mile2.stops;

describe('fixtures build correctly', () => {
  it('computes cumulative fares from legs', () => {
    expect(stops.map((s) => s.cumulative_fare)).toEqual([0, 200, 300, 400, 550]);
  });
  it('names the route from first → last stop', () => {
    expect(mile2.name).toBe('Mile 2 → CMS');
    expect(mile2.from_stop).toBe('Mile 2');
    expect(mile2.to_stop).toBe('CMS');
  });
  it('keeps every fixture origin leg at 0', () => {
    for (const r of MOCK_ROUTES) expect(r.stops[0].leg_fare).toBe(0);
  });
  it('includes a long stop name to exercise wrapping', () => {
    const airport = findMockRoute('airport-tbs')!;
    expect(airport.stops[0].name).toBe('Murtala Muhammed International Airport');
  });
});

describe('fareBetween', () => {
  it('sums legs inclusive of the destination leg', () => {
    expect(fareBetween(stops, 0, 4)).toBe(550);
    expect(fareBetween(stops, 0, 2)).toBe(300);
    expect(fareBetween(stops, 1, 3)).toBe(200);
  });
  it('returns 0 when destination is at or before origin', () => {
    expect(fareBetween(stops, 2, 2)).toBe(0);
    expect(fareBetween(stops, 3, 1)).toBe(0);
  });
});

describe('reverseStops', () => {
  const rev = reverseStops(stops);
  it('reverses order and re-tags from 0', () => {
    expect(rev.map((s) => s.name)).toEqual([
      'CMS',
      'National Theatre',
      'Costain',
      'Orile',
      'Mile 2',
    ]);
    expect(rev.map((s) => s.order)).toEqual([0, 1, 2, 3, 4]);
  });
  it('mirrors legs: leg into a stop becomes leg out', () => {
    expect(rev.map((s) => s.leg_fare)).toEqual([0, 150, 100, 100, 200]);
    expect(rev.map((s) => s.cumulative_fare)).toEqual([0, 150, 250, 350, 550]);
  });
  it('preserves the end-to-end total', () => {
    expect(totalFare(rev)).toBe(totalFare(stops));
  });
});

describe('formatters', () => {
  it('formats fares with naira sign and grouping', () => {
    expect(formatFare(550)).toBe('₦550');
    expect(formatFare(1500)).toBe('₦1,500');
    expect(formatFare(0)).toBe('₦0');
  });
  it('formats durations', () => {
    expect(formatDuration(35)).toBe('35 min');
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(75)).toBe('1 hr 15 min');
  });
  it('counts travel stops excluding the origin', () => {
    expect(travelStopCount(stops)).toBe(4);
  });
  it('builds the route meta line', () => {
    expect(routeMeta('DANFO', stops, 35)).toBe('Danfo · 5 stops · ~35 min');
  });
});

describe('greeting', () => {
  it('is time aware', () => {
    expect(greeting(9)).toBe('Good morning');
    expect(greeting(13)).toBe('Good afternoon');
    expect(greeting(20)).toBe('Good evening');
  });
  it('appends a name when given', () => {
    expect(greeting(9, 'Dan')).toBe('Good morning, Dan');
  });
});
