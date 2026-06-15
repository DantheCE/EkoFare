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
  ContributionWarning,
} from '../../types';
import { apiClient, USE_MOCKS, mockLatency } from './client';
import { MOCK_ROUTES } from './mock/fixtures';

export type SubmitOutcome =
  | { kind: 'success'; result: ContributionSuccess }
  | { kind: 'warning'; result: ContributionSuccess }
  | { kind: 'duplicate'; error: ContributionDuplicateError }
  | { kind: 'rate_limit'; error: ContributionRateLimitError }
  | { kind: 'validation'; error: ContributionValidationError };

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `c_${Math.abs(Math.round(performance.now() * 1000))}`;
}

/** Find an existing route whose stop names contain the submitted names as a
 *  contiguous slice shorter than the whole route (a genuine sub-route). */
function findParentRoute(stopNames: string[]) {
  const needle = stopNames.map((n) => n.toLowerCase());
  for (const route of MOCK_ROUTES) {
    const hay = route.stops.map((s) => s.name.toLowerCase());
    if (needle.length >= hay.length) continue;
    for (let i = 0; i + needle.length <= hay.length; i++) {
      if (needle.every((n, j) => hay[i + j] === n)) {
        return { id: route.id, name: route.name };
      }
    }
  }
  return null;
}

export async function submitContribution(
  input: ContributionInput,
  opts: { userConfirmed?: boolean } = {},
): Promise<SubmitOutcome> {
  if (USE_MOCKS) {
    await mockLatency(450);

    const names = input.stops.map((s) => s.name.trim());

    // backstop validation (the form blocks first)
    if (names.length < 2 || names.some((n) => !n) || input.stops[0].leg_fare !== 0) {
      return {
        kind: 'validation',
        error: {
          error: 'VALIDATION_ERROR',
          details: [{ field: 'stops', message: 'Add a named start and end stop; the first fare is ₦0.' }],
        },
      };
    }

    if (input.submitted_name.trim().toLowerCase() === 'ratelimit') {
      return {
        kind: 'rate_limit',
        error: { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many submissions. Try again shortly.', retry_after: 30 },
      };
    }

    if (!input.route_id) {
      const dupe = MOCK_ROUTES.find(
        (r) => r.name.toLowerCase() === input.submitted_name.trim().toLowerCase(),
      );
      if (dupe) {
        return {
          kind: 'duplicate',
          error: {
            error: 'DUPLICATE_ROUTE',
            message: 'This route already exists.',
            existing_route: { id: dupe.id, name: dupe.name },
          },
        };
      }
    }

    const warnings: ContributionWarning[] = [];
    const parent = findParentRoute(names);
    if (parent) {
      warnings.push({
        type: 'SUB_ROUTE_WARNING',
        message: `These stops look like part of “${parent.name}”. Submit as a correction to it?`,
        parent_route: parent,
      });
    }
    if (names.length < 4) {
      warnings.push({
        type: 'INCOMPLETE_ROUTE',
        message: 'Routes with under 4 stops are saved as fragments and won’t appear in the main search.',
      });
    }

    if (warnings.length > 0 && !opts.userConfirmed) {
      return { kind: 'warning', result: { id: newId(), status: 'PENDING', warnings } };
    }

    return { kind: 'success', result: { id: newId(), status: 'PENDING', warnings: [] } };
  }

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
