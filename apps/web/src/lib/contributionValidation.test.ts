import { describe, it, expect } from 'vitest';
import { validateContribution, hasError } from './contributionValidation';

const ok = [
  { name: 'Mile 2', leg_fare: 0 },
  { name: 'Orile', leg_fare: 200 },
  { name: 'Costain', leg_fare: 100 },
  { name: 'CMS', leg_fare: 150 },
];

describe('validateContribution', () => {
  it('accepts a valid 4-stop route with no warnings', () => {
    const r = validateContribution(ok);
    expect(r.canSubmit).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it('warns (non-blocking) for fewer than 4 stops', () => {
    const r = validateContribution(ok.slice(0, 3));
    expect(r.canSubmit).toBe(true);
    expect(r.warnings).toHaveLength(1);
  });

  it('blocks with under 2 named stops', () => {
    const r = validateContribution([{ name: 'Mile 2', leg_fare: 0 }, { name: '', leg_fare: 0 }]);
    expect(r.canSubmit).toBe(false);
    expect(hasError(r.errors, 'stops')).toBeTruthy();
  });

  it('requires the first leg fare to be 0', () => {
    const r = validateContribution([{ name: 'A', leg_fare: 50 }, { name: 'B', leg_fare: 100 }]);
    expect(hasError(r.errors, 'stops.0.fare')).toBeTruthy();
    expect(r.canSubmit).toBe(false);
  });

  it('rejects negative or fractional fares', () => {
    const r = validateContribution([
      { name: 'A', leg_fare: 0 },
      { name: 'B', leg_fare: -5 },
      { name: 'C', leg_fare: 1.5 },
    ]);
    expect(hasError(r.errors, 'stops.1.fare')).toBeTruthy();
    expect(hasError(r.errors, 'stops.2.fare')).toBeTruthy();
  });

  it('flags a fare row with no name', () => {
    const r = validateContribution([
      { name: 'A', leg_fare: 0 },
      { name: '', leg_fare: 100 },
    ]);
    expect(hasError(r.errors, 'stops.1.name')).toBeTruthy();
  });
});
