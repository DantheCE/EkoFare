// ─────────────────────────────────────────────────────────────────────────────
// /routes (build spec §6). The frontend's route surface:
//   GET /routes?vehicle=&status=          → { routes } the board (featured)
//   GET /routes/search?q=                 → { routes, stops } search
//   GET /routes/find?from=&to=&vehicle?   → bare Route (Option A showcase; the
//        frontend does not call this — it's the pathfinding demonstration)
//   GET /routes/:id                       → bare Route (dyn: computed or featured)
// IMPORTANT: literal paths (/find, /search) are declared before /:id so they are
// not captured as an id.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { findRoute, getRouteById } from '../services/route.service';
import { listRoutes, searchRoutesAndStops } from '../services/featured.service';
import { validation } from '../lib/errors';

const VEHICLES = ['DANFO', 'BRT', 'KEKE', 'OKADA', 'FERRY', 'RIDESHARE'] as const;
const STATUSES = ['FRAGMENT', 'UNVERIFIED', 'VERIFIED', 'MAJOR'] as const;

const findQuery = z.object({
  from: z.string().trim().min(2, 'from is required'),
  to: z.string().trim().min(2, 'to is required'),
  vehicle: z.enum(VEHICLES).optional(),
});

const listQuery = z.object({
  vehicle: z.enum(VEHICLES).optional(),
  status: z.enum(STATUSES).optional(),
});

export const routesRouter: Router = Router();

// GET /routes — the board, filtered by vehicle/status.
routesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) {
      throw validation(parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
    }
    const routes = await listRoutes(parsed.data);
    res.json({ routes });
  } catch (err) {
    next(err);
  }
});

// GET /routes/search?q= — routes + matching stops.
routesRouter.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(await searchRoutesAndStops(q));
  } catch (err) {
    next(err);
  }
});

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
