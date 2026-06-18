// ─────────────────────────────────────────────────────────────────────────────
// /routes (build spec §6). Phase 3 ships the two read endpoints backed by the
// graph pathfinder:
//   GET /routes/find?from=&to=&vehicle?  → compute the best route (showcase; the
//        frontend does not call this, it's the Option A demonstration endpoint).
//   GET /routes/:id                       → a dyn: computed id or a featured id.
// Both return a bare `Route` (the frontend's GET /routes/:id contract). The list
// + search endpoints (GET /routes, /routes/search) arrive in Phase 4.
// IMPORTANT: /find is declared before /:id so "find" is not captured as an id.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { findRoute, getRouteById } from '../services/route.service';
import { validation } from '../lib/errors';

const VEHICLES = ['DANFO', 'BRT', 'KEKE', 'OKADA', 'FERRY', 'RIDESHARE'] as const;

const findQuery = z.object({
  from: z.string().trim().min(2, 'from is required'),
  to: z.string().trim().min(2, 'to is required'),
  vehicle: z.enum(VEHICLES).optional(),
});

export const routesRouter: Router = Router();

routesRouter.get('/find', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = findQuery.safeParse(req.query);
    if (!parsed.success) {
      throw validation(parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
    }
    const { from, to, vehicle } = parsed.data;
    const route = await findRoute(from, to, vehicle);
    res.json(route);
  } catch (err) {
    next(err);
  }
});

routesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const route = await getRouteById(req.params.id);
    res.json(route);
  } catch (err) {
    next(err);
  }
});
