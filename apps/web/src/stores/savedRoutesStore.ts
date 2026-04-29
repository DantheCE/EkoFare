import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Route } from '@ekofare/types';

// ─────────────────────────────────────────────────────────────────────────────
// savedRoutesStore — persists saved route IDs to localStorage
// Key: ekofare.saved
// ─────────────────────────────────────────────────────────────────────────────

interface SavedRoutesState {
  /** Map of route id → full Route object for O(1) lookup. */
  savedRoutes: Record<string, Route>;

  isRouteSaved: (id: string) => boolean;
  addRoute: (route: Route) => void;
  removeRoute: (id: string) => void;
  getSavedRoutes: () => Route[];
}

export const useSavedRoutesStore = create<SavedRoutesState>()(
  persist(
    (set, get) => ({
      savedRoutes: {},

      isRouteSaved: (id) => id in get().savedRoutes,

      addRoute: (route) =>
        set((state) => ({
          savedRoutes: { ...state.savedRoutes, [route.id]: route },
        })),

      removeRoute: (id) =>
        set((state) => {
          const updated = { ...state.savedRoutes };
          delete updated[id];
          return { savedRoutes: updated };
        }),

      getSavedRoutes: () => Object.values(get().savedRoutes),
    }),
    {
      name: 'ekofare.saved',
    },
  ),
);
