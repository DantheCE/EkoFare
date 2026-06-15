import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState (Spec §6.8). Dashed-circle illustration slot + heading (Plus
// Jakarta Sans, NOT Danfo) + body + optional CTA. Reused by Saved, Search
// no-results, and filtered Routes.
// ─────────────────────────────────────────────────────────────────────────────

export default function EmptyState({
  icon,
  heading,
  body,
  cta,
}: {
  icon: React.ReactNode;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ border: '2px dashed var(--line)', color: 'var(--faint)' }}
      >
        {icon}
      </div>
      {/* Heading is body font, never Danfo (Spec §3.6) */}
      <h2 className="text-[18px] font-extrabold text-cream">{heading}</h2>
      <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-muted">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 flex h-11 items-center rounded-button px-5 text-[15px] font-bold transition-colors"
          style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
