import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedRoutesState {
  savedRoutes: string[]; // store as unique composite keys e.g., `${routeId}-${originIdx}-${destIdx}`
  toggleRoute: (key: string) => void;
  isSaved: (key: string) => boolean;
}

export const useSavedRoutesStore = create<SavedRoutesState>()(
  persist(
    (set, get) => ({
      savedRoutes: [],
      toggleRoute: (key) => set((state) => {
        const exists = state.savedRoutes.includes(key);
        if (exists) {
          return { savedRoutes: state.savedRoutes.filter(id => id !== key) };
        } else {
          return { savedRoutes: [...state.savedRoutes, key] };
        }
      }),
      isSaved: (key) => get().savedRoutes.includes(key),
    }),
    {
      name: 'ekofare-saved-routes', // unique name for localStorage key
    }
  )
);
