'use client';

import type { Vehicle } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// FilterChips (Spec §3.1). Horizontal-scroll rail. Active chip = yellow fill,
// ink text; inactive = ink-3 surface, muted text. Min 44px touch target.
// ─────────────────────────────────────────────────────────────────────────────

export type VehicleFilter = 'ALL' | Vehicle;

const CHIPS: { value: VehicleFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DANFO', label: 'Danfo' },
  { value: 'BRT', label: 'BRT' },
  { value: 'KEKE', label: 'Keke' },
];

export default function FilterChips({
  value,
  onChange,
}: {
  value: VehicleFilter;
  onChange: (next: VehicleFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter routes by vehicle"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
    >
      {CHIPS.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.value)}
            className="flex h-11 shrink-0 items-center rounded-pill px-4 text-[14px] font-semibold transition-colors"
            style={{
              background: active ? 'var(--yellow)' : 'var(--ink-3)',
              color: active ? 'var(--ink)' : 'var(--muted)',
              border: `1px solid ${active ? 'var(--yellow)' : 'var(--line)'}`,
            }}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
