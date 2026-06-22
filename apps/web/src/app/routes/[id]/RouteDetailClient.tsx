'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, Clock, RotateCw } from 'lucide-react';
import { toast } from '../../../store/useToast';
import { useRouteQuery } from '../../../hooks/useRouteQueries';
import { useStopSelection } from '../../../hooks/useStopSelection';
import { reverseStops, fareBetween, tripSlice, formatDuration } from '../../../lib/fare';
import { VEHICLE_LABEL } from '../../../types';
import { submitContribution, type SubmitOutcome } from '../../../lib/api/contributions';
import StopTimeline from '../../components/StopTimeline';
import FareBar, { type ConfirmState } from '../../components/FareBar';
import ReverseToggle from '../../components/ReverseToggle';
import { StatusBadge } from '../../components/Badge';
import { RouteDetailSkeleton } from '../../components/Skeleton';
import { useSavedRoutes } from '../../../store/useSavedRoutes';
import { useConfirmedFares, segmentKey } from '../../../store/useConfirmedFares';
import { type Selection } from '../../../lib/selection';
import DifferentFareSheet from './DifferentFareSheet';

// ─────────────────────────────────────────────────────────────────────────────
// Route Detail (Spec §3.3) — the core screen, with the crowd-verification layer.
// Yellow header with a confidence badge (status + rider count), selectable
// StopTimeline (defaulting to the whole route), and a sticky FareBar carrying the
// two crowd actions: "I paid this too" files a corroborating report on the
// selected segment's legs (ticking the count); "I paid a different fare" opens a
// sheet that files the segment total as a report. Both reuse POST /contributions.
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
  const isConfirmedSeg = useConfirmedFares((s) => s.isConfirmed);
  const addConfirmed = useConfirmedFares((s) => s.add);

  const [confirming, setConfirming] = useState(false);
  const [confirmDelta, setConfirmDelta] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  // Alias the now-loaded route so its narrowing flows into the async handlers
  // below (TS doesn't carry the `!route` guard into nested closures).
  const r = route;

  // The displayed/acted-on segment defaults to the whole route, so the fare and
  // crowd actions show immediately (matching the design). Once the rider starts
  // tapping stops, their in-progress selection takes over.
  const noSelection = selection.origin === null && selection.dest === null;
  const eff: Selection = noSelection ? { origin: 0, dest: stops.length - 1 } : selection;

  const fare = eff.origin !== null && eff.dest !== null ? fareBetween(stops, eff.origin, eff.dest) : null;
  const originName = eff.origin !== null ? stops[eff.origin]?.name : undefined;
  const destName = eff.dest !== null ? stops[eff.dest]?.name : undefined;
  const ready = fare !== null && Boolean(originName) && Boolean(destName);

  const displayCount = route.verification_count + confirmDelta;
  const segKey = ready ? segmentKey(route.id, originName!, destName!) : '';
  const confirmState: ConfirmState = confirming
    ? 'recording'
    : segKey && isConfirmedSeg(segKey)
      ? 'confirmed'
      : 'idle';

  function onReverse() {
    setReversed((r) => !r);
    reset();
    toast.info('Fares may differ in the reverse direction');
  }

  const onToggleSave = () => {
    const wasSaved = isSaved;
    toggleSave(route);
    if (wasSaved) toast.info('Removed from saved');
    else toast.success(`${route.name} saved to your routes`);
  };

  function onShare() {
    if (eff.origin === null || eff.dest === null) return;
    router.push(`/routes/${id}/fare?from=${eff.origin}&to=${eff.dest}&rev=${reversed ? 1 : 0}`);
  }

  /** Map a contribution outcome onto toasts; run onOk for a recorded report. */
  function reportOutcome(outcome: SubmitOutcome, onOk: () => void) {
    switch (outcome.kind) {
      case 'success':
      case 'warning':
        onOk();
        break;
      case 'rate_limit': {
        const mins = Math.max(1, Math.ceil(outcome.error.retry_after / 60));
        toast.warn(`Limit reached — 5/hour. Try again in ${mins} min`);
        break;
      }
      case 'validation':
        toast.warn(outcome.error.details[0]?.message ?? 'Couldn’t record that fare');
        break;
      case 'duplicate':
        toast.info('That route already exists');
        break;
    }
  }

  // "I paid this too" — resubmit the selected segment's per-leg fares so every
  // leg gets a corroborating report and the weakest-leg count ticks up.
  async function onConfirm() {
    if (!ready || eff.origin === null || eff.dest === null) return;
    if (confirming || (segKey && isConfirmedSeg(segKey))) return;
    setConfirming(true);
    try {
      const segStops = tripSlice(stops, eff.origin, eff.dest); // origin leg re-based to ₦0
      const outcome = await submitContribution(
        {
          route_id: r.id,
          submitted_name: `${originName} → ${destName}`,
          vehicle: r.vehicle,
          stops: segStops.map((s) => ({ name: s.name, leg_fare: s.leg_fare })),
        },
        { userConfirmed: true },
      );
      reportOutcome(outcome, () => {
        addConfirmed(segKey);
        setConfirmDelta((d) => d + 1);
        toast.success('Thanks — you confirmed this fare');
      });
    } catch {
      toast.error('Network error — your confirmation wasn’t recorded. Try again.');
    } finally {
      setConfirming(false);
    }
  }

  // "I paid a different fare" — file the entered total as a report on the
  // origin→dest segment (same as a two-stop contribution).
  async function onSubmitDifferent(amount: number) {
    if (eff.origin === null || eff.dest === null || !originName || !destName) return;
    try {
      const outcome = await submitContribution(
        {
          route_id: r.id,
          submitted_name: `${originName} → ${destName}`,
          vehicle: r.vehicle,
          stops: [
            { name: originName, leg_fare: 0 },
            { name: destName, leg_fare: amount },
          ],
        },
        { userConfirmed: true },
      );
      reportOutcome(outcome, () => {
        setSheetOpen(false);
        toast.success('Thanks — that helps keep fares accurate');
      });
    } catch {
      toast.error('Network error — your fare wasn’t recorded. Try again.');
    }
  }

  return (
    <div className="pb-56">
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
              onClick={onToggleSave}
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
          <StatusBadge status={route.status} count={displayCount} />
        </div>

        {/* danfo-stripe bottom edge */}
        <div className="danfo-stripe absolute inset-x-0 bottom-0 h-1.5" aria-hidden />
      </header>

      <div className="px-4">
        {/* unverified nudge, or the tap-to-calculate hint */}
        {route.status === 'UNVERIFIED' ? (
          <div
            className="mt-4 rounded-card p-3.5"
            style={{ background: 'rgba(255,206,58,0.07)', border: '1px solid rgba(255,206,58,0.28)', borderRadius: 'var(--radius-card)' }}
          >
            <p className="text-[13.5px] font-bold text-cream">Have you taken this trip?</p>
            <p className="mt-1 text-[12.5px] leading-snug text-muted">
              Only a few riders have confirmed this fare. Confirm it to help it get verified.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-card border border-line bg-ink-2 p-3 text-[13px] text-muted" style={{ borderRadius: 'var(--radius-card)' }}>
            Tap your <strong className="text-cream">start stop</strong>, then your{' '}
            <strong className="text-cream">end stop</strong> to calculate the fare.
          </div>
        )}

        {/* timeline */}
        <div className="mt-5">
          <StopTimeline
            stops={stops}
            selection={eff}
            focusIdx={focusIdx}
            onSelect={select}
            onFocusChange={setFocusIdx}
          />
        </div>
      </div>

      <FareBar
        fare={fare}
        originName={originName}
        destName={destName}
        status={route.status}
        count={displayCount}
        confirmState={confirmState}
        onConfirm={onConfirm}
        onDifferentFare={() => setSheetOpen(true)}
        onShare={onShare}
      />

      <DifferentFareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        segmentName={ready ? `${originName} → ${destName}` : route.name}
        suggestedFare={fare ?? 0}
        onSubmit={onSubmitDifferent}
      />
    </div>
  );
}
