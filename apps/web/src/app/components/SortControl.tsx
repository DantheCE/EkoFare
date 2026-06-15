'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SortControl (Spec §3.2). Most verified / Shortest / Cheapest. Segmented pills
// on an ink-3 track; active segment is yellow-filled.
// ─────────────────────────────────────────────────────────────────────────────

export type SortKey = 'verified' | 'shortest' | 'cheapest';

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'verified', label: 'Most verified' },
  { key: 'shortest', label: 'Shortest' },
  { key: 'cheapest', label: 'Cheapest' },
];

export default function SortControl({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Sort routes"
      className="flex gap-1 rounded-pill border border-line bg-ink-3 p-1"
      style={{ borderRadius: 'var(--radius-pill)' }}
    >
      {OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.key)}
            className="flex-1 rounded-pill px-2 py-2 text-[12px] font-semibold transition-colors"
            style={{
              background: active ? 'var(--yellow)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--muted)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
