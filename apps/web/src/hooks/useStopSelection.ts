'use client';

import { useCallback, useState } from 'react';
import { type Selection, EMPTY_SELECTION, nextSelection } from '../lib/selection';

// ─────────────────────────────────────────────────────────────────────────────
// useStopSelection — wraps the pure selection machine with a keyboard focus
// cursor for the StopTimeline (Spec §6.1). `length` is the stop count.
// ─────────────────────────────────────────────────────────────────────────────

export function useStopSelection(length: number) {
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [focusIdx, setFocusIdx] = useState(0);

  const select = useCallback((idx: number) => {
    setSelection((s) => nextSelection(s, idx));
    setFocusIdx(idx);
  }, []);

  const reset = useCallback(() => {
    setSelection(EMPTY_SELECTION);
    setFocusIdx(0);
  }, []);

  const moveFocus = useCallback(
    (delta: number) => {
      setFocusIdx((i) => Math.min(length - 1, Math.max(0, i + delta)));
    },
    [length],
  );

  return { selection, focusIdx, select, reset, moveFocus, setFocusIdx } as const;
}
