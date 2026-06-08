'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { User, ChevronRight, RotateCw } from 'lucide-react';
import Wordmark from './components/Wordmark';
import SearchBar from './components/SearchBar';
import FilterChips, { type VehicleFilter } from './components/FilterChips';
import RouteCard from './components/RouteCard';
import { RouteListSkeleton } from './components/Skeleton';
import { useRoutesQuery } from '../hooks/useRouteQueries';
import { greeting } from '../lib/fare';

// ─────────────────────────────────────────────────────────────────────────────
// Home (Spec §3.1). Wordmark + avatar, time-aware greeting, search affordance,
// vehicle filter chips, and a "Popular Routes" list (MAJOR/VERIFIED only,
// sorted by verification desc). Loading → skeletons; error → retry card.
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [filter, setFilter] = useState<VehicleFilter>('ALL');
  const { data, isLoading, isError, refetch, isFetching } = useRoutesQuery({ vehicle: filter });

  const popular = useMemo(
    () => (data ?? []).filter((r) => r.status === 'MAJOR' || r.status === 'VERIFIED'),
    [data],
  );

  return (
    <div className="px-4 pt-[calc(16px+env(safe-area-inset-top))]">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <Wordmark size={28} />
        <Link
          href="/saved"
          aria-label="Your profile and saved routes"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ink-3 text-muted"
        >
          <User size={18} />
        </Link>
      </header>

      {/* Greeting + hero */}
      <div className="mt-5">
        <p className="text-[14px] text-muted">{greeting()}</p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight text-cream">
          Where are you <span className="text-yellow">headed</span> today?
        </h1>
      </div>

      {/* Search */}
      <div className="mt-4">
        <SearchBar />
      </div>

      {/* Filters */}
      <div className="mt-4">
        <FilterChips value={filter} onChange={setFilter} />
      </div>

      {/* Popular routes */}
      <section className="mt-6" aria-labelledby="popular-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="popular-heading" className="text-[16px] font-bold text-cream">
            Popular Routes
          </h2>
          <Link
            href="/routes"
            className="flex items-center gap-0.5 text-[13px] font-semibold text-yellow"
          >
            See all <ChevronRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <RouteListSkeleton count={4} />
        ) : isError ? (
          <ErrorCard onRetry={() => refetch()} retrying={isFetching} />
        ) : popular.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">
            No {filter === 'ALL' ? '' : `${filter.toLowerCase()} `}routes to show yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {popular.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ErrorCard({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-card border border-line bg-ink-2 px-6 py-8 text-center"
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <p className="text-[15px] font-bold text-cream">Couldn’t load routes</p>
      <p className="mt-1 text-[13px] text-muted">Check your connection and try again.</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-4 flex h-10 items-center gap-2 rounded-button px-4 text-[14px] font-bold disabled:opacity-60"
        style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
      >
        <RotateCw size={15} className={retrying ? 'animate-spin' : ''} />
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}
