// ─────────────────────────────────────────────────────────────────────────────
// /admin (build spec §9). POST /admin/login is public (it issues the token);
// every other route is behind requireAdmin. Surface: the flag queue (list +
// resolve), stop-merge, and manual connection correction.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth';
import { login, mergeStops, patchConnection } from '../services/admin.service';
import { listFlags, resolveFlag } from '../services/flag.service';
import { validation } from '../lib/errors';

const STATUSES = ['UNVERIFIED', 'VERIFIED', 'MAJOR'] as const;

const loginSchema = z.object({
  email: z.string().trim().min(3),
  password: z.string().min(1),
});

const mergeSchema = z.object({
  alias_stop_id: z.string().min(1),
  into_stop_id: z.string().min(1),
});

const patchSchema = z
  .object({
    median_fare: z.number().int().min(0).max(100_000).optional(),
    status: z.enum(STATUSES).optional(),
    avg_duration_min: z.number().int().min(0).max(600).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update.' });

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw validation(r.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
  }
  return r.data;
}

export const adminRouter: Router = Router();

// Public: exchange credentials for a token.
adminRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = parse(loginSchema, req.body);
    const token = await login(email, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// Everything below requires a valid admin token.
adminRouter.use(requireAdmin);

adminRouter.get('/flags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'open';
    res.json({ flags: await listFlags(status) });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/flags/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await resolveFlag(req.params.id));
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/stops/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alias_stop_id, into_stop_id } = parse(mergeSchema, req.body);
    res.json(await mergeStops(alias_stop_id, into_stop_id));
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/connections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patch = parse(patchSchema, req.body);
    res.json(await patchConnection(req.params.id, patch));
  } catch (err) {
    next(err);
  }
});
