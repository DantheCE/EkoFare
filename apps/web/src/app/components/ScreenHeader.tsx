'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ScreenHeader — Danfo display title for screen headers (Spec §1.3: Danfo is
// allowed here). Optional back control and right-hand slot.
// ─────────────────────────────────────────────────────────────────────────────

export default function ScreenHeader({
  title,
  back = false,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-2 pt-[calc(8px+env(safe-area-inset-top))]">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cream"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="font-display flex-1 text-[26px] leading-tight text-cream">{title}</h1>
      {right}
    </header>
  );
}
