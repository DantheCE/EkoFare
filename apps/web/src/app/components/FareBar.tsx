'use client';

import { Share2, CheckCircle2, Check, Loader2 } from 'lucide-react';
import { formatFare } from '../../lib/fare';
import { StatusBadge } from './Badge';
import type { RouteStatus } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// FareBar (Spec §6.4, extended for crowd verification). Sticky ink-2 bar above
// the bottom nav. Shows the selected-segment fare (tabular, yellow, 800) with a
// compact confidence badge, a small share-trip icon, and the two crowd actions:
// primary "I paid this too" (confirm at the shown fare) and secondary "I paid a
// different fare". When no full segment is selected it shows a prompt and the
// actions are disabled.
// ─────────────────────────────────────────────────────────────────────────────

export type ConfirmState = 'idle' | 'recording' | 'confirmed';

export default function FareBar({
  fare,
  originName,
  destName,
  status,
  count,
  confirmState,
  onConfirm,
  onDifferentFare,
  onShare,
}: {
  fare: number | null;
  originName?: string;
  destName?: string;
  status: RouteStatus;
  count: number;
  confirmState: ConfirmState;
  onConfirm: () => void;
  onDifferentFare: () => void;
  onShare: () => void;
}) {
  const ready = fare !== null && Boolean(destName);

  return (
    <div
      className="fixed inset-x-0 z-40 mx-auto max-w-md border-t border-line bg-ink-2 px-4 pb-3 pt-3.5"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
    >
      {/* fare summary + share */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {ready ? (
            <>
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.1em] text-faint">
                Your fare · {originName} → {destName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="tnum text-[28px] font-extrabold leading-none text-yellow">{formatFare(fare!)}</p>
                <StatusBadge status={status} count={count} variant="compact" />
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] text-muted">Your fare</p>
              <p className="text-[15px] font-semibold text-cream">Select your stops</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onShare}
          disabled={!ready}
          aria-label="Share trip"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-input border border-line bg-ink-3 text-muted transition-opacity disabled:opacity-40"
          style={{ borderRadius: 'var(--radius-input)' }}
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* primary confirm CTA */}
      {confirmState === 'confirmed' ? (
        <div
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-button text-[14px] font-bold"
          style={{ border: '1px solid rgba(70,224,140,0.4)', color: 'var(--go)', borderRadius: 'var(--radius-button)' }}
        >
          <Check size={17} strokeWidth={2.6} /> You confirmed this fare
        </div>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={!ready || confirmState === 'recording'}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-button text-[15px] font-extrabold transition-opacity disabled:opacity-40"
          style={{
            background: confirmState === 'recording' ? 'var(--yellow-dk)' : 'var(--yellow)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-button)',
          }}
        >
          {confirmState === 'recording' ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Recording…
            </>
          ) : (
            <>
              <CheckCircle2 size={18} strokeWidth={2.2} /> I paid this too
            </>
          )}
        </button>
      )}

      {/* secondary: different fare */}
      <button
        type="button"
        onClick={onDifferentFare}
        disabled={!ready || confirmState === 'recording'}
        className="mt-1 h-10 w-full text-[13px] font-semibold text-muted transition-opacity disabled:opacity-40"
      >
        I paid a different fare
      </button>
    </div>
  );
}
