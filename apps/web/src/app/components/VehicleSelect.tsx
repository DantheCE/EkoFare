'use client';

import { type Vehicle, VEHICLE_LABEL } from '../../types';
import VehicleGlyph from './VehicleGlyph';

// ─────────────────────────────────────────────────────────────────────────────
// VehicleSelect (Spec §3.7). Danfo | BRT | Keke Napep | Okada | Ferry |
// Uber/Bolt. Selected tile = yellow border + tint.
// ─────────────────────────────────────────────────────────────────────────────

const VEHICLES: Vehicle[] = ['DANFO', 'BRT', 'KEKE', 'OKADA', 'FERRY', 'RIDESHARE'];

export default function VehicleSelect({
  value,
  onChange,
}: {
  value: Vehicle;
  onChange: (v: Vehicle) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Vehicle type" className="grid grid-cols-3 gap-2">
      {VEHICLES.map((v) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className="flex flex-col items-center gap-1.5 rounded-input border px-2 py-3 text-[12px] font-semibold transition-colors"
            style={{
              background: active ? 'rgba(255,206,58,0.10)' : 'var(--ink-3)',
              borderColor: active ? 'var(--yellow)' : 'var(--line)',
              color: active ? 'var(--cream)' : 'var(--muted)',
              borderRadius: 'var(--radius-input)',
            }}
          >
            <VehicleGlyph vehicle={v} size={20} />
            {VEHICLE_LABEL[v]}
          </button>
        );
      })}
    </div>
  );
}
