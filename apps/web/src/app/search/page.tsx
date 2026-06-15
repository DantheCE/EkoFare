'use client';

import { useMemo, useRef, useState } from 'react';
import { Search, X, Clock, MapPin, ChevronRight, SearchX } from 'lucide-react';
import RouteCard from '../components/RouteCard';
import Sheet from '../components/Sheet';
import EmptyState from '../components/EmptyState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSearchQuery, useStopRoutesQuery } from '../../hooks/useRouteQueries';
import { useUiStore } from '../../store/useUiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Search (Spec §3.5). Debounced (250ms) query over route names and stop names,
// grouped into Routes and Stops. Tapping a stop opens a transfer sheet listing
// every route through it. Recent searches (persisted, max 8) show when empty.
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const inputRef = useRef<HTMLInputElement>(null);

  const recents = useUiStore((s) => s.recents);
  const addRecent = useUiStore((s) => s.addRecent);
  const removeRecent = useUiStore((s) => s.removeRecent);
  const clearRecents = useUiStore((s) => s.clearRecents);

  const { data, isLoading, isError } = useSearchQuery(debounced);
  const [stop, setStop] = useState<string | null>(null);
  const stopRoutes = useStopRoutesQuery(stop);

  const hasQuery = debounced.trim().length > 0;
  const empty = useMemo(
    () => hasQuery && data && data.routes.length === 0 && data.stops.length === 0,
    [hasQuery, data],
  );

  function commit(term: string) {
    if (term.trim()) addRecent(term);
  }

  return (
    <div className="px-4">
      {/* search input */}
      <form
        className="flex items-center gap-2 pt-[calc(12px+env(safe-area-inset-top))]"
        onSubmit={(e) => {
          e.preventDefault();
          commit(debounced);
          inputRef.current?.blur();
        }}
      >
        <label className="flex h-12 flex-1 items-center gap-3 rounded-input border border-line bg-ink-3 px-4">
          <Search size={18} className="text-muted" aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stops or routes…"
            aria-label="Search stops or routes"
            className="h-full flex-1 bg-transparent text-[15px] text-cream placeholder:text-faint focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-faint">
              <X size={18} />
            </button>
          )}
        </label>
      </form>

      {/* idle: recents */}
      {!hasQuery && (
        <section className="mt-6" aria-label="Recent searches">
          {recents.length === 0 ? (
            <p className="px-1 py-8 text-center text-[14px] text-muted">
              Search a stop or route to see fares. Try “CMS”, “Oshodi”, or a route name.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-faint">Recent</h2>
                <button onClick={clearRecents} className="text-[13px] font-semibold text-yellow">
                  Clear
                </button>
              </div>
              <ul className="flex flex-col">
                {recents.map((r) => (
                  <li key={r} className="flex items-center gap-3 border-b border-line py-3">
                    <Clock size={16} className="text-faint" />
                    <button
                      onClick={() => {
                        setQuery(r);
                        inputRef.current?.focus();
                      }}
                      className="flex-1 text-left text-[15px] text-cream"
                    >
                      {r}
                    </button>
                    <button onClick={() => removeRecent(r)} aria-label={`Remove ${r}`} className="text-faint">
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* querying */}
      {hasQuery && (
        <section className="mt-5" aria-label="Search results">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6" role="status">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line" style={{ borderTopColor: 'var(--yellow)' }} />
              <span className="text-[13px] text-muted">Searching…</span>
            </div>
          ) : isError ? (
            <p role="alert" className="py-6 text-center text-[14px] text-stop">
              Something went wrong. Try again.
            </p>
          ) : empty ? (
            <EmptyState
              icon={<SearchX size={28} />}
              heading={`No matches for “${debounced}”`}
              body="Try a nearby landmark, or add the route so other commuters can find it."
              cta={{ label: 'Add a route', href: '/contribute' }}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {data!.routes.length > 0 && (
                <div>
                  <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-faint">Routes</h2>
                  <div className="flex flex-col gap-3" onClickCapture={() => commit(debounced)}>
                    {data!.routes.map((r) => (
                      <RouteCard key={r.id} route={r} />
                    ))}
                  </div>
                </div>
              )}

              {data!.stops.length > 0 && (
                <div>
                  <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-faint">Stops</h2>
                  <ul className="flex flex-col">
                    {data!.stops.map((s) => (
                      <li key={s.name}>
                        <button
                          onClick={() => {
                            commit(debounced);
                            setStop(s.name);
                          }}
                          className="flex w-full items-center gap-3 border-b border-line py-3 text-left"
                        >
                          <MapPin size={18} className="text-go" />
                          <span className="flex-1">
                            <span className="block text-[15px] font-semibold text-cream">{s.name}</span>
                            <span className="block text-[12px] text-faint">
                              {s.route_ids.length} route{s.route_ids.length === 1 ? '' : 's'} through here
                            </span>
                          </span>
                          <ChevronRight size={18} className="text-faint" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* transfer sheet */}
      <Sheet open={Boolean(stop)} onClose={() => setStop(null)} title={stop ? `Routes through ${stop}` : ''}>
        {stopRoutes.isLoading ? (
          <div className="flex items-center gap-2 py-6" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line" style={{ borderTopColor: 'var(--yellow)' }} />
            <span className="text-[13px] text-muted">Loading routes…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            {(stopRoutes.data?.routes ?? []).map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}
