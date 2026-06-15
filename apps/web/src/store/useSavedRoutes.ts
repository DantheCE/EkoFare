// ─────────────────────────────────────────────────────────────────────────────
// Saved routes — Zustand + persist. Stores full Route objects (not just ids) so
// the Saved screen and detail work offline (Spec §3.6 / §7 "Resilience").
// Keyed under "ekofare.saved.v2" to avoid colliding with legacy stores.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Route } from '../types';

interface SavedRoutesState {
  saved: Record<string, Route>;
  isSaved: (id: string) => boolean;
  toggle: (route: Route) => void;
  remove: (id: string) => void;
  list: () => Route[];
}

export const useSavedRoutes = create<SavedRoutesState>()(
  persist(
    (set, get) => ({
      saved: {},
      isSaved: (id) => id in get().saved,
      toggle: (route) =>
        set((state) => {
          const next = { ...state.saved };
          if (route.id in next) delete next[route.id];
          else next[route.id] = route;
          return { saved: next };
        }),
      remove: (id) =>
        set((state) => {
          const next = { ...state.saved };
          delete next[id];
          return { saved: next };
        }),
      list: () => Object.values(get().saved),
    }),
    { name: 'ekofare.saved.v2' },
  ),
);
