// ─────────────────────────────────────────────────────────────────────────────
// POST /flags (build spec §8). Anonymous abuse report against a connection or a
// report. Fingerprinted like a contribution; rate-limited via the read limiter.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { createFlag } from '../services/flag.service';
import { fingerprintFromRequest } from '../lib/fingerprint';

const flagSchema = z
  .object({
    connection_id: z.string().nullish(),
    report_id: z.string().nullish(),
    reason: z.string().trim().min(3, 'Reason too short').max(280, 'Reason too long'),
  })
  .refine((d) => Boolean(d.connection_id || d.report_id), {
    message: 'A connection_id or report_id is required.',
    path: ['connection_id'],
  });

export const flagsRouter: Router = Router();

flagsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = flagSchema.parse(req.body);
    const flag = await createFlag(body, fingerprintFromRequest(req));
    res.status(201).json({ id: flag.id, status: flag.status });
  } catch (err) {
    next(err);
  }
});
