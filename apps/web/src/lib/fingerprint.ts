// ─────────────────────────────────────────────────────────────────────────────
// Anonymous, stable per-device fingerprint. Attached as a request header so the
// backend's rate-limiting / dedup keys off the same identity in both mock and
// real modes (Spec §7 "State seams"). No PII — a random id persisted locally.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'ekofare.fingerprint';

export function getFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let fp = localStorage.getItem(KEY);
    if (!fp) {
      fp =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `fp_${Math.abs(hashString(`${navigator.userAgent}:${performance.now()}`))}`;
      localStorage.setItem(KEY, fp);
    }
    return fp;
  } catch {
    return 'anonymous';
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
