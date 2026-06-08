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

/** Full Route Detail skeleton (Spec §3.9): yellow header renders instantly,
 *  title/badges shimmer on yellow, a loading pill, then 5 stop-row skeletons. */
export function RouteDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading route">
      {/* yellow header structure, instant */}
      <div className="relative px-4 pb-6 pt-[calc(12px+env(safe-area-inset-top))]" style={{ background: 'var(--yellow)' }}>
        <Skeleton onYellow width={120} height={14} radius={7} />
        <div className="mt-3"><Skeleton onYellow width="70%" height={26} radius={8} /></div>
        <div className="mt-3 flex gap-2">
          <Skeleton onYellow width={70} height={22} radius={11} />
          <Skeleton onYellow width={64} height={22} radius={11} />
          <Skeleton onYellow width={58} height={22} radius={11} />
        </div>
      </div>

      <div className="px-4">
        <div className="mt-4"><Skeleton height={56} radius={12} /></div>

        <div className="mt-5 flex items-center gap-2">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-line"
            style={{ borderTopColor: 'var(--yellow)' }}
          />
          <span className="text-[13px] text-muted">Loading route data…</span>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {[64, 52, 70, 48, 60].map((w, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton width={20} height={20} radius={10} />
              <div className="flex-1">
                <Skeleton width={`${w}%`} height={16} />
                <div className="mt-2"><Skeleton width="30%" height={12} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
