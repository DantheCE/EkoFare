import Link from 'next/link';
import { Hammer } from 'lucide-react';
import Wordmark from './Wordmark';

// ─────────────────────────────────────────────────────────────────────────────
// ComingSoon — themed placeholder for screens built in the next pass. Keeps the
// shell coherent (no broken light-design pages) during the foundation
// checkpoint. Replaced by the real screen in build steps 3–8.
// ─────────────────────────────────────────────────────────────────────────────

export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <Wordmark size={26} />
      <div
        className="mt-8 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ border: '2px dashed var(--line)', color: 'var(--yellow)' }}
      >
        <Hammer size={26} />
      </div>
      <h1 className="font-display mt-6 text-[28px] text-cream">{title}</h1>
      <p className="mt-2 max-w-xs text-[14px] text-muted">
        This screen ships in the next build pass. The design system, data layer,
        and navigation are live — tap Routes to see the Home screen.
      </p>
      <Link
        href="/"
        className="mt-6 flex h-11 items-center rounded-button px-5 text-[15px] font-bold"
        style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
      >
        Back to Home
      </Link>
    </main>
  );
}
