// ─────────────────────────────────────────────────────────────────────────────
// Stop-selection state machine (Spec §6.1), as a pure transition so it can be
// unit-tested without a DOM:
//   tap 1 → sets origin
//   tap 2 (after origin) → sets destination (must be after origin; if before,
//          it becomes the new origin)
//   tap on a fully-selected pair → resets to a fresh origin
//   tapping the lone origin again → clears the selection
// ─────────────────────────────────────────────────────────────────────────────

export interface Selection {
  origin: number | null;
  dest: number | null;
}

export const EMPTY_SELECTION: Selection = { origin: null, dest: null };

export function nextSelection(s: Selection, idx: number): Selection {
  if (s.origin === null) return { origin: idx, dest: null };
  if (s.dest !== null) return { origin: idx, dest: null }; // pair set → fresh origin
  if (idx > s.origin) return { origin: s.origin, dest: idx }; // valid destination
  if (idx < s.origin) return { origin: idx, dest: null }; // earlier tap → new origin
  return EMPTY_SELECTION; // tapped the lone origin again → clear
}

export type StopRole = 'origin' | 'destination' | 'in-range' | 'out-of-range';

export function stopRole(s: Selection, idx: number): StopRole {
  if (idx === s.origin) return 'origin';
  if (idx === s.dest) return 'destination';
  if (s.origin !== null && s.dest !== null && idx > s.origin && idx < s.dest) {
    return 'in-range';
  }
  return 'out-of-range';
}
