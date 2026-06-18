// ─────────────────────────────────────────────────────────────────────────────
// Toast types. One active toast at a time (see store/useToast), four semantic
// kinds. Message is plain text; keep it short (≤ ~70 chars). Copy renders in the
// body font (Plus Jakarta Sans) — never the Danfo display face.
// ─────────────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'info' | 'warn' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number; // default 2500
}
