// ─────────────────────────────────────────────────────────────────────────────
// Toast store (Zustand). A single active toast, auto-dismissing after
// durationMs (default 2500). A new show() replaces the current toast — we never
// stack. Import the `toast` helper and call toast.success/info/warn/error from
// anywhere (event handlers, query callbacks).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { Toast, ToastType } from '../types/toast';

interface ToastState {
  current: Toast | null;
  show: (type: ToastType, message: string, durationMs?: number) => void;
  dismiss: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set, get) => ({
  current: null,
  show: (type, message, durationMs = 2500) => {
    if (timer) clearTimeout(timer);
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${type}`;
    set({ current: { id, type, message, durationMs } });
    timer = setTimeout(() => {
      if (get().current?.id === id) set({ current: null });
    }, durationMs);
  },
  dismiss: () => {
    if (timer) clearTimeout(timer);
    set({ current: null });
  },
}));

// Convenience helpers — import and call from anywhere.
export const toast = {
  success: (m: string, d?: number) => useToast.getState().show('success', m, d),
  info: (m: string, d?: number) => useToast.getState().show('info', m, d),
  warn: (m: string, d?: number) => useToast.getState().show('warn', m, d),
  error: (m: string, d?: number) => useToast.getState().show('error', m, d),
};
