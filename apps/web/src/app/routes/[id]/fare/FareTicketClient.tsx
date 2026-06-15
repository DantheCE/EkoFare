'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Share2, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { useRouteQuery } from '../../../../hooks/useRouteQueries';
import { reverseStops, tripSlice, totalFare, formatFare, formatDuration } from '../../../../lib/fare';
import { formatRelative } from '../../../../lib/datetime';
import { shareOrCopy } from '../../../../lib/share';
import { VEHICLE_LABEL } from '../../../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Fare Ticket (Spec §3.4). Renders the selected origin→destination as a tear-off
// boarding pass on a paper surface: danfo-stripe top, From/To, big total in
// tabular figures, a real perforation divider with notch circles, foot row,
// then the trip's stop list. Share via Web Share API (clipboard fallback).
// ─────────────────────────────────────────────────────────────────────────────

export default function FareTicketClient({
  id,
  from,
  to,
  rev,
}: {
  id: string;
  from?: string;
  to?: string;
  rev?: string;
}) {
  const router = useRouter();
  const { data: route, isLoading } = useRouteQuery(id);
  const reversed = rev === '1';
  const originIdx = Number(from);
  const destIdx = Number(to);

  const stops = useMemo(
    () => (route ? (reversed ? reverseStops(route.stops) : route.stops) : []),
    [route, reversed],
  );
  const trip = useMemo(
    () => (stops.length ? tripSlice(stops, originIdx, destIdx) : []),
    [stops, originIdx, destIdx],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-label="Loading ticket">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line" style={{ borderTopColor: 'var(--yellow)' }} />
      </div>
    );
  }

  if (!route || trip.length < 2 || Number.isNaN(originIdx) || Number.isNaN(destIdx)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[16px] font-bold text-cream">This trip link is incomplete</p>
        <p className="mt-1 text-[14px] text-muted">Pick a start and end stop on the route first.</p>
        <Link
          href={`/routes/${id}`}
          className="mt-5 flex h-11 items-center rounded-button px-5 text-[15px] font-bold"
          style={{ background: 'var(--yellow)', color: 'var(--ink)' }}
        >
          Back to route
        </Link>
      </div>
    );
  }

  const origin = trip[0];
  const dest = trip[trip.length - 1];
  const fare = totalFare(trip);

  async function onShare() {
    const text = `EkoFare — ${origin.name} → ${dest.name} by ${VEHICLE_LABEL[route!.vehicle]}: ${formatFare(fare)} per person. Check the fare before you board.`;
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    const result = await shareOrCopy({ title: 'EkoFare trip', text, url });
    if (result === 'copied') toast('Trip summary copied to clipboard');
    else if (result === 'failed') toast('Couldn’t share — try again');
  }

  return (
    <div className="px-4 pb-10">
      {/* back */}
      <header className="flex items-center pt-[calc(8px+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cream"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-[14px] font-semibold text-muted">Your fare ticket</span>
      </header>

      {/* boarding pass */}
      <div
        className="mt-3 overflow-hidden rounded-card"
        style={{ background: 'var(--paper)', borderRadius: 'var(--radius-card-lg)' }}
      >
        {/* danfo-stripe top edge */}
        <div className="danfo-stripe h-2" aria-hidden />

        <div className="px-5 pt-5">
          {/* From / To */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--paper-mut)' }}>
                From
              </p>
              <p className="text-[16px] font-extrabold leading-snug" style={{ color: 'var(--paper-ink)' }}>
                {origin.name}
              </p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--paper-mut)' }}>
                To
              </p>
              <p className="text-[16px] font-extrabold leading-snug" style={{ color: 'var(--paper-ink)' }}>
                {dest.name}
              </p>
            </div>
          </div>

          {/* total */}
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--paper-mut)' }}>
              Total per person
            </p>
            <p className="tnum text-[44px] font-extrabold leading-none" style={{ color: 'var(--paper-ink)' }}>
              {formatFare(fare)}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--paper-mut)' }}>
              One-way · {VEHICLE_LABEL[route.vehicle]} · Community-sourced
            </p>
          </div>
        </div>

        {/* perforation divider with notch circles straddling the edges */}
        <div className="relative my-4 h-5">
          <div
            className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed"
            style={{ borderColor: 'var(--paper-mut)', opacity: 0.5 }}
          />
          <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ background: 'var(--ink)' }} />
          <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ background: 'var(--ink)' }} />
        </div>

        {/* foot row */}
        <div className="flex items-center justify-between px-5 pb-5 text-[12px]" style={{ color: 'var(--paper-mut)' }}>
          <span>{trip.length} stops</span>
          <span>~{formatDuration(route.duration_min)}</span>
          <span>Updated {formatRelative(route.last_updated)}</span>
        </div>
      </div>

      {/* trip stop list */}
      <ol className="mt-6">
        {trip.map((stop, i) => {
          const isOrigin = i === 0;
          const isDest = i === trip.length - 1;
          const dot = isOrigin ? 'var(--go)' : isDest ? 'var(--stop)' : 'var(--yellow)';
          return (
            <li key={stop.id} className="flex items-center gap-3">
              <div className="flex w-5 flex-col items-center self-stretch">
                <span className="mt-2 h-3 w-3 rounded-full" style={{ background: dot }} />
                {!isDest && <span className="w-0.5 flex-1" style={{ background: 'var(--line)' }} />}
              </div>
              <div className="flex flex-1 items-start justify-between gap-3 py-1.5">
                <span className="text-[14px] font-medium leading-snug text-cream">{stop.name}</span>
                <span className="tnum shrink-0 text-[13px] font-semibold text-muted">
                  {formatFare(stop.cumulative_fare)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* actions */}
      <button
        type="button"
        onClick={onShare}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-button text-[15px] font-bold"
        style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
      >
        <Share2 size={18} /> Share this trip
      </button>
      <Link
        href={`/contribute?route=${id}`}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-button border border-line text-[14px] font-semibold text-muted"
        style={{ borderRadius: 'var(--radius-button)' }}
      >
        <PencilLine size={16} /> Correct this fare? Contribute →
      </Link>
    </div>
  );
}
