'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Delete, Loader2 } from 'lucide-react';
import { formatFare } from '../../../lib/fare';

// ─────────────────────────────────────────────────────────────────────────────
// DifferentFareSheet — the "I paid a different fare" bottom sheet (design
// "Different fare entry"). A dimmed backdrop over the route detail, a sheet with
// a big ₦ amount display, quick chips around the shown fare, a custom numeric
// keypad (no system keyboard), and a "Submit fare" CTA. The entered total is
// filed as a report on the selected origin→dest segment by the caller — the same
// thing the Contribute form does for a stop pair, so it nudges the median without
// any single entry swinging it. Framer Motion; fade-only under reduced motion.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_DIGITS = 6;

/** Three round quick-pick values bracketing the shown fare (nearest ₦50). */
function quickChips(suggested: number): number[] {
  const base = Math.max(50, Math.round(suggested / 50) * 50);
  return [base - 50, base, base + 50].filter((v) => v > 0);
}

export default function DifferentFareSheet({
  open,
  onClose,
  segmentName,
  suggestedFare,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  segmentName: string;
  suggestedFare: number;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const reduce = useReducedMotion();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset the keypad each time the sheet opens.
  useEffect(() => {
    if (open) {
      setAmount('');
      setSubmitting(false);
    }
  }, [open]);

  // Escape closes (unless mid-submit).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  const value = amount ? parseInt(amount, 10) : 0;
  const chips = quickChips(suggestedFare);

  function press(digit: string) {
    setAmount((a) => (a.length >= MAX_DIGITS ? a : (a + digit).replace(/^0+/, '')));
  }

  async function submit() {
    if (!value || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(value);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] mx-auto max-w-md">
          {/* backdrop */}
          <motion.button
            type="button"
            aria-label="Close"
            onClick={() => !submitting && onClose()}
            className="absolute inset-0 bg-[rgba(8,7,4,0.55)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          {/* sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="What did you pay?"
            className="absolute inset-x-0 bottom-0 border-t border-line bg-ink-2 px-5 pb-7 pt-3.5"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: '0 -20px 50px rgba(0,0,0,0.5)' }}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />

            <h2 className="text-[17px] font-extrabold text-cream">What did you pay?</h2>
            <p className="mb-5 mt-1.5 text-[12.5px] leading-snug text-muted">
              Enter what you actually paid on <span className="font-semibold text-cream">{segmentName}</span>. It
              nudges the fare toward real prices — no single entry can swing it.
            </p>

            {/* amount display */}
            <div
              className="mb-3.5 flex items-center justify-center gap-1.5 rounded-input bg-ink p-4"
              style={{ border: '1.5px solid var(--yellow)', borderRadius: 'var(--radius-input)' }}
            >
              <span className="text-[24px] font-bold text-faint">₦</span>
              <span className={`tnum text-[42px] font-extrabold leading-none ${amount ? 'text-cream' : 'text-faint'}`}>
                {amount || '0'}
              </span>
              {!reduce && (
                <motion.span
                  className="ml-0.5 h-8 w-0.5 rounded-sm bg-yellow"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  aria-hidden
                />
              )}
            </div>

            {/* quick chips */}
            <div className="mb-5 flex gap-2.5">
              {chips.map((v) => {
                const active = value === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="tnum flex-1 rounded-pill border py-2.5 text-[13px] font-bold transition-colors"
                    style={{
                      background: active ? 'rgba(255,206,58,0.14)' : 'var(--ink-3)',
                      borderColor: active ? 'var(--yellow)' : 'var(--line)',
                      color: active ? 'var(--yellow)' : 'var(--muted)',
                    }}
                  >
                    {formatFare(v)}
                  </button>
                );
              })}
            </div>

            {/* keypad */}
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => press(d)}
                  className="tnum rounded-input bg-ink-3 py-3.5 text-[20px] font-bold text-cream active:bg-ink-4"
                  style={{ borderRadius: 'var(--radius-input)' }}
                >
                  {d}
                </button>
              ))}
              <span aria-hidden />
              <button
                type="button"
                onClick={() => press('0')}
                className="tnum rounded-input bg-ink-3 py-3.5 text-[20px] font-bold text-cream active:bg-ink-4"
                style={{ borderRadius: 'var(--radius-input)' }}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setAmount((a) => a.slice(0, -1))}
                aria-label="Delete last digit"
                className="flex items-center justify-center rounded-input border border-line bg-ink-2 text-muted active:bg-ink-3"
                style={{ borderRadius: 'var(--radius-input)' }}
              >
                <Delete size={22} />
              </button>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!value || submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-button text-[15px] font-extrabold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
            >
              {submitting && <Loader2 size={17} className="animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit fare'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
