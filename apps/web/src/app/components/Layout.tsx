'use client';

import { Toaster } from 'sonner';
import BottomNav from './BottomNav';

// ─────────────────────────────────────────────────────────────────────────────
// App shell — single mobile-first responsive column (Spec: collapse the old
// mobile/desktop split). On large screens the content stays a centred phone-
// width column on the warm-black surface. BottomNav is fixed; main reserves
// space for it. Toaster is the dark ink pill from Spec §6.7.
// ─────────────────────────────────────────────────────────────────────────────

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <main className="mx-auto w-full max-w-md pb-[calc(72px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <BottomNav />

      <Toaster
        position="bottom-center"
        offset={88}
        toastOptions={{
          style: {
            background: 'var(--ink)',
            color: 'var(--cream)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}
