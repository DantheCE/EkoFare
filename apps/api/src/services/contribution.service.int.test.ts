// ─────────────────────────────────────────────────────────────────────────────
// Integration: the contribution shred against a real Postgres test DB. Proves
// the core Option A invariants — a path becomes N-1 edges, resubmissions add
// reports without duplicating edges and shift the median, and the per-fingerprint
// 24h dedupe holds. Run with `pnpm test:int`.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { ingest } from './contribution.service';
import { prisma, resetDb } from '../test/db';
import type { ContributionInput } from '../types';

function contribution(stops: [string, number][], vehicle = 'DANFO'): ContributionInput {
  return {
    submitted_name: stops.map((s) => s[0]).join(' to '),
    vehicle: vehicle as ContributionInput['vehicle'],
    stops: stops.map(([name, leg_fare]) => ({ name, leg_fare })),
  };
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ingest — shred', () => {
  it('shreds an N-stop path into N-1 directed connections', async () => {
    const res = await ingest(
      contribution([
        ['Mile 2', 0],
        ['Festac', 100],
        ['CMS', 250],
      ]),
      'fp-a',
    );

    expect(res.connections_created).toBe(2);
    expect(res.connections_verified).toBe(0);
    expect(res.status).toBe('PENDING');
    expect(res.warnings).toEqual([]);

    const conns = await prisma.connection.findMany();
    expect(conns).toHaveLength(2);

    const stops = await prisma.stop.findMany();
    expect(stops).toHaveLength(3);

    const reports = await prisma.fareReport.findMany();
    expect(reports).toHaveLength(2);
    // First leg fare attaches to the FIRST edge (Mile 2 -> Festac = 100).
    expect(reports.map((r) => r.fare).sort((a, b) => a - b)).toEqual([100, 250]);
  });

  it('reuses edges on resubmission and shifts the median without duplicating connections', async () => {
    const path = contribution([
      ['Mile 2', 0],
      ['Festac', 100],
    ]);

    await ingest(path, 'fp-1');
    const second = await ingest(
      contribution([
        ['Mile 2', 0],
        ['Festac', 200],
      ]),
      'fp-2',
    );

    expect(second.connections_created).toBe(0);
    expect(second.connections_verified).toBe(1);

    const conns = await prisma.connection.findMany();
    expect(conns).toHaveLength(1);
    expect(conns[0].fare_reports).toBe(2);
    // Median of [100, 200] = 150 (even count, rounded average).
    expect(conns[0].median_fare).toBe(150);
  });

  it('drops a same-fingerprint resubmission of the same edge within 24h (dedupe)', async () => {
    const path = contribution([
      ['Mile 2', 0],
      ['Festac', 100],
    ]);

    await ingest(path, 'same-fp');
    const dup = await ingest(
      contribution([
        ['Mile 2', 0],
        ['Festac', 500],
      ]),
      'same-fp',
    );

    // Edge already existed → counted as verified, but the report is dropped.
    expect(dup.connections_verified).toBe(1);

    const conns = await prisma.connection.findMany();
    expect(conns[0].fare_reports).toBe(1);
    expect(conns[0].median_fare).toBe(100); // unchanged by the dropped 500

    const reports = await prisma.fareReport.findMany();
    expect(reports).toHaveLength(1);
  });

  it('skips a self-loop when adjacent stops normalize to the same node', async () => {
    const res = await ingest(
      contribution([
        ['Oshodi', 0],
        ['Oshodi Bus Stop', 150], // normalizes to "oshodi" — same node
        ['Ikeja', 200],
      ]),
      'fp-loop',
    );

    // Only the Oshodi -> Ikeja edge is real.
    expect(res.connections_created).toBe(1);
    const conns = await prisma.connection.findMany();
    expect(conns).toHaveLength(1);
    expect(conns[0].median_fare).toBe(200);
  });
});
