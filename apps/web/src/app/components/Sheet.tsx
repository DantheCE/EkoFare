'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Sheet — bottom sheet used for transfer planning (Spec §3.5). Slides up over a
// dim backdrop; Escape and backdrop-tap close it. Animation is skipped under
// prefers-reduced-motion. Constrained to the app's max-w-md column.
// ─────────────────────────────────────────────────────────────────────────────

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-[20px] border-t border-line bg-ink-2 pb-[calc(16px+env(safe-area-inset-bottom))]"
            initial={{ y: reduce ? 0 : '100%' }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : '100%' }}
            transition={{ type: 'tween', duration: reduce ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-line bg-ink-2 px-4 py-3">
              <h2 className="text-[16px] font-bold text-cream">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sheet"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 pt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
