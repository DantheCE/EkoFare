// ─────────────────────────────────────────────────────────────────────────────
// Share helper (Spec §3.4). Prefer the Web Share API; fall back to copying a
// plain-text summary to the clipboard. Returns what happened so the caller can
// raise the right toast.
// ─────────────────────────────────────────────────────────────────────────────

export type ShareResult = 'shared' | 'copied' | 'failed';

export async function shareOrCopy(payload: {
  title: string;
  text: string;
  url?: string;
}): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (err) {
      // User cancelled the share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
      // fall through to clipboard
    }
  }
  const clip = [payload.text, payload.url].filter(Boolean).join('\n');
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(clip);
      return 'copied';
    }
  } catch {
    /* ignore */
  }
  return 'failed';
}
