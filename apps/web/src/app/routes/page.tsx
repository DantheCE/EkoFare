'use client';

import { useMemo, useState } from 'react';
import { Search, MapPinOff, RotateCw } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import FilterChips, { type VehicleFilter } from '../components/FilterChips';
import SortControl, { type SortKey } from '../components/SortControl';
import RouteCard from '../components/RouteCard';
import { RouteListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useRoutesQuery } from '../../hooks/useRouteQueries';
import { filterAndSortRoutes } from '../../lib/routeView';

// ─────────────────────────────────────────────────────────────────────────────
// All Routes (Spec §3.2). Vehicle chips + sort + client-side search-within over
// the loaded set, paginated at 20/page. Loading → skeletons; filter-empty →
// EmptyState with a contribute CTA; error → retry.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AllRoutesPage() {
  const [vehicle, setVehicle] = useState<VehicleFilter>('ALL');
  const [sort, setSort] = useState<SortKey>('verified');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Fetch the whole visible set once; filter/sort/search happen client-side.
  const { data, isLoading, isError, refetch, isFetching } = useRoutesQuery({});

  const results = useMemo(
    () => filterAndSortRoutes(data ?? [], { vehicle, query, sort }),
    [data, vehicle, query, sort],
  );
  const shown = results.slice(0, visible);

  return (
    <div className="px-4">
      <ScreenHeader title="All Routes" />

      {/* search-within */}
      <label className="mt-4 flex h-12 items-center gap-3 rounded-input border border-line bg-ink-3 px-4">
        <Search size={18} className="text-muted" aria-hidden />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Filter by route or stop…"
          aria-label="Filter routes by name or stop"
          className="h-full flex-1 bg-transparent text-[15px] text-cream placeholder:text-faint focus:outline-none"
        />
      </label>

      {/* filters + sort */}
      <div className="mt-4">
        <FilterChips
          value={vehicle}
          onChange={(v) => {
            setVehicle(v);
            setVisible(PAGE_SIZE);
          }}
        />
      </div>
      <div className="mt-3">
        <SortControl value={sort} onChange={setSort} />
      </div>

      {/* list */}
      <section className="mt-5" aria-label="Routes">
        {isLoading ? (
          <RouteListSkeleton count={5} />
        ) : isError ? (
          <div
            role="alert"
            className="flex flex-col items-center rounded-card border border-line bg-ink-2 px-6 py-8 text-center"
          >
            <p className="text-[15px] font-bold text-cream">Couldn’t load routes</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 flex h-10 items-center gap-2 rounded-button px-4 text-[14px] font-bold"
              style={{ background: 'var(--yellow)', color: 'var(--ink)' }}
            >
              <RotateCw size={15} className={isFetching ? 'animate-spin' : ''} /> Retry
            </button>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<MapPinOff size={28} />}
            heading={
              vehicle === 'ALL'
                ? 'No routes match your search'
                : `No ${vehicle.toLowerCase()} routes yet`
            }
            body={
              query
                ? `Nothing matches “${query}”. Try a nearby landmark, or add the route.`
                : 'Be the first to add one — your route goes live after community review.'
            }
            cta={{ label: 'Add a route', href: '/contribute' }}
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {shown.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
            {results.length > visible && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="mt-4 w-full rounded-button border border-line bg-ink-2 py-3 text-[14px] font-bold text-cream"
              >
                Show more ({results.length - visible})
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
