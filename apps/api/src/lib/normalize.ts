// ─────────────────────────────────────────────────────────────────────────────
// Stop-name normalization (build spec §5.1) — the foundational correctness layer.
// If "Oshodi" and "Oshodi Bus Stop" normalize differently, the graph fragments
// into disconnected islands and pathfinding silently fails. Pure function, no
// I/O, so it is exhaustively unit-tested as a gate test.
// ─────────────────────────────────────────────────────────────────────────────

// Generic stop-type suffixes/words Lagos commuters append inconsistently. Order
// inside the alternation does not matter; \b anchors keep "park" from eating the
// middle of a real name. Matched before punctuation stripping so "b/stop" works.
const SUFFIX_RE =
  /\b(bus\s*stop|busstop|terminal|park|garage|under\s*bridge|b\/?stop|junction|round\s*about)\b/g;

function squash(s: string): string {
  return s
    .replace(/[^a-z0-9 ]/g, '') // drop punctuation/diacritics already lowercased
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalize(name: string): string {
  const lower = name.toLowerCase().trim();
  const stripped = squash(lower.replace(SUFFIX_RE, ''));
  // Guard: a name that is ONLY suffix words ("Bus Stop") would collapse to "".
  // Fall back to the punctuation-cleaned full string so it still keys uniquely.
  return stripped.length > 0 ? stripped : squash(lower);
}

export function sameNormalized(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}
