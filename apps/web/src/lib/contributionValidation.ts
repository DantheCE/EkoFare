// ─────────────────────────────────────────────────────────────────────────────
// Client-side contribution validation (Spec §3.7). Pure + unit-tested.
//   blocking: ≥2 named stops; first leg fare must be 0; every fare a non-negative
//             integer; every present stop has a name.
//   non-blocking warning: fewer than 4 stops (saved as a fragment).
// ─────────────────────────────────────────────────────────────────────────────

export interface DraftStop {
  name: string;
  leg_fare: number;
}

export interface FieldError {
  field: string; // e.g. "stops.2.name" or "stops.0.fare"
  message: string;
}

export interface ValidationResult {
  errors: FieldError[];
  warnings: string[];
  canSubmit: boolean;
}

export function validateContribution(stops: DraftStop[]): ValidationResult {
  const errors: FieldError[] = [];
  const warnings: string[] = [];

  const named = stops.filter((s) => s.name.trim().length > 0);

  stops.forEach((s, i) => {
    if (!Number.isInteger(s.leg_fare) || s.leg_fare < 0) {
      errors.push({ field: `stops.${i}.fare`, message: 'Enter a whole number ₦0 or more.' });
    }
  });

  if (stops.length > 0 && stops[0].leg_fare !== 0) {
    errors.push({ field: 'stops.0.fare', message: 'The first stop is the origin — its fare is ₦0.' });
  }

  // Every row that has a fare but no name is incomplete.
  stops.forEach((s, i) => {
    if (s.name.trim().length === 0 && (i === 0 || s.leg_fare > 0)) {
      errors.push({ field: `stops.${i}.name`, message: 'Give this stop a name.' });
    }
  });

  if (named.length < 2) {
    errors.push({ field: 'stops', message: 'Add at least a start and an end stop.' });
  }

  if (named.length >= 2 && named.length < 4) {
    warnings.push('Routes with under 4 stops are saved as fragments and won’t appear in the main search.');
  }

  const canSubmit = errors.length === 0 && named.length >= 2;
  return { errors, warnings, canSubmit };
}

export function hasError(errors: FieldError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}
