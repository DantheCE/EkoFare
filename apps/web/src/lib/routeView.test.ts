import { describe, it, expect } from 'vitest';
import { filterAndSortRoutes } from './routeView';
import { MOCK_ROUTES } from './api/mock/fixtures';

const ids = (rs: { id: string }[]) => rs.map((r) => r.id);

describe('filterAndSortRoutes', () => {
  it('sorts by verification count (default)', () => {
    const r = filterAndSortRoutes(MOCK_ROUTES, { vehicle: 'ALL', query: '', sort: 'verified' });
    expect(ids(r)).toEqual(['berger-tbs', 'mile2-cms', 'airport-tbs', 'ikorodu-mile12', 'ikeja-oshodi', 'sangotedo-ajah']);
  });

  it('sorts by shortest duration', () => {
    const r = filterAndSortRoutes(MOCK_ROUTES, { vehicle: 'ALL', query: '', sort: 'shortest' });
    expect(ids(r)).toEqual(['ikeja-oshodi', 'ikorodu-mile12', 'airport-tbs', 'mile2-cms', 'sangotedo-ajah', 'berger-tbs']);
  });

  it('sorts by cheapest end-to-end fare', () => {
    const r = filterAndSortRoutes(MOCK_ROUTES, { vehicle: 'ALL', query: '', sort: 'cheapest' });
    expect(ids(r)).toEqual(['ikeja-oshodi', 'sangotedo-ajah', 'mile2-cms', 'ikorodu-mile12', 'airport-tbs', 'berger-tbs']);
  });

  it('filters by vehicle', () => {
    const r = filterAndSortRoutes(MOCK_ROUTES, { vehicle: 'DANFO', query: '', sort: 'verified' });
    expect(ids(r)).toEqual(['mile2-cms', 'ikorodu-mile12', 'ikeja-oshodi', 'sangotedo-ajah']);
  });

  it('matches a query against route name OR any stop name', () => {
    const r = filterAndSortRoutes(MOCK_ROUTES, { vehicle: 'ALL', query: 'oshodi', sort: 'verified' });
    expect(new Set(ids(r))).toEqual(new Set(['airport-tbs', 'ikeja-oshodi']));
  });

  it('returns empty for no matches', () => {
    const r = filterAndSortRoutes(MOCK_ROUTES, { vehicle: 'ALL', query: 'zzz', sort: 'verified' });
    expect(r).toEqual([]);
  });
});
