'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, Clock, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouteQuery } from '../../../hooks/useRouteQueries';
import { useStopSelection } from '../../../hooks/useStopSelection';
import { reverseStops, fareBetween, formatDuration } from '../../../lib/fare';
import { VEHICLE_LABEL } from '../../../types';
import StopTimeline from '../../components/StopTimeline';
import FareBar from '../../components/FareBar';
import ReverseToggle from '../../components/ReverseToggle';
import { StatusBadge } from '../../components/Badge';
import { RouteDetailSkeleton } from '../../components/Skeleton';
import { useSavedRoutes } from '../../../store/useSavedRoutes';

// ─────────────────────────────────────────────────────────────────────────────
// Route Detail (Spec §3.3) — the core screen. Yellow header with danfo-stripe
// bottom edge, reverse toggle + save, instruction hint, selectable StopTimeline,
// and a sticky FareBar. Reverse recomputes cumulative fares and clears the
// current selection (Spec §6.2).
// ─────────────────────────────────────────────────────────────────────────────

export default function RouteDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: route, isLoading, isError, refetch } = useRouteQuery(id);
  const [reversed, setReversed] = useState(false);

  const stops = useMemo(
    () => (route ? (reversed ? reverseStops(route.stops) : route.stops) : []),
    [route, reversed],
  );
  const { selection, focusIdx, select, reset, setFocusIdx } = useStopSelection(stops.length);

  const isSaved = useSavedRoutes((s) => (route ? s.isSaved(route.id) : false));
  const toggleSave = useSavedRoutes((s) => s.toggle);

  if (isLoading) return <RouteDetailSkeleton />;

  if (isError || !route) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center" role="alert">
        <p className="text-[16px] font-bold text-cream">Couldn’t load this route</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 flex h-10 items-center gap-2 rounded-button px-4 text-[14px] font-bold"
          style={{ background: 'var(--yellow)', color: 'var(--ink)' }}
        >
          <RotateCw size={15} /> Retry
        </button>
      </div>
    );
  }

  const fare = selection.dest !== null && selection.origin !== null
    ? fareBetween(stops, selection.origin, selection.dest)
    : null;
  const originName = selection.origin !== null ? stops[selection.origin]?.name : undefined;
  const destName = selection.dest !== null ? stops[selection.dest]?.name : undefined;

  function onReverse() {
    setReversed((r) => !r);
    reset();
    toast('Fares may differ in reverse direction.');
  }

  function onShare() {
    if (selection.origin === null || selection.dest === null) return;
    router.push(`/routes/${id}/fare?from=${selection.origin}&to=${selection.dest}&rev=${reversed ? 1 : 0}`);
  }

  return (
    <div className="pb-44">
      {/* yellow header with danfo-stripe bottom edge */}
      <header className="relative px-4 pb-6 pt-[calc(10px+env(safe-area-inset-top))]" style={{ background: 'var(--yellow)' }}>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push('/routes')}
            aria-label="Back to routes"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: 'var(--ink)' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <ReverseToggle onReverse={onReverse} />
            <button
              type="button"
              onClick={() => toggleSave(route)}
              aria-pressed={isSaved}
              aria-label={isSaved ? 'Remove from saved' : 'Save route'}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: 'var(--ink)', background: 'rgba(19,17,9,0.10)' }}
            >
              <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={isSaved ? 0 : 2} />
            </button>
          </div>
        </div>

        {/* route title — Danfo display, wraps, never truncates */}
        <h1 className="font-display mt-2 text-[30px] leading-tight" style={{ color: 'var(--ink)' }}>
          {stops[0]?.name} → {stops[stops.length - 1]?.name}
        </h1>

        {/* badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-pill px-2.5 py-1 text-[12px] font-bold"
            style={{ background: 'rgba(19,17,9,0.10)', color: 'var(--ink)' }}
          >
            {VEHICLE_LABEL[route.vehicle]}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: 'rgba(19,17,9,0.10)', color: 'var(--ink)' }}
          >
            <Clock size={13} /> ~{formatDuration(route.duration_min)}
          </span>
          <StatusBadge status={route.status} />
        </div>

        {/* danfo-stripe bottom edge */}
        <div className="danfo-stripe absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
      </header>

      <div className="px-4">
        {/* instruction hint */}
        <div className="mt-4 rounded-card border border-line bg-ink-2 p-3 text-[13px] text-muted" style={{ borderRadius: 'var(--radius-card)' }}>
          Tap your <strong className="text-cream">start stop</strong>, then your{' '}
          <strong className="text-cream">end stop</strong> to calculate the fare.
        </div>

        {/* timeline */}
        <div className="mt-5">
          <StopTimeline
            stops={stops}
            selection={selection}
            focusIdx={focusIdx}
            onSelect={select}
            onFocusChange={setFocusIdx}
          />
        </div>
      </div>

      <FareBar fare={fare} originName={originName} destName={destName} onShare={onShare} />
    </div>
  );
}
