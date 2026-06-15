'use client';

import { Share2 } from 'lucide-react';
import { formatFare } from '../../lib/fare';

// ─────────────────────────────────────────────────────────────────────────────
// FareBar (Spec §6.4). Sticky ink-2 bar above the bottom nav. Big fare in
// tabular figures (yellow, 800). When no destination is selected it shows a
// prompt instead of a number, and the share action is disabled.
// ─────────────────────────────────────────────────────────────────────────────

export default function FareBar({
  fare,
  originName,
  destName,
  onShare,
}: {
  fare: number | null;
  originName?: string;
  destName?: string;
  onShare: () => void;
}) {
  const ready = fare !== null && destName;
  return (
    <div
      className="fixed inset-x-0 z-40 mx-auto max-w-md border-t border-line bg-ink-2 px-4 py-3"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {ready ? (
            <>
              <p className="text-[12px] text-muted">Your fare</p>
              <p className="tnum text-[26px] font-extrabold leading-none text-yellow">
                {formatFare(fare)}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-faint">
                {originName} → {destName}
              </p>
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
          className="flex h-11 shrink-0 items-center gap-2 rounded-button px-4 text-[14px] font-bold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
        >
          <Share2 size={16} /> Share trip
        </button>
      </div>
    </div>
  );
}
