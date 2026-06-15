// ─────────────────────────────────────────────────────────────────────────────
// EkoFare wordmark — one of the only places the Danfo display face is allowed
// (Spec §1.3). "Eko" in yellow, "Fare" in cream.
// ─────────────────────────────────────────────────────────────────────────────

export default function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="font-display select-none leading-none"
      style={{ fontSize: size }}
      aria-label="EkoFare"
    >
      <span style={{ color: 'var(--yellow)' }}>Eko</span>
      <span style={{ color: 'var(--cream)' }}>Fare</span>
    </span>
  );
}
