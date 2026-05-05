import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPendingContributions } from '../api/axios';

// ─────────────────────────────────────────────────────────────────────────────
// useContributions — React Query wrapper around contribution endpoints
// status: 'pending' — the only currently-used mode (TICKET-015)
// ─────────────────────────────────────────────────────────────────────────────

export function useContributions(status: 'pending') {
  return useQuery({
    queryKey: ['contributions', status],
    queryFn: fetchPendingContributions,
    // Pending queue should always be fresh — no stale time.
    staleTime: 0,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useInvalidateContributions — helper to invalidate the contributions cache
// after a vote action so the list re-fetches from localStorage.
// ─────────────────────────────────────────────────────────────────────────────

export function useInvalidateContributions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['contributions'] });
}
