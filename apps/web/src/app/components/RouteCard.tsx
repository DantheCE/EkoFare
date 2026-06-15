'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Route } from '../../types';
import { totalFare, formatFare, routeMeta } from '../../lib/fare';
import { useSavedRoutes } from '../../store/useSavedRoutes';
import VehicleGlyph, { vehicleAccent } from './VehicleGlyph';
import { StatusBadge } from './Badge';

// ─────────────────────────────────────────────────────────────────────────────
// RouteCard (Spec §6.3). Whole card links to detail; the heart is an
// independently-tappable control (stops propagation). Route name is the one
// place truncation is allowed (single line, ellipsis). Fare uses tabular
// figures in Plus Jakarta Sans 800 — never Danfo.
// ─────────────────────────────────────────────────────────────────────────────

export default function RouteCard({ route }: { route: Route }) {
  const isSaved = useSavedRoutes((s) => s.isSaved(route.id));
  const toggle = useSavedRoutes((s) => s.toggle);
  const accent = vehicleAccent(route.vehicle);
  const fare = totalFare(route.stops);

  function onHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(route);
  }

  return (
    <Link
      href={`/routes/${route.id}`}
      prefetch
      aria-label={`${route.name}, ${formatFare(fare)} end to end`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-card border border-line bg-ink-2 p-4 transition-colors hover:bg-ink-3"
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      {/* left accent stripe by vehicle */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent }}
      />

      {/* icon tile */}
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input border border-line bg-ink-3"
        style={{ borderRadius: 'var(--radius-input)' }}
      >
        <VehicleGlyph vehicle={route.vehicle} />
      </span>

      {/* body */}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[15px] font-bold text-cream">
            {route.name}
          </span>
          <span className="shrink-0">
            <StatusBadge status={route.status} />
          </span>
        </span>
        <span className="mt-1 block text-[13px] text-muted">
          {routeMeta(route.vehicle, route.stops, route.duration_min)}
        </span>
      </span>

      {/* right column: fare (top) + heart (bottom), both independently legible */}
      <span className="flex shrink-0 flex-col items-end gap-2 self-stretch">
        <span className="tnum text-[16px] font-extrabold leading-none text-yellow">
          {formatFare(fare)}
        </span>
        <button
          type="button"
          onClick={onHeart}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${route.name} from saved` : `Save ${route.name}`}
          className="-m-2 flex h-9 w-9 items-center justify-center rounded-full p-2 transition-transform hover:scale-110"
          style={{ color: isSaved ? 'var(--stop)' : 'var(--faint)' }}
        >
          <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={isSaved ? 0 : 2} />
        </button>
      </span>
    </Link>
  );
}
