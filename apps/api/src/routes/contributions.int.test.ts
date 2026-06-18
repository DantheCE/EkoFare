// ─────────────────────────────────────────────────────────────────────────────
// Integration: POST /contributions through the real app + DB. Confirms the wire
// shape the locked frontend depends on, and that bad bodies are rejected with
// the VALIDATION_ERROR contract. Run with `pnpm test:int`.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma, resetDb } from '../test/db';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /contributions', () => {
  it('accepts a valid contribution and returns the success superset', async () => {
    const res = await request(app)
      .post('/contributions')
      .send({
        submitted_name: 'Mile 2 to CMS',
        vehicle: 'DANFO',
        stops: [
          { name: 'Mile 2', leg_fare: 0 },
          { name: 'Festac', leg_fare: 100 },
          { name: 'CMS', leg_fare: 250 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'PENDING',
      warnings: [],
      connections_created: 2,
      connections_verified: 0,
    });
    expect(typeof res.body.id).toBe('string');
  });

  it('rejects a body whose first stop has a non-zero leg_fare', async () => {
    const res = await request(app)
      .post('/contributions')
      .send({
        submitted_name: 'Bad origin',
        vehicle: 'DANFO',
        stops: [
          { name: 'Mile 2', leg_fare: 50 },
          { name: 'Festac', leg_fare: 100 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('rejects an unknown vehicle', async () => {
    const res = await request(app)
      .post('/contributions')
      .send({
        submitted_name: 'Bad vehicle',
        vehicle: 'SPACESHIP',
        stops: [
          { name: 'Mile 2', leg_fare: 0 },
          { name: 'Festac', leg_fare: 100 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});
