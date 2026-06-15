'use client';

import { useRef } from 'react';
import type { Stop } from '../../types';
import { type Selection, stopRole } from '../../lib/selection';
import { formatFare } from '../../lib/fare';

// ─────────────────────────────────────────────────────────────────────────────
// StopTimeline (Spec §6.1). Vertical spine of selectable stop nodes. Origin =
// go (glow ring), in-range mids = yellow, destination = stop (glow ring),
// out-of-range = faint outline. Names wrap to 2 lines, never truncate; rows
// have a min-height so wrapping doesn't jitter the spine. Fully keyboard
// operable: ↑/↓ move a focus cursor, Enter selects.
// ─────────────────────────────────────────────────────────────────────────────

const NODE_COLORS = {
  origin: { fill: 'var(--go)', ring: 'rgba(70,224,140,0.25)' },
  destination: { fill: 'var(--stop)', ring: 'rgba(255,122,69,0.25)' },
  'in-range': { fill: 'var(--yellow)', ring: 'transparent' },
  'out-of-range': { fill: 'transparent', ring: 'transparent' },
} as const;

export default function StopTimeline({
  stops,
  selection,
  focusIdx,
  onSelect,
  onFocusChange,
}: {
  stops: Stop[];
  selection: Selection;
  focusIdx: number;
  onSelect: (idx: number) => void;
  onFocusChange: (idx: number) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(stops.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)));
      onFocusChange(next);
      refs.current[next]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(idx);
    }
  }

  return (
    <ol className="relative" aria-label="Stops — select your start and end">
      {stops.map((stop, idx) => {
        const role = stopRole(selection, idx);
        const colors = NODE_COLORS[role];
        const isLast = idx === stops.length - 1;
        const tag = role === 'origin' ? 'FROM' : role === 'destination' ? 'TO' : null;
        // line below a node is "active" when the next stop is within the range
        const nextRole = stopRole(selection, idx + 1);
        const lineActive =
          (role === 'origin' || role === 'in-range') &&
          (nextRole === 'in-range' || nextRole === 'destination');

        return (
          <li key={stop.id} className="flex gap-3">
            {/* spine */}
            <div className="flex w-5 flex-col items-center">
              <button
                ref={(el) => {
                  refs.current[idx] = el;
                }}
                type="button"
                tabIndex={idx === focusIdx ? 0 : -1}
                onClick={() => onSelect(idx)}
                onKeyDown={(e) => onKeyDown(e, idx)}
                onFocus={() => onFocusChange(idx)}
                aria-label={`${stop.name}, cumulative fare ${stop.cumulative_fare} naira, tap to set as ${
                  selection.origin === null ? 'start' : 'end'
                }`}
                aria-pressed={role === 'origin' || role === 'destination'}
                className="mt-1 flex h-5 w-5 items-center justify-center rounded-full"
                style={{
                  background: colors.fill,
                  border:
                    role === 'out-of-range'
                      ? '2px solid var(--faint)'
                      : `2px solid ${colors.fill}`,
                  boxShadow: colors.ring !== 'transparent' ? `0 0 0 4px ${colors.ring}` : 'none',
                }}
              />
              {!isLast && (
                <span
                  aria-hidden
                  className="w-0.5 flex-1"
                  style={{ background: lineActive ? 'var(--yellow)' : 'var(--line)' }}
                />
              )}
            </div>

            {/* info — min-height keeps the spine steady when names wrap */}
            <div className="flex min-h-[56px] flex-1 items-start justify-between gap-3 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold leading-snug text-cream">
                    {stop.name}
                  </span>
                  {tag && (
                    <span
                      className="shrink-0 rounded-pill px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        background: tag === 'FROM' ? 'var(--go)' : 'var(--stop)',
                        color: 'var(--ink)',
                      }}
                    >
                      {tag}
                    </span>
                  )}
                </div>
                {idx > 0 && (
                  <span className="mt-0.5 block text-[12px] text-faint">
                    +{formatFare(stop.leg_fare)} from previous
                  </span>
                )}
              </div>
              <span className="tnum shrink-0 text-[13px] font-semibold text-muted">
                {formatFare(stop.cumulative_fare)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
