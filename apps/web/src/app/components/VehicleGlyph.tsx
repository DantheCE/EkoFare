import { Bus, Bike, Ship, Car } from 'lucide-react';
import type { Vehicle } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// VehicleGlyph + accent mapping. Accent drives the RouteCard left stripe and
// icon tint (Spec §6.3: Danfo=yellow, BRT=go, Keke=stop; the rest extend the
// same palette without introducing new colours).
// ─────────────────────────────────────────────────────────────────────────────

type Accent = 'yellow' | 'go' | 'stop' | 'muted';

const META: Record<Vehicle, { icon: typeof Bus; accent: Accent }> = {
  DANFO: { icon: Bus, accent: 'yellow' },
  BRT: { icon: Bus, accent: 'go' },
  KEKE: { icon: Bike, accent: 'stop' },
  OKADA: { icon: Bike, accent: 'yellow' },
  FERRY: { icon: Ship, accent: 'go' },
  RIDESHARE: { icon: Car, accent: 'muted' },
};

export const ACCENT_VAR: Record<Accent, string> = {
  yellow: 'var(--yellow)',
  go: 'var(--go)',
  stop: 'var(--stop)',
  muted: 'var(--muted)',
};

export function vehicleAccent(vehicle: Vehicle): string {
  return ACCENT_VAR[META[vehicle].accent];
}

export default function VehicleGlyph({
  vehicle,
  size = 22,
}: {
  vehicle: Vehicle;
  size?: number;
}) {
  const { icon: Icon, accent } = META[vehicle];
  return <Icon size={size} strokeWidth={2} color={ACCENT_VAR[accent]} aria-hidden />;
}
