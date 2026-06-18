'use client';

import { type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '../../store/useToast';
import type { ToastType } from '../../types/toast';

// ─────────────────────────────────────────────────────────────────────────────
// Toaster — renders the single active toast (store/useToast) as a dark pill that
// slides up above the bottom nav and auto-dismisses. Tap to dismiss early. Fade-
// only under prefers-reduced-motion. aria-live="polite" announces each message;
// the wrapper is pointer-events-none so it never blocks the UI behind it.
// Mounted once in the app shell (components/Layout). Body font only — no Danfo.
// ─────────────────────────────────────────────────────────────────────────────

const ICON: Record<ToastType, ReactNode> = {
  success: <Check size={13} strokeWidth={2.4} className="text-[var(--go)]" />,
  info: <Info size={13} strokeWidth={2.2} className="text-[var(--yellow)]" />,
  warn: <AlertTriangle size={13} strokeWidth={2} className="text-[var(--stop)]" />,
  error: <XCircle size={13} strokeWidth={2} className="text-[var(--error)]" />,
};

const TILE: Record<ToastType, string> = {
  success: 'bg-[rgba(70,224,140,0.16)]',
  info: 'bg-[rgba(255,206,58,0.16)]',
  warn: 'bg-[rgba(255,122,69,0.16)]',
  error: 'bg-[rgba(255,91,91,0.15)]',
};

export function Toaster() {
  const current = useToast((s) => s.current);
  const dismiss = useToast((s) => s.dismiss);
  const reduce = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-3 z-[160] flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {current && (
          <motion.button
            key={current.id}
            type="button"
            onClick={dismiss}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="pointer-events-auto flex max-w-[300px] items-center gap-2.5 rounded-[13px]
                       border border-[var(--line)] bg-[rgba(28,26,17,0.97)] px-3.5 py-2.5
                       text-left shadow-[0_16px_36px_rgba(0,0,0,0.6)]"
          >
            <span
              className={`flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-[7px] ${TILE[current.type]}`}
            >
              {ICON[current.type]}
            </span>
            <span className="font-body text-[11px] font-medium leading-snug text-[var(--cream)]">
              {current.message}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
