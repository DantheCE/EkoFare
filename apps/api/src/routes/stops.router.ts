// ─────────────────────────────────────────────────────────────────────────────
// /stops (build spec §6). GET /stops/:name/routes — featured routes through a
// stop, for transfer planning. Returns { stop, routes } where each route carries
// matching_stop_position. The :name segment is URL-decoded by Express.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import { routesThroughStop } from '../services/stops.service';

export const stopsRouter: Router = Router();

stopsRouter.get('/:name/routes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await routesThroughStop(req.params.name));
  } catch (err) {
    next(err);
  }
});
