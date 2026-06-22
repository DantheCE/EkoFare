// ─────────────────────────────────────────────────────────────────────────────
// Integration: the featured board and the stop-centric reads. Seed a small
// network, rebuild the board, then exercise GET /routes (list + filters),
// /routes/search, and /stops/:name/routes through the real app. Run with
// `pnpm test:int`.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { ingest } from './contribution.service';
import { rebuildFeaturedRoutes } from './featured.service';
import { invalidateGraphCache } from './graph.service';
import { prisma, resetDb } from '../test/db';
import type { ContributionInput } from '../types';

const app = createApp();
const MIN_REPORTS = Number(process.env.MIN_REPORTS_FOR_ROUTING ?? 3);

async function seedLeg(from: string, to: string, fare: number, times = MIN_REPORTS): Promise<void> {
  const body: ContributionInput = {
    submitted_name: `${from} to ${to}`,
    vehicle: 'DANFO',
    stops: [
      { name: from, leg_fare: 0 },
      { name: to, leg_fare: fare },
    ],
  };
  for (let i = 0; i < times; i++) await ingest(body, `fp-${from}-${to}-${i}`);
}

/** Seed a small DANFO network: Ikeja→Oshodi→TBS, plus Oshodi→CMS. */
async function seedNetwork(): Promise<void> {
  await seedLeg('Ikeja', 'Oshodi', 200);
  await seedLeg('Oshodi', 'TBS', 150);
  await seedLeg('Oshodi', 'CMS', 120);
  invalidateGraphCache();
  await rebuildFeaturedRoutes();
}

beforeEach(async () => {
  await resetDb();
  invalidateGraphCache();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('rebuildFeaturedRoutes', () => {
  it('stores featured routes computed from the graph', async () => {
    await seedNetwork();
    const rows = await prisma.featuredRoute.findMany();
    expect(rows.length).toBeGreaterThan(0);
    // Ikeja→TBS is a stitched 3-stop route nobody submitted whole.
    const stitched = rows.find((r) => r.name === 'Ikeja → TBS');
    expect(stitched).toBeDefined();
    expect(stitched!.path).toHaveLength(3);
    expect(stitched!.total_fare).toBe(350);
    expect(stitched!.min_verification).toBe(MIN_REPORTS);
  });

  it('replaces the board on each rebuild (no accumulation)', async () => {
    await seedNetwork();
    const first = await prisma.featuredRoute.count();
    await rebuildFeaturedRoutes();
    const second = await prisma.featuredRoute.count();
    expect(second).toBe(first);
  });
});

describe('GET /routes', () => {
  it('lists the board', async () => {
    await seedNetwork();
    const res = await request(app).get('/routes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.routes)).toBe(true);
    expect(res.body.routes.length).toBeGreaterThan(0);
    expect(res.body.routes.map((r: { name: string }) => r.name)).toContain('Ikeja → TBS');
  });

  it('filters by vehicle (BRT board is empty here)', async () => {
    await seedNetwork();
    const res = await request(app).get('/routes').query({ vehicle: 'BRT' });
    expect(res.status).toBe(200);
    expect(res.body.routes).toEqual([]);
  });

  it('400s on an invalid status filter', async () => {
    const res = await request(app).get('/routes').query({ status: 'BOGUS' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  // Regression: clicking a board route must open its detail. Board routes carry
  // stable dyn: ids, not FeaturedRoute row ids (which rotate every rebuild), so
  // GET /routes/:id resolves them — even after a rebuild reissues the rows.
  it('serves board ids that GET /routes/:id resolves, surviving a rebuild', async () => {
    await seedNetwork();

    const list = await request(app).get('/routes');
    const boardId = list.body.routes[0].id as string;
    expect(boardId).toMatch(/^dyn:/);

    const detail = await request(app).get(`/routes/${encodeURIComponent(boardId)}`);
    expect(detail.status).toBe(200);
    expect(detail.body.id).toBe(boardId);

    // Rebuild rotates the underlying FeaturedRoute row ids; the dyn id still opens.
    await rebuildFeaturedRoutes();
    const afterRebuild = await request(app).get(`/routes/${encodeURIComponent(boardId)}`);
    expect(afterRebuild.status).toBe(200);
    expect(afterRebuild.body.id).toBe(boardId);
  });
});

describe('GET /routes/search', () => {
  it('returns matching routes and stops with their route ids', async () => {
    await seedNetwork();
    const res = await request(app).get('/routes/search').query({ q: 'Oshodi' });
    expect(res.status).toBe(200);
    expect(res.body.routes.length).toBeGreaterThan(0);
    const oshodi = res.body.stops.find((s: { name: string }) => s.name === 'Oshodi');
    expect(oshodi).toBeDefined();
    expect(oshodi.route_ids.length).toBeGreaterThan(0);
  });

  it('returns empty results for a blank query', async () => {
    await seedNetwork();
    const res = await request(app).get('/routes/search').query({ q: '' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ routes: [], stops: [] });
  });
});

describe('GET /stops/:name/routes', () => {
  it('returns routes through a stop with matching_stop_position', async () => {
    await seedNetwork();
    const res = await request(app).get('/stops/Oshodi/routes');
    expect(res.status).toBe(200);
    expect(res.body.stop).toBe('Oshodi');
    expect(res.body.routes.length).toBeGreaterThan(0);
    for (const r of res.body.routes) {
      expect(typeof r.matching_stop_position).toBe('number');
      expect(r.stops[r.matching_stop_position].name).toBe('Oshodi');
    }
  });

  it('404s STOP_NOT_FOUND for an unknown stop', async () => {
    await seedNetwork();
    const res = await request(app).get('/stops/Nowhere/routes');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('STOP_NOT_FOUND');
  });
});
