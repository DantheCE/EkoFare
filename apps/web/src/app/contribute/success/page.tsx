import Link from 'next/link';
import { Check } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Contribute Success (Spec §3.8). Confirmation that the route is queued for
// review, with "Add another route" and "Back to routes".
// ─────────────────────────────────────────────────────────────────────────────

export default function ContributeSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'rgba(70,224,140,0.12)', border: '2px solid var(--go)', color: 'var(--go)' }}
      >
        <Check size={36} />
      </div>
      <h1 className="font-display mt-6 text-[28px] text-cream">Thanks — your route is in the queue</h1>
      <p className="mt-2 max-w-xs text-[14px] text-muted">
        We review every submission before it goes live. It’ll appear in search once it’s verified.
      </p>
      <Link
        href="/contribute"
        className="mt-7 flex h-12 w-full items-center justify-center rounded-button text-[15px] font-bold"
        style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
      >
        Add another route
      </Link>
      <Link
        href="/routes"
        className="mt-3 flex h-11 w-full items-center justify-center rounded-button border border-line text-[14px] font-semibold text-cream"
        style={{ borderRadius: 'var(--radius-button)' }}
      >
        Back to routes
      </Link>
    </main>
  );
}
