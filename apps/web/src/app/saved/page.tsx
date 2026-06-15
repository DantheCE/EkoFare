'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import RouteCard from '../components/RouteCard';
import EmptyState from '../components/EmptyState';
import { RouteListSkeleton } from '../components/Skeleton';
import { useSavedRoutes } from '../../store/useSavedRoutes';
import { useHydrated } from '../../hooks/useHydrated';

// ─────────────────────────────────────────────────────────────────────────────
// Saved Routes (Spec §3.6). Persisted full Route objects render offline. The
// approved empty state: dashed-circle heart glyph, heading in Plus Jakarta Sans
// (NOT Danfo), browse CTA, and a subtle "or search for a stop" divider. A
// mounted guard avoids a flash of the empty state before persist rehydrates.
// ─────────────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const saved = useSavedRoutes((s) => s.saved);
  const routes = Object.values(saved);
  const mounted = useHydrated();

  return (
    <div className="px-4">
      <ScreenHeader title="Saved Routes" />

      <div className="mt-5">
        {!mounted ? (
          <RouteListSkeleton count={3} />
        ) : routes.length === 0 ? (
          <>
            <EmptyState
              icon={<Heart size={28} />}
              heading="No saved routes yet"
              body="Tap the heart on any route to save it here for quick access — handy for your daily commute."
              cta={{ label: 'Browse routes', href: '/routes' }}
            />
            <div className="mt-6 flex items-center gap-3 px-6 text-faint">
              <span className="h-px flex-1 bg-line" />
              <Link href="/search" className="text-[13px] font-semibold text-muted">
                or search for a stop
              </Link>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
