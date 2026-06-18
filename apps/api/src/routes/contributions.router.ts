// ─────────────────────────────────────────────────────────────────────────────
// POST /contributions (build spec §6, §4 seam). Validates the frontend's
// ContributionInput, derives an anonymous fingerprint, and hands the body to the
// shred service. Returns the superset success shape the locked frontend expects
// ({ id, status:'PENDING', warnings, ...telemetry }). Validation failures throw
// ZodError → the central handler renders 400 VALIDATION_ERROR.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ingest } from '../services/contribution.service';
import { fingerprintFromRequest } from '../lib/fingerprint';

const VEHICLES = ['DANFO', 'BRT', 'KEKE', 'OKADA', 'FERRY', 'RIDESHARE'] as const;

const stopSchema = z.object({
  name: z.string().trim().min(2, 'Stop name too short').max(80, 'Stop name too long'),
  leg_fare: z.number().int('Fare must be a whole number').min(0, 'Fare cannot be negative').max(10_000, 'Fare implausibly high'),
});

const contributionSchema = z
  .object({
    route_id: z.string().nullish(),
    submitted_name: z.string().trim().min(2).max(120),
    vehicle: z.enum(VEHICLES),
    notes: z.string().max(500).optional(),
    stops: z.array(stopSchema).min(2, 'A route needs at least 2 stops').max(40, 'Too many stops'),
    // The frontend sends user_confirmed; Option A has no duplicate gate so we
    // accept and ignore it rather than reject the body.
    user_confirmed: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // The first stop is an origin — no inbound leg, so its fare must be 0.
    if (data.stops[0]?.leg_fare !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stops', 0, 'leg_fare'],
        message: 'First stop is the origin; its leg_fare must be 0.',
      });
    }
  });

export const contributionsRouter: Router = Router();

contributionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = contributionSchema.parse(req.body);
    const fingerprint = fingerprintFromRequest(req);
    const result = await ingest(body, fingerprint);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});
