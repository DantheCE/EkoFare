import { describe, it, expect } from 'vitest';
import {
  pickMedian,
  mean,
  stddev,
  deriveStatus,
  computeConsensus,
} from './consensus';

describe('pickMedian', () => {
  it('returns the middle of an odd-length list', () => {
    expect(pickMedian([300, 100, 200])).toBe(200);
  });
  it('averages the two middles (rounded) for even-length lists', () => {
    expect(pickMedian([100, 200, 300, 400])).toBe(250);
    expect(pickMedian([100, 150])).toBe(125);
    expect(pickMedian([100, 175])).toBe(138); // 137.5 → 138
  });
  it('is order-independent', () => {
    expect(pickMedian([400, 100, 300, 200])).toBe(250);
  });
  it('returns 0 for an empty list', () => {
    expect(pickMedian([])).toBe(0);
  });
});

describe('mean / stddev', () => {
  it('computes the mean', () => {
    expect(mean([100, 200, 300])).toBe(200);
  });
  it('computes population standard deviation', () => {
    expect(stddev([200, 200, 200])).toBe(0);
    expect(stddev([100, 300], 200)).toBe(100);
  });
});

describe('deriveStatus', () => {
  it('maps clean-report count to confidence', () => {
    expect(deriveStatus(0)).toBe('UNVERIFIED');
    expect(deriveStatus(4)).toBe('UNVERIFIED');
    expect(deriveStatus(5)).toBe('VERIFIED');
    expect(deriveStatus(19)).toBe('VERIFIED');
    expect(deriveStatus(20)).toBe('MAJOR');
  });
});

describe('computeConsensus', () => {
  it('takes the median and counts all reports when below the outlier threshold', () => {
    const r = computeConsensus([200, 250, 300], { sigma: 2 });
    expect(r.median_fare).toBe(250);
    expect(r.fare_reports).toBe(3);
    expect(r.status).toBe('UNVERIFIED');
    expect(r.outliers).toEqual([false, false, false]);
  });

  it('does NOT flag a wild value while under 5 reports (insufficient signal)', () => {
    const r = computeConsensus([200, 200, 9999], { sigma: 2 });
    expect(r.outliers).toEqual([false, false, false]);
    expect(r.fare_reports).toBe(3);
    expect(r.median_fare).toBe(200);
  });

  it('flags a fat-finger outlier once there are >= 5 reports and excludes it', () => {
    // median 200; the 9999 sits far beyond 2σ → flagged, excluded from consensus
    const r = computeConsensus([200, 200, 200, 200, 200, 9999], { sigma: 2 });
    expect(r.outliers).toEqual([false, false, false, false, false, true]);
    expect(r.median_fare).toBe(200);
    expect(r.fare_reports).toBe(5); // outlier excluded
    expect(r.status).toBe('VERIFIED');
  });

  it('keeps every report when all values agree (sd = 0, nothing flagged)', () => {
    const r = computeConsensus([200, 200, 200, 200, 200], { sigma: 2 });
    expect(r.outliers.every((o) => o === false)).toBe(true);
    expect(r.fare_reports).toBe(5);
    expect(r.status).toBe('VERIFIED');
  });

  it('promotes to MAJOR at 20 clean reports', () => {
    const r = computeConsensus(Array(20).fill(250), { sigma: 2 });
    expect(r.status).toBe('MAJOR');
    expect(r.median_fare).toBe(250);
  });
});
