import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// verificationStore — one-vote-per-device gate for contribution verification
// Key: ekofare.votes
// Stores the vote type (confirm | dispute) per contribution ID for this device.
// This persists across page refreshes so a user cannot re-vote after returning.
// ─────────────────────────────────────────────────────────────────────────────

export type VoteType = 'confirm' | 'dispute';

interface VerificationState {
  /** Map of contributionId → VoteType cast by this device. */
  votes: Record<string, VoteType>;

  /** Returns the vote this device cast for a given contribution, or null. */
  getVote: (contributionId: string) => VoteType | null;

  /** Record a vote for a contribution. */
  castVote: (contributionId: string, vote: VoteType) => void;
}

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set, get) => ({
      votes: {},

      getVote: (contributionId) => get().votes[contributionId] ?? null,

      castVote: (contributionId, vote) =>
        set((state) => ({
          votes: { ...state.votes, [contributionId]: vote },
        })),
    }),
    {
      name: 'ekofare.votes',
    },
  ),
);
