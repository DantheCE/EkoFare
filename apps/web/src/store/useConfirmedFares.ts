// ─────────────────────────────────────────────────────────────────────────────
// Confirmed fares — Zustand + persist. A per-browser set of segments the rider
// has already confirmed ("I paid this too"), so the button locks to a
// non-tappable state and can't double-count. Keyed by route + the selected
// origin→dest names. This is an optimistic local guard only; the server's 24h
// per-fingerprint+connection dedupe is the real one (contribution.service.ts).
// Stored under "ekofare.confirmed.v1".
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfirmedFaresState {
  confirmed: Record<string, true>;
  isConfirmed: (key: string) => boolean;
  add: (key: string) => void;
}

/** Stable key for a confirmed segment on a route. */
export function segmentKey(routeId: string, fromName: string, toName: string): string {
  return `${routeId}::${fromName}→${toName}`;
}

export const useConfirmedFares = create<ConfirmedFaresState>()(
  persist(
    (set, get) => ({
      confirmed: {},
      isConfirmed: (key) => key in get().confirmed,
      add: (key) =>
        set((state) => (key in state.confirmed ? state : { confirmed: { ...state.confirmed, [key]: true } })),
    }),
    { name: 'ekofare.confirmed.v1' },
  ),
);
