'use client';

import { ArrowUpDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ReverseToggle (Spec §6.2). Pill in the route-detail header. The actual stop
// reversal + cumulative recompute + toast + selection clear is owned by the
// screen; this is the control surface. Sits on the yellow header, so ink text.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReverseToggle({ onReverse }: { onReverse: () => void }) {
  return (
    <button
      type="button"
      onClick={onReverse}
      aria-label="Reverse route direction"
      className="flex h-9 items-center gap-1.5 rounded-pill px-3 text-[13px] font-bold"
      style={{
        background: 'rgba(19,17,9,0.10)',
        color: 'var(--ink)',
        border: '1px solid rgba(19,17,9,0.18)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <ArrowUpDown size={15} /> Reverse
    </button>
  );
}
