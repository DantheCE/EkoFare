// ─────────────────────────────────────────────────────────────────────────────
// Anonymous fingerprinting (build spec §7.2). The frontend already sends a
// stable per-device id in X-EkoFare-Fingerprint; prefer it. Otherwise derive
// sha256(ip + ua + daily_salt). Weak alone (acknowledged in the spec) — it is
// paired with the per-connection 24h dedupe and outlier detection.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import type { Request } from 'express';

const FINGERPRINT_HEADER = 'x-ekofare-fingerprint';

/** UTC day, so a derived fingerprint rotates daily (limits long-term linkage). */
export function dailySalt(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function deriveFingerprint(ip: string, userAgent: string, now: Date = new Date()): string {
  return createHash('sha256').update(`${ip}|${userAgent}|${dailySalt(now)}`).digest('hex');
}

/** Resolve a request's fingerprint: client-supplied header, else server-derived. */
export function fingerprintFromRequest(req: Request): string {
  const supplied = req.headers[FINGERPRINT_HEADER];
  if (typeof supplied === 'string' && supplied.trim().length > 0) {
    return supplied.trim();
  }
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const ua = req.headers['user-agent'] ?? 'unknown';
  return deriveFingerprint(ip, ua);
}
