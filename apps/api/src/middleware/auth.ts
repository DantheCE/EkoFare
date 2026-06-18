// ─────────────────────────────────────────────────────────────────────────────
// Admin authentication (build spec §9). The public API is anonymous; only the
// admin surface is gated, with a short-lived JWT (bcrypt-checked login issues
// it). JWT_SECRET is optional in env — when it is unset the admin surface is
// simply disabled (401), so the public API still boots in dev without secrets.
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../lib/env';
import { unauthorized } from '../lib/errors';

export interface AdminClaims {
  sub: string; // admin email
  role: 'admin';
}

/** Sign a 12h admin token. Throws if JWT_SECRET is not configured. */
export function signAdminToken(email: string): string {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ role: 'admin' }, env.JWT_SECRET, { subject: email, expiresIn: '12h' });
}

/** Express guard: requires a valid Bearer admin token. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!env.JWT_SECRET) return next(unauthorized('Admin authentication is not configured.'));

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return next(unauthorized('Missing bearer token.'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminClaims;
    if (payload.role !== 'admin') return next(unauthorized('Not an admin token.'));
    (req as Request & { admin?: AdminClaims }).admin = payload;
    next();
  } catch {
    next(unauthorized('Invalid or expired token.'));
  }
}
