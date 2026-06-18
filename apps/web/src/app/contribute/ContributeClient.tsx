'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '../../store/useToast';
import VehicleSelect from '../components/VehicleSelect';
import StopBuilder from '../components/StopBuilder';
import { useRouteQuery } from '../../hooks/useRouteQueries';
import { submitContribution } from '../../lib/api/contributions';
import { validateContribution, type DraftStop } from '../../lib/contributionValidation';
import type { Vehicle, ContributionWarning } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Contribute (Spec §3.7). VehicleSelect + StopBuilder + notes with live
// client-side validation. Handles all five POST outcomes (Spec §4.3):
// success → success screen; warning → inline banner + "Submit anyway";
// duplicate → block + link to existing; rate-limit → toast + cooldown;
// validation → surfaced as a toast (the form already blocks the common cases).
// Prefilled from a route when reached via "Correct this fare?".
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY: DraftStop[] = [
  { name: '', leg_fare: 0 },
  { name: '', leg_fare: 0 },
];

export default function ContributeClient({ prefillRouteId }: { prefillRouteId: string | null }) {
  const router = useRouter();
  const { data: prefill } = useRouteQuery(prefillRouteId ?? '');

  const [vehicle, setVehicle] = useState<Vehicle>('DANFO');
  const [stops, setStops] = useState<DraftStop[]>(EMPTY);
  const [notes, setNotes] = useState('');

  // Seed from a prefill route once, guarded by state (no effect, no ref).
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (prefill && seededFor !== prefill.id) {
    setSeededFor(prefill.id);
    setVehicle(prefill.vehicle);
    setStops(prefill.stops.map((s) => ({ name: s.name, leg_fare: s.leg_fare })));
  }

  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [warnings, setWarnings] = useState<ContributionWarning[] | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);

  const validation = useMemo(() => validateContribution(stops), [stops]);

  const submittedName = useMemo(() => {
    const named = stops.map((s) => s.name.trim()).filter(Boolean);
    return named.length >= 2 ? `${named[0]} → ${named[named.length - 1]}` : named[0] ?? '';
  }, [stops]);

  async function doSubmit(userConfirmed: boolean) {
    if (submitting || cooldown) return;
    if (!validation.canSubmit) {
      toast.warn('Add at least 2 stops before submitting');
      return;
    }
    setSubmitting(true);
    setDuplicate(null);
    try {
      const outcome = await submitContribution(
        {
          route_id: prefillRouteId,
          submitted_name: submittedName,
          vehicle,
          notes: notes.trim() || undefined,
          stops: stops.map((s) => ({ name: s.name.trim(), leg_fare: s.leg_fare })),
        },
        { userConfirmed },
      );

      switch (outcome.kind) {
        case 'success':
          toast.success('Submitted! Your route is in the review queue');
          router.push('/contribute/success');
          return;
        case 'warning':
          setWarnings(outcome.result.warnings);
          toast.info('Heads up — review the note below before submitting');
          break;
        case 'duplicate':
          setDuplicate(outcome.error.existing_route);
          break;
        case 'rate_limit': {
          const mins = Math.max(1, Math.ceil(outcome.error.retry_after / 60));
          toast.warn(`Limit reached — 5/hour. Try again in ${mins} min`);
          setCooldown(true);
          setTimeout(() => setCooldown(false), outcome.error.retry_after * 1000);
          break;
        }
        case 'validation':
          toast.warn(outcome.error.details[0]?.message ?? 'Add at least 2 stops before submitting');
          break;
      }
    } catch {
      toast.error('Network error — your route wasn’t submitted. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pb-28">
      {/* header */}
      <header className="flex items-center gap-2 pt-[calc(8px+env(safe-area-inset-top))]">
        <Link href="/" aria-label="Cancel" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cream">
          <X size={22} />
        </Link>
        <div>
          <h1 className="font-display text-[26px] leading-none text-cream">Add a route</h1>
          <p className="mt-1 text-[13px] text-muted">Share a fare you know. It goes live after review.</p>
        </div>
      </header>

      {/* vehicle */}
      <section className="mt-6">
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-faint">Vehicle</h2>
        <VehicleSelect value={vehicle} onChange={setVehicle} />
      </section>

      {/* stops */}
      <section className="mt-6">
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-faint">Stops & fares</h2>
        <StopBuilder stops={stops} errors={validation.errors} onChange={setStops} />
      </section>

      {/* notes */}
      <section className="mt-5">
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-faint">Notes (optional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. fares rise during rush hour"
          rows={2}
          className="w-full rounded-input border border-line bg-ink-3 p-3 text-[14px] text-cream placeholder:text-faint focus:outline-none"
          style={{ borderRadius: 'var(--radius-input)' }}
        />
      </section>

      {/* info card */}
      <div
        className="mt-4 flex gap-2 rounded-card p-3 text-[13px]"
        style={{ background: 'rgba(70,224,140,0.08)', border: '1px solid rgba(70,224,140,0.25)', color: 'var(--go)' }}
      >
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>All submissions are reviewed before going live. Conflicting prices are flagged for community voting.</p>
      </div>

      {/* non-blocking client warning for short routes */}
      {validation.warnings.map((w) => (
        <p key={w} className="mt-3 text-[12px] text-muted">⚠ {w}</p>
      ))}

      {/* server warning banner + submit anyway */}
      {warnings && (
        <div
          className="mt-4 rounded-card p-3"
          style={{ background: 'rgba(255,206,58,0.08)', border: '1px solid rgba(255,206,58,0.25)' }}
        >
          {warnings.map((w) => (
            <p key={w.type} className="flex gap-2 text-[13px] text-cream">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-yellow" />
              {w.message}
            </p>
          ))}
          <button
            type="button"
            onClick={() => doSubmit(true)}
            disabled={submitting}
            className="mt-3 h-10 w-full rounded-button text-[14px] font-bold"
            style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
          >
            Submit anyway
          </button>
        </div>
      )}

      {/* duplicate block */}
      {duplicate && (
        <div
          className="mt-4 rounded-card p-3"
          style={{ background: 'rgba(255,122,69,0.08)', border: '1px solid rgba(255,122,69,0.25)' }}
        >
          <p className="text-[13px] font-semibold text-stop">This route already exists.</p>
          <Link href={`/routes/${duplicate.id}`} className="mt-1 inline-block text-[13px] font-bold text-yellow">
            View “{duplicate.name}” →
          </Link>
        </div>
      )}

      {/* pinned submit */}
      <div
        className="fixed inset-x-0 z-40 mx-auto max-w-md border-t border-line bg-ink-2 px-4 py-3"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => doSubmit(false)}
          disabled={!validation.canSubmit || submitting || cooldown}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-button text-[15px] font-bold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--radius-button)' }}
        >
          {submitting && <Loader2 size={17} className="animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
    </div>
  );
}
