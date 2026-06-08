// ─────────────────────────────────────────────────────────────────────────────
// Skeleton primitives (Spec §3.9). Shimmer sweeps 1.5s linear on dark
// (ink-3 → ink-4 → ink-3); under prefers-reduced-motion the sweep is disabled
// and a static ink-3 block shows. `onYellow` swaps to the translucent-ink sweep
// for shimmer bars on the yellow detail header.
// ─────────────────────────────────────────────────────────────────────────────

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  onYellow = false,
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  radius?: number;
  onYellow?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`${onYellow ? 'skeleton-shimmer-on-yellow' : 'skeleton-shimmer'} ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/** Matches RouteCard layout: [stripe] [icon tile] [two text bars] [fare]. */
export function RouteCardSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-card border border-line bg-ink-2 p-4"
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <Skeleton width={44} height={44} radius={11} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton width="62%" height={16} />
        <Skeleton width="42%" height={12} />
      </div>
      <Skeleton width={56} height={20} radius={8} />
    </div>
  );
}

export function RouteListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading routes">
      {Array.from({ length: count }).map((_, i) => (
        <RouteCardSkeleton key={i} />
      ))}
    </div>
  );
}
