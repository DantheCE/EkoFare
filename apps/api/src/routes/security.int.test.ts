// ─────────────────────────────────────────────────────────────────────────────
// Integration: Phase 5 security + admin. Rate limiting (429 contract), abuse
// flags, and the admin surface — login (JWT), the flag queue, stop-merge (with
// edge collision folding), and connection patch. Run with `pnpm test:int`.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { ingest } from '../services/contribution.service';
import { invalidateGraphCache } from '../services/graph.service';
import { prisma, resetDb } from '../test/db';
import type { ContributionInput } from '../types';

const app = createApp();
const MIN_REPORTS = Number(process.env.MIN_REPORTS_FOR_ROUTING ?? 3);
const CONTRIB_LIMIT = Number(process.env.RATE_LIMIT_CONTRIB_PER_HOUR ?? 5);

const ADMIN_EMAIL = 'admin@test.dev';
const ADMIN_PASSWORD = 'sup3r-secret-pw';

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

async function adminToken(): Promise<string> {
  const res = await request(app).post('/admin/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

beforeAll(async () => {
  // Admin user the login tests authenticate as (AdminUser is not truncated by
  // resetDb, so create it once here).
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.adminUser.create({
    data: { email: ADMIN_EMAIL, password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 8) },
  });
});

beforeEach(async () => {
  await resetDb();
  invalidateGraphCache();
});

afterAll(async () => {
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
});

describe('rate limiting — POST /contributions', () => {
  it(`429s past ${CONTRIB_LIMIT}/hour with the RATE_LIMIT_EXCEEDED contract`, async () => {
    const body = {
      submitted_name: 'Rate test',
      vehicle: 'DANFO',
      stops: [
        { name: 'RL-A', leg_fare: 0 },
        { name: 'RL-B', leg_fare: 100 },
      ],
    };
    const fp = 'rate-burst-fingerprint'; // distinct key so other tests are unaffected

    for (let i = 0; i < CONTRIB_LIMIT; i++) {
      const ok = await request(app).post('/contributions').set('X-EkoFare-Fingerprint', fp).send(body);
      expect(ok.status).toBe(201);
    }
    const blocked = await request(app).post('/contributions').set('X-EkoFare-Fingerprint', fp).send(body);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('RATE_LIMIT_EXCEEDED');
    expect(typeof blocked.body.retry_after).toBe('number');
  });
});

describe('POST /flags', () => {
  it('files a flag against a connection', async () => {
    await seedLeg('Yaba', 'CMS', 100);
    invalidateGraphCache();
    const conn = await prisma.connection.findFirst();

    const res = await request(app).post('/flags').send({ connection_id: conn!.id, reason: 'Fare is wrong' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');

    const flags = await prisma.abuseFlag.findMany();
    expect(flags).toHaveLength(1);
    expect(flags[0].connection_id).toBe(conn!.id);
  });

  it('400s without a target', async () => {
    const res = await request(app).post('/flags').send({ reason: 'no target' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('404s for an unknown connection', async () => {
    const res = await request(app).post('/flags').send({ connection_id: 'nope', reason: 'ghost' });
    expect(res.status).toBe(404);
  });
});

describe('admin auth', () => {
  it('rejects an unauthenticated admin request', async () => {
    const res = await request(app).get('/admin/flags');
    expect(res.status).toBe(401);
  });

  it('rejects bad credentials', async () => {
    const res = await request(app).post('/admin/login').send({ email: ADMIN_EMAIL, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('logs in and lists the flag queue', async () => {
    await seedLeg('Yaba', 'CMS', 100);
    const conn = await prisma.connection.findFirst();
    await request(app).post('/flags').send({ connection_id: conn!.id, reason: 'wrong' });

    const token = await adminToken();
    const res = await request(app).get('/admin/flags').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.flags.length).toBe(1);

    // Resolve it; it leaves the open queue.
    const resolved = await request(app)
      .patch(`/admin/flags/${res.body.flags[0].id}/resolve`)
      .set('Authorization', `Bearer ${token}`);
    expect(resolved.status).toBe(200);
    expect(resolved.body.status).toBe('resolved');

    const after = await request(app).get('/admin/flags').set('Authorization', `Bearer ${token}`);
    expect(after.body.flags).toHaveLength(0);
  });
});

describe('admin — stop merge', () => {
  it('merges a duplicate stop, folding the colliding edge and its reports', async () => {
    // Two spellings that normalize differently → two distinct nodes, both with
    // an edge to CMS. Merging Yabba→Yaba collapses the two CMS edges into one.
    await seedLeg('Yaba', 'CMS', 100);
    await seedLeg('Yabba', 'CMS', 130);
    invalidateGraphCache();

    const yaba = await prisma.stop.findUnique({ where: { name_normalized: 'yaba' } });
    const yabba = await prisma.stop.findUnique({ where: { name_normalized: 'yabba' } });
    expect(yaba && yabba).toBeTruthy();

    const token = await adminToken();
    const res = await request(app)
      .post('/admin/stops/merge')
      .set('Authorization', `Bearer ${token}`)
      .send({ alias_stop_id: yabba!.id, into_stop_id: yaba!.id });
    expect(res.status).toBe(200);
    expect(res.body.connections_repointed).toBeGreaterThan(0);

    // Yabba is gone; its name is now an alias of Yaba.
    expect(await prisma.stop.findUnique({ where: { id: yabba!.id } })).toBeNull();
    const alias = await prisma.stopAlias.findUnique({ where: { alias_norm: 'yabba' } });
    expect(alias?.canonical_id).toBe(yaba!.id);

    // One Yaba→CMS edge survives, carrying both spellings' reports (3 + 3 = 6).
    const cms = await prisma.stop.findUnique({ where: { name_normalized: 'cms' } });
    const edges = await prisma.connection.findMany({
      where: { from_stop_id: yaba!.id, to_stop_id: cms!.id },
    });
    expect(edges).toHaveLength(1);
    expect(edges[0].fare_reports).toBe(2 * MIN_REPORTS);
  });

  it('400s when merging a stop into itself', async () => {
    await seedLeg('Yaba', 'CMS', 100);
    const yaba = await prisma.stop.findUnique({ where: { name_normalized: 'yaba' } });
    const token = await adminToken();
    const res = await request(app)
      .post('/admin/stops/merge')
      .set('Authorization', `Bearer ${token}`)
      .send({ alias_stop_id: yaba!.id, into_stop_id: yaba!.id });
    expect(res.status).toBe(400);
  });
});

describe('admin — connection patch', () => {
  it('overrides a connection fare and status', async () => {
    await seedLeg('Yaba', 'CMS', 100);
    const conn = await prisma.connection.findFirst();
    const token = await adminToken();

    const res = await request(app)
      .patch(`/admin/connections/${conn!.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ median_fare: 999, status: 'MAJOR' });
    expect(res.status).toBe(200);
    expect(res.body.median_fare).toBe(999);
    expect(res.body.status).toBe('MAJOR');
  });
});
