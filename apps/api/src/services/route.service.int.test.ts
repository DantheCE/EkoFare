// ─────────────────────────────────────────────────────────────────────────────
// Integration: the headline Option A property — a route NO ONE submitted. Seed
// Ikeja→Oshodi and Oshodi→TBS as separate legs (each verified past the routing
// threshold); the pathfinder stitches Ikeja→Oshodi→TBS on demand. Also covers
// the routing gate (under-threshold legs are not routable) and the not-found
// paths. Run with `pnpm test:int`.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { ingest } from './contribution.service';
import { findRoute, getRouteById } from './route.service';
import { invalidateGraphCache } from './graph.service';
import { prisma, resetDb } from '../test/db';
import { ApiError } from '../lib/errors';
import type { ContributionInput } from '../types';

const app = createApp();

const MIN_REPORTS = Number(process.env.MIN_REPORTS_FOR_ROUTING ?? 3);

/** Submit a 2-stop leg `times` times with distinct fingerprints (so the 24h
 *  per-fingerprint dedupe doesn't swallow the reports) to push it past the
 *  routing threshold. */
async function seedLeg(from: string, to: string, fare: number, times = MIN_REPORTS): Promise<void> {
  const body: ContributionInput = {
    submitted_name: `${from} to ${to}`,
    vehicle: 'DANFO',
    stops: [
      { name: from, leg_fare: 0 },
      { name: to, leg_fare: fare },
    ],
  };
  for (let i = 0; i < times; i++) {
    await ingest(body, `fp-${from}-${to}-${i}`);
  }
}

beforeEach(async () => {
  await resetDb();
  invalidateGraphCache(); // truncate doesn't bump graph_version; force a reload
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('findRoute — stitched transfer', () => {
  it('computes Ikeja→TBS from two separately-submitted legs', async () => {
    await seedLeg('Ikeja', 'Oshodi', 200);
    await seedLeg('Oshodi', 'TBS', 150);
    invalidateGraphCache();

    const route = await findRoute('Ikeja', 'TBS');

    expect(route.from_stop).toBe('Ikeja');
    expect(route.to_stop).toBe('TBS');
    expect(route.stops.map((s) => s.name)).toEqual(['Ikeja', 'Oshodi', 'TBS']);
    expect(route.stops[0].leg_fare).toBe(0);
    expect(route.stops[1].leg_fare).toBe(200);
    expect(route.stops[2].leg_fare).toBe(150);
    expect(route.stops[2].cumulative_fare).toBe(350);
    expect(route.vehicle).toBe('DANFO');
    expect(route.status).toBe('UNVERIFIED'); // 3 reports per leg: routable, not yet VERIFIED
    expect(route.verification_count).toBe(MIN_REPORTS); // weakest leg
    expect(route.id).toMatch(/^dyn:/);
  });

  it('does not route across a leg below the report threshold', async () => {
    await seedLeg('Ikeja', 'Oshodi', 200);
    await seedLeg('Oshodi', 'TBS', 150, MIN_REPORTS - 1); // one short → not routable
    invalidateGraphCache();

    await expect(findRoute('Ikeja', 'TBS')).rejects.toMatchObject({ code: 'NO_ROUTE_FOUND' });
  });

  it('throws STOP_NOT_FOUND for an unknown origin', async () => {
    await seedLeg('Ikeja', 'Oshodi', 200);
    invalidateGraphCache();
    await expect(findRoute('Nowhere Town', 'Oshodi')).rejects.toBeInstanceOf(ApiError);
    await expect(findRoute('Nowhere Town', 'Oshodi')).rejects.toMatchObject({ code: 'STOP_NOT_FOUND' });
  });

  it('round-trips through getRouteById via the dyn: id', async () => {
    await seedLeg('Ikeja', 'Oshodi', 200);
    await seedLeg('Oshodi', 'TBS', 150);
    invalidateGraphCache();

    const route = await findRoute('Ikeja', 'TBS');
    const again = await getRouteById(route.id);
    expect(again.stops.map((s) => s.name)).toEqual(['Ikeja', 'Oshodi', 'TBS']);
    expect(again.id).toBe(route.id);
  });
});

describe('GET /routes/find (HTTP)', () => {
  it('returns the stitched route as a bare Route', async () => {
    await seedLeg('Ikeja', 'Oshodi', 200);
    await seedLeg('Oshodi', 'TBS', 150);
    invalidateGraphCache();

    const res = await request(app).get('/routes/find').query({ from: 'Ikeja', to: 'TBS' });
    expect(res.status).toBe(200);
    expect(res.body.from_stop).toBe('Ikeja');
    expect(res.body.to_stop).toBe('TBS');
    expect(res.body.stops).toHaveLength(3);
  });

  it('400s when from/to are missing', async () => {
    const res = await request(app).get('/routes/find').query({ from: 'Ikeja' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('404s with STOP_NOT_FOUND for an unknown stop', async () => {
    const res = await request(app).get('/routes/find').query({ from: 'Ikeja', to: 'Nowhere' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('STOP_NOT_FOUND');
  });
});
