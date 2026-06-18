// ─────────────────────────────────────────────────────────────────────────────
// Stop-centric reads (build spec §6). GET /stops/:name/routes powers the
// transfer-planning view: given a stop, which featured routes pass through it,
// and at what position. Resolution reuses the canonical exact→alias lookup; an
// unknown stop returns STOP_NOT_FOUND with trigram suggestions.
// ─────────────────────────────────────────────────────────────────────────────

import { stopNotFound } from '../lib/errors';
import { resolveExisting, suggestStops } from './normalize.service';
import { activeFeaturedRoutes } from './featured.service';
import type { StopRoutesResult } from '../types';

/** Featured routes passing through a stop, each tagged with the stop's position
 *  in that route (0-indexed). Throws STOP_NOT_FOUND for an unknown stop. */
export async function routesThroughStop(name: string): Promise<StopRoutesResult> {
  const stop = await resolveExisting(name);
  if (!stop) {
    throw stopNotFound(await suggestStops(name));
  }

  const all = await activeFeaturedRoutes();
  const routes = all
    .map((r) => {
      const position = r.stops.findIndex((s) => s.id === stop.id);
      return position >= 0 ? { ...r, matching_stop_position: position } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return { stop: stop.name, routes };
}
