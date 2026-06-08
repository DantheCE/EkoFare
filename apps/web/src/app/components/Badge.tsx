import type { RouteStatus } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Badge (Spec §6.5). Status badges: FRAGMENT renders nothing (hidden from
// lists); UNVERIFIED grey; VERIFIED go-tinted "✓ Verified"; MAJOR yellow-tinted
// "★ Major". Generic <Badge> handles vehicle/duration pills.
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

export function StatusBadge({ status }: { status: RouteStatus }) {
  if (status === 'FRAGMENT') return null;
  if (status === 'UNVERIFIED')
    return <Badge tone="neutral">Unverified</Badge>;
  if (status === 'VERIFIED')
    return <Badge tone="go">✓ Verified</Badge>;
  return <Badge tone="yellow">★ Major</Badge>;
}
