// ─────────────────────────────────────────────────────────────────────────────
// Stop resolution (build spec §5.1). Wraps the pure normalize() with the DB
// resolution order:
//   1. exact name_normalized match    → that Stop
//   2. StopAlias.alias_norm match      → its canonical Stop
//   3. no match → create (contribution path) OR trigram-suggest (query path)
// Never silently merges two distinct stops; ambiguous cases surface to admin.
// ─────────────────────────────────────────────────────────────────────────────

import type { Prisma, PrismaClient, Stop } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalize } from '../lib/normalize';
import type { ResolvedStop } from '../types';

// Accept either the base client or a transaction client (contribution shred runs
// resolution inside prisma.$transaction).
type Db = PrismaClient | Prisma.TransactionClient;

const TRIGRAM_THRESHOLD = 0.4; // spec §5.1: similarity() >= 0.4 for candidates

/** Exact-or-alias lookup. Returns the canonical Stop or null. No creation. */
export async function resolveExisting(name: string, db: Db = prisma): Promise<Stop | null> {
  const norm = normalize(name);

  const exact = await db.stop.findUnique({ where: { name_normalized: norm } });
  if (exact) return exact;

  const alias = await db.stopAlias.findUnique({ where: { alias_norm: norm } });
  if (alias) {
    return db.stop.findUnique({ where: { id: alias.canonical_id } });
  }
  return null;
}

/** Resolve a stop, creating a new node when none exists. Used on contribution. */
export async function resolveOrCreate(name: string, db: Db = prisma): Promise<ResolvedStop> {
  const existing = await resolveExisting(name, db);
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      name_normalized: existing.name_normalized,
      created: false,
    };
  }

  const norm = normalize(name);
  const created = await db.stop.create({
    data: { name: name.trim(), name_normalized: norm },
  });
  return { id: created.id, name: created.name, name_normalized: created.name_normalized, created: true };
}

/** Resolve an ordered list of names (contribution shred). Order preserved. */
export async function resolveStops(names: string[], db: Db = prisma): Promise<ResolvedStop[]> {
  const out: ResolvedStop[] = [];
  for (const name of names) {
    out.push(await resolveOrCreate(name, db));
  }
  return out;
}

export interface StopSuggestion {
  id: string;
  name: string;
  similarity: number;
}

/** Trigram fuzzy candidates for a query that matched nothing exactly (spec §5.1).
 *  Returns candidates rather than guessing a single match. */
export async function suggestStops(name: string, limit = 5, db: Db = prisma): Promise<StopSuggestion[]> {
  const norm = normalize(name);
  if (!norm) return [];
  // pg_trgm similarity over the normalized column (GIN index added in migration).
  const rows = await db.$queryRaw<StopSuggestion[]>`
    SELECT id, name, similarity(name_normalized, ${norm}) AS similarity
    FROM "Stop"
    WHERE similarity(name_normalized, ${norm}) >= ${TRIGRAM_THRESHOLD}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;
  return rows;
}
