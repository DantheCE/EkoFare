// ─────────────────────────────────────────────────────────────────────────────
// Contribution submission (Spec §4.3). Returns a discriminated union covering
// every server response so the UI handles success / warning / duplicate /
// rate-limit / validation without inspecting HTTP internals. Mock branches are
// deterministic and content-driven so each path is demoable + testable:
//   • submitted_name === "ratelimit"  → RATE_LIMIT_EXCEEDED
//   • new route whose name matches an existing one → DUPLICATE_ROUTE
//   • stops are a contiguous slice of an existing route → SUB_ROUTE_WARNING
//   • fewer than 4 stops → INCOMPLETE_ROUTE warning
// ─────────────────────────────────────────────────────────────────────────────

import { isAxiosError } from 'axios';
import type {
  ContributionInput,
  ContributionSuccess,
  ContributionDuplicateError,
  ContributionRateLimitError,
  ContributionValidationError,
} from '../../types';
import { apiClient } from './client';

export type SubmitOutcome =
  | { kind: 'success'; result: ContributionSuccess }
  | { kind: 'warning'; result: ContributionSuccess }
  | { kind: 'duplicate'; error: ContributionDuplicateError }
  | { kind: 'rate_limit'; error: ContributionRateLimitError }
  | { kind: 'validation'; error: ContributionValidationError };



export async function submitContribution(
  input: ContributionInput,
  opts: { userConfirmed?: boolean } = {},
): Promise<SubmitOutcome> {


  // Real API: map HTTP responses onto the same union.
  try {
    const res = await apiClient.post<ContributionSuccess>('/contributions', {
      ...input,
      user_confirmed: opts.userConfirmed ?? false,
    });
    const result = res.data;
    return result.warnings?.length ? { kind: 'warning', result } : { kind: 'success', result };
  } catch (err) {
    if (isAxiosError(err) && err.response) {
      const { status, data } = err.response;
      if (status === 429) return { kind: 'rate_limit', error: data as ContributionRateLimitError };
      if (data?.error === 'DUPLICATE_ROUTE') return { kind: 'duplicate', error: data as ContributionDuplicateError };
      if (data?.error === 'VALIDATION_ERROR') return { kind: 'validation', error: data as ContributionValidationError };
    }
    throw err;
  }
}
