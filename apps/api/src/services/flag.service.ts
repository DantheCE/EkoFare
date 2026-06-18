// ─────────────────────────────────────────────────────────────────────────────
// Abuse flags (build spec §8). Anyone can flag a connection or a specific report
// as wrong/abusive; flags land in an admin queue (status "open") rather than
// mutating the graph. Resolution is an admin action. A flag must point at
// something that exists, so junk targets are rejected at creation.
// ─────────────────────────────────────────────────────────────────────────────

import type { AbuseFlag } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notFound, validation } from '../lib/errors';

export interface CreateFlagInput {
  connection_id?: string | null;
  report_id?: string | null;
  reason: string;
}

/** File an abuse flag. Validates the target exists. */
export async function createFlag(input: CreateFlagInput, fingerprint: string): Promise<AbuseFlag> {
  if (!input.connection_id && !input.report_id) {
    throw validation([{ field: 'connection_id', message: 'A connection_id or report_id is required.' }]);
  }

  if (input.connection_id) {
    const conn = await prisma.connection.findUnique({ where: { id: input.connection_id }, select: { id: true } });
    if (!conn) throw notFound('Flagged connection not found.');
  }
  if (input.report_id) {
    const report = await prisma.fareReport.findUnique({ where: { id: input.report_id }, select: { id: true } });
    if (!report) throw notFound('Flagged report not found.');
  }

  return prisma.abuseFlag.create({
    data: {
      connection_id: input.connection_id ?? null,
      report_id: input.report_id ?? null,
      reason: input.reason,
      fingerprint,
    },
  });
}

/** Admin queue: flags by status (default open), newest first. */
export function listFlags(status = 'open'): Promise<AbuseFlag[]> {
  return prisma.abuseFlag.findMany({ where: { status }, orderBy: { created_at: 'desc' } });
}

/** Admin action: mark a flag resolved. */
export async function resolveFlag(id: string): Promise<AbuseFlag> {
  const existing = await prisma.abuseFlag.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound('Flag not found.');
  return prisma.abuseFlag.update({ where: { id }, data: { status: 'resolved' } });
}
