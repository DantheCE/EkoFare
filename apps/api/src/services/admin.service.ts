// ─────────────────────────────────────────────────────────────────────────────
// Admin operations (build spec §9). Data-quality tools that need a human:
//   - login: bcrypt-checked, issues a JWT (env admin OR AdminUser row).
//   - mergeStops: collapse a duplicate stop into a canonical one, repointing its
//     connections and folding colliding edges' reports together. The hard part
//     is the (from,to,vehicle) unique constraint — repointing can collide with an
//     existing edge, so those are merged rather than left to throw.
//   - patchConnection: manual fare/status/duration correction.
// Graph-mutating ops bump graph_version and drop the in-memory snapshot so reads
// see the change immediately.
// ─────────────────────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';
import type { Connection } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { notFound, unauthorized, validation } from '../lib/errors';
import { signAdminToken } from '../middleware/auth';
import { recomputeConsensus } from './consensus.service';
import { bumpGraphVersion } from '../lib/graphVersion';
import { invalidateGraphCache } from './graph.service';
import type { ConnStatusValue } from '../lib/consensus';

/** Verify credentials against the env admin or an AdminUser row. */
async function verifyCredentials(email: string, password: string): Promise<boolean> {
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD_HASH && email === env.ADMIN_EMAIL) {
    return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  }
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return false;
  return bcrypt.compare(password, user.password_hash);
}

/** Authenticate and return a signed admin JWT. Throws UNAUTHORIZED on failure. */
export async function login(email: string, password: string): Promise<string> {
  if (!env.JWT_SECRET) throw unauthorized('Admin authentication is not configured.');
  if (!(await verifyCredentials(email, password))) throw unauthorized('Invalid credentials.');
  return signAdminToken(email);
}

export interface MergeResult {
  merged_stop_id: string;
  into_stop_id: string;
  connections_repointed: number;
}

/** Merge `aliasId` into `intoId`: repoint connections, fold colliding edges,
 *  record the alias, delete the duplicate stop. */
export async function mergeStops(aliasId: string, intoId: string): Promise<MergeResult> {
  if (aliasId === intoId) {
    throw validation([{ field: 'alias_stop_id', message: 'Cannot merge a stop into itself.' }]);
  }

  const repointed = await prisma.$transaction(
    async (tx) => {
      const alias = await tx.stop.findUnique({ where: { id: aliasId } });
      const into = await tx.stop.findUnique({ where: { id: intoId } });
      if (!alias) throw notFound('Alias stop not found.');
      if (!into) throw notFound('Target stop not found.');

      const touching = await tx.connection.findMany({
        where: { OR: [{ from_stop_id: aliasId }, { to_stop_id: aliasId }] },
      });

      let count = 0;
      for (const c of touching) {
        const newFrom = c.from_stop_id === aliasId ? intoId : c.from_stop_id;
        const newTo = c.to_stop_id === aliasId ? intoId : c.to_stop_id;

        // Repointing collapsed this edge onto itself → drop it (cascade removes
        // its reports).
        if (newFrom === newTo) {
          await tx.connection.delete({ where: { id: c.id } });
          continue;
        }

        const collision = await tx.connection.findUnique({
          where: {
            from_stop_id_to_stop_id_vehicle: { from_stop_id: newFrom, to_stop_id: newTo, vehicle: c.vehicle },
          },
          select: { id: true },
        });

        if (collision && collision.id !== c.id) {
          // An equivalent edge already exists: move c's reports onto it, drop c,
          // and recompute the survivor's consensus over the combined evidence.
          await tx.fareReport.updateMany({ where: { connection_id: c.id }, data: { connection_id: collision.id } });
          await tx.connection.delete({ where: { id: c.id } });
          await recomputeConsensus(collision.id, tx);
        } else {
          await tx.connection.update({ where: { id: c.id }, data: { from_stop_id: newFrom, to_stop_id: newTo } });
        }
        count++;
      }

      // Record the alias so future submissions of the old name resolve to the
      // canonical stop, and re-point any aliases that targeted the merged stop.
      await tx.stopAlias.upsert({
        where: { alias_norm: alias.name_normalized },
        create: { alias_norm: alias.name_normalized, canonical_id: intoId },
        update: { canonical_id: intoId },
      });
      await tx.stopAlias.updateMany({ where: { canonical_id: aliasId }, data: { canonical_id: intoId } });

      // Keep the human-readable alt name on the canonical stop, then remove the
      // duplicate node.
      await tx.stop.update({ where: { id: intoId }, data: { aliases: { push: alias.name } } });
      await tx.stop.delete({ where: { id: aliasId } });

      return count;
    },
    { timeout: 20_000 },
  );

  await bumpGraphVersion();
  invalidateGraphCache();
  return { merged_stop_id: aliasId, into_stop_id: intoId, connections_repointed: repointed };
}

export interface ConnectionPatch {
  median_fare?: number;
  status?: ConnStatusValue;
  avg_duration_min?: number | null;
}

/** Manually correct a connection (admin override). */
export async function patchConnection(id: string, patch: ConnectionPatch): Promise<Connection> {
  const existing = await prisma.connection.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound('Connection not found.');

  const updated = await prisma.connection.update({ where: { id }, data: { ...patch } });
  await bumpGraphVersion();
  invalidateGraphCache();
  return updated;
}
