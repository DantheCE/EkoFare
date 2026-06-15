// ─────────────────────────────────────────────────────────────────────────────
// UI store — persisted recent searches (Spec §3.5, max 8, newest first,
// de-duplicated case-insensitively).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENTS = 8;

interface UiState {
  recents: string[];
  addRecent: (q: string) => void;
  removeRecent: (q: string) => void;
  clearRecents: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      recents: [],
      addRecent: (q) =>
        set((state) => {
          const term = q.trim();
          if (!term) return state;
          const rest = state.recents.filter((r) => r.toLowerCase() !== term.toLowerCase());
          return { recents: [term, ...rest].slice(0, MAX_RECENTS) };
        }),
      removeRecent: (q) =>
        set((state) => ({ recents: state.recents.filter((r) => r !== q) })),
      clearRecents: () => set({ recents: [] }),
    }),
    { name: 'ekofare.ui.v1' },
  ),
);
