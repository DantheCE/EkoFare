import { describe, it, expect } from 'vitest';
import { nextSelection, stopRole, EMPTY_SELECTION } from './selection';

describe('nextSelection', () => {
  it('tap 1 sets the origin', () => {
    expect(nextSelection(EMPTY_SELECTION, 1)).toEqual({ origin: 1, dest: null });
  });
  it('tap 2 after origin sets the destination', () => {
    expect(nextSelection({ origin: 1, dest: null }, 3)).toEqual({ origin: 1, dest: 3 });
  });
  it('a tap before the origin becomes the new origin', () => {
    expect(nextSelection({ origin: 2, dest: null }, 0)).toEqual({ origin: 0, dest: null });
  });
  it('tapping a fully-selected pair resets to a fresh origin', () => {
    expect(nextSelection({ origin: 1, dest: 3 }, 4)).toEqual({ origin: 4, dest: null });
  });
  it('tapping the lone origin again clears the selection', () => {
    expect(nextSelection({ origin: 2, dest: null }, 2)).toEqual(EMPTY_SELECTION);
  });
});

describe('stopRole', () => {
  const s = { origin: 1, dest: 4 };
  it('labels origin, destination, in-range and out-of-range', () => {
    expect(stopRole(s, 1)).toBe('origin');
    expect(stopRole(s, 4)).toBe('destination');
    expect(stopRole(s, 2)).toBe('in-range');
    expect(stopRole(s, 3)).toBe('in-range');
    expect(stopRole(s, 0)).toBe('out-of-range');
    expect(stopRole(s, 5)).toBe('out-of-range');
  });
  it('treats a lone origin as not forming a range', () => {
    expect(stopRole({ origin: 1, dest: null }, 2)).toBe('out-of-range');
  });
});
