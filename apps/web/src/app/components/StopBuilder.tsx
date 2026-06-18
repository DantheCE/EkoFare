'use client';

import { Plus, Trash2 } from 'lucide-react';
import { type DraftStop, type FieldError, hasError } from '../../lib/contributionValidation';

// ─────────────────────────────────────────────────────────────────────────────
// StopBuilder (Spec §3.7). Ordered stop rows: coloured dot + name input +
// ₦-prefixed leg-fare input. First row is the origin (green dot, fare locked to
// ₦0); the last row is the destination (orange dot); middles are yellow. Each
// non-origin row can be deleted. "Add next stop" appends a row.
// ─────────────────────────────────────────────────────────────────────────────

export default function StopBuilder({
  stops,
  errors,
  onChange,
}: {
  stops: DraftStop[];
  errors: FieldError[];
  onChange: (next: DraftStop[]) => void;
}) {
  function update(i: number, patch: Partial<DraftStop>) {
    onChange(stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    onChange(stops.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...stops, { name: '', leg_fare: 0 }]);
  }

  return (
    <div>
      <ol>
        {stops.map((stop, i) => {
          const isFirst = i === 0;
          const isLast = i === stops.length - 1;
          const dot = isFirst ? 'var(--go)' : isLast ? 'var(--stop)' : 'var(--yellow)';
          const nameErr = hasError(errors, `stops.${i}.name`);
          const fareErr = hasError(errors, `stops.${i}.fare`);

          return (
            <li key={i} className="flex gap-3">
              {/* spine */}
              <div className="flex w-4 flex-col items-center self-stretch pt-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: dot }} />
                {!isLast && <span className="w-0.5 flex-1" style={{ background: 'var(--line)' }} />}
              </div>

              {/* fields */}
              <div className="flex-1 pb-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      value={stop.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder={isFirst ? 'Start stop' : isLast ? 'End stop' : 'Stop name'}
                      aria-label={`Stop ${i + 1} name`}
                      aria-invalid={Boolean(nameErr)}
                      className="h-11 w-full rounded-input border bg-ink-3 px-3 text-[15px] text-cream placeholder:text-faint focus:outline-none"
                      style={{ borderColor: nameErr ? 'var(--stop)' : 'var(--line)', borderRadius: 'var(--radius-input)' }}
                    />
                    {nameErr && <p className="mt-1 text-[12px] text-stop">{nameErr}</p>}
                  </div>

                  {/* fare */}
                  <div className="w-[104px]">
                    <div
                      className="field-ring flex h-11 items-center rounded-input border bg-ink-3 px-3"
                      style={{ borderColor: fareErr ? 'var(--stop)' : 'var(--line)', borderRadius: 'var(--radius-input)', opacity: isFirst ? 0.6 : 1 }}
                    >
                      <span className="text-[14px] text-faint">₦</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isFirst}
                        value={isFirst ? 0 : stop.leg_fare}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, '');
                          update(i, { leg_fare: digits ? parseInt(digits, 10) : 0 });
                        }}
                        aria-label={`Stop ${i + 1} fare from previous`}
                        className="tnum h-full w-full bg-transparent px-1 text-[15px] font-semibold text-cream focus:outline-none disabled:text-faint"
                      />
                    </div>
                    {fareErr && <p className="mt-1 text-[12px] text-stop">{fareErr}</p>}
                  </div>

                  {/* delete */}
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={`Remove stop ${i + 1}`}
                      className="flex h-11 w-9 items-center justify-center rounded-input text-faint hover:text-stop"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={add}
        className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-input border border-dashed text-[14px] font-semibold text-muted"
        style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-input)' }}
      >
        <Plus size={16} /> Add next stop
      </button>
    </div>
  );
}
