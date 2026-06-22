import type { RouteStatus } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Badge (Spec §6.5). Status badges: FRAGMENT renders nothing (hidden from
// lists); UNVERIFIED grey; VERIFIED go-tinted "✓ Verified"; MAJOR yellow-tinted
// "★ Major". An optional rider `count` (route.verification_count, the weakest-leg
// report count) is appended: full → "✓ Verified · 12"; compact → "✓ 12" for
// dense list cards and the farebar. Generic <Badge> handles vehicle/duration pills.
// ─────────────────────────────────────────────────────────────────────────────

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'go' | 'yellow' | 'stop';
}) {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    neutral: { bg: 'var(--ink-3)', fg: 'var(--muted)', bd: 'var(--line)' },
    go: { bg: 'rgba(70,224,140,0.12)', fg: 'var(--go)', bd: 'rgba(70,224,140,0.30)' },
    yellow: { bg: 'rgba(255,206,58,0.12)', fg: 'var(--yellow)', bd: 'rgba(255,206,58,0.30)' },
    stop: { bg: 'rgba(255,122,69,0.12)', fg: 'var(--stop)', bd: 'rgba(255,122,69,0.30)' },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] font-semibold leading-none"
      style={{
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        borderRadius: 'var(--radius-pill)',
        padding: '5px 10px',
      }}
    >
      {children}
    </span>
  );
}

const STATUS_META: Record<
  Exclude<RouteStatus, 'FRAGMENT'>,
  { tone: 'neutral' | 'go' | 'yellow'; symbol: string; label: string }
> = {
  UNVERIFIED: { tone: 'neutral', symbol: '○', label: 'Unverified' },
  VERIFIED: { tone: 'go', symbol: '✓', label: 'Verified' },
  MAJOR: { tone: 'yellow', symbol: '★', label: 'Major' },
};

export function StatusBadge({
  status,
  count,
  variant = 'full',
}: {
  status: RouteStatus;
  /** Rider count (route.verification_count). Appended when present. */
  count?: number;
  /** full → "✓ Verified · 12" (headers); compact → "✓ 12" (cards, farebar). */
  variant?: 'full' | 'compact';
}) {
  if (status === 'FRAGMENT') return null;
  const meta = STATUS_META[status];
  const hasCount = typeof count === 'number';

  if (variant === 'compact') {
    return (
      <Badge tone={meta.tone}>
        <span aria-hidden>{meta.symbol}</span>
        {hasCount && <span className="tnum">{count}</span>}
      </Badge>
    );
  }

  return (
    <Badge tone={meta.tone}>
      {status === 'UNVERIFIED' ? meta.label : `${meta.symbol} ${meta.label}`}
      {hasCount && (
        <>
          {' · '}
          <span className="tnum">{count}</span>
        </>
      )}
    </Badge>
  );
}
