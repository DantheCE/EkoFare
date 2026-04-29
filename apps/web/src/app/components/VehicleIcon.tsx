"use client";

import type { VehicleType } from "@ekofare/types";

// ─────────────────────────────────────────────────────────────────────────────
// VehicleIcon — colored inline SVG for each Lagos transit type.
// Props:
//   vehicle — one of the 6 VehicleType values
//   size    — rendered at size×size px (default 40, per SPEC §4.6)
// ─────────────────────────────────────────────────────────────────────────────

interface VehicleIconProps {
  vehicle: VehicleType;
  size?: number;
}

// Token colors from SPEC §4.1
const COLORS: Record<VehicleType, { primary: string; dark: string }> = {
  danfo:  { primary: "#F4B41A", dark: "#D69A0F" },
  brt:    { primary: "#1E88E5", dark: "#1565C0" },
  keke:   { primary: "#E53935", dark: "#C62828" },
  okada:  { primary: "#FB8C00", dark: "#E65100" },
  ferry:  { primary: "#00897B", dark: "#00695C" },
  uber:   { primary: "#1C1A18", dark: "#4A3F35" },
};

// ── SVG Shapes ───────────────────────────────────────────────────────────────

function BusSvg({ primary, dark }: { primary: string; dark: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="4" y="10" width="32" height="20" rx="4" fill={primary} />
      {/* roof */}
      <rect x="6" y="7" width="28" height="5" rx="2" fill={dark} />
      {/* windows */}
      <rect x="8"  y="14" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
      <rect x="17" y="14" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
      <rect x="26" y="14" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
      {/* wheels */}
      <circle cx="11" cy="31" r="4" fill={dark} />
      <circle cx="11" cy="31" r="2" fill="#EAE4DA" />
      <circle cx="29" cy="31" r="4" fill={dark} />
      <circle cx="29" cy="31" r="2" fill="#EAE4DA" />
      {/* door */}
      <rect x="17" y="22" width="6" height="8" rx="1" fill={dark} opacity="0.6" />
    </svg>
  );
}

function ThreeWheelerSvg({ primary, dark }: { primary: string; dark: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* canopy */}
      <path d="M8 20 Q20 8 34 14 L34 24 Q20 28 8 26 Z" fill={primary} />
      {/* body */}
      <rect x="8" y="22" width="26" height="9" rx="3" fill={dark} />
      {/* window */}
      <path d="M10 20 Q20 11 33 15 L33 22 Q20 24 10 23 Z" fill="white" opacity="0.7" />
      {/* front wheel */}
      <circle cx="31" cy="32" r="4" fill={dark} />
      <circle cx="31" cy="32" r="2" fill="#EAE4DA" />
      {/* rear wheels */}
      <circle cx="11" cy="33" r="4" fill={dark} />
      <circle cx="11" cy="33" r="2" fill="#EAE4DA" />
    </svg>
  );
}

function BikeSvg({ primary, dark }: { primary: string; dark: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* wheels */}
      <circle cx="10" cy="28" r="7" stroke={dark} strokeWidth="2.5" fill="none" />
      <circle cx="30" cy="28" r="7" stroke={dark} strokeWidth="2.5" fill="none" />
      {/* hubs */}
      <circle cx="10" cy="28" r="2" fill={primary} />
      <circle cx="30" cy="28" r="2" fill={primary} />
      {/* frame */}
      <path d="M10 28 L20 16 L30 28" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16 L30 28" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 16 L10 28" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
      {/* seat */}
      <rect x="17" y="13" width="8" height="3" rx="1.5" fill={dark} />
      {/* handlebar */}
      <rect x="27" y="16" width="7" height="2.5" rx="1.25" fill={dark} />
    </svg>
  );
}

function BoatSvg({ primary, dark }: { primary: string; dark: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* hull */}
      <path d="M4 24 Q4 32 20 33 Q36 32 36 24 L32 18 L8 18 Z" fill={primary} />
      {/* deck */}
      <rect x="8" y="12" width="24" height="8" rx="2" fill={dark} />
      {/* windows */}
      <rect x="11" y="14" width="5" height="4" rx="1" fill="white" opacity="0.85" />
      <rect x="19" y="14" width="5" height="4" rx="1" fill="white" opacity="0.85" />
      {/* mast */}
      <rect x="19" y="4" width="2.5" height="10" rx="1" fill={dark} />
      {/* wave */}
      <path d="M4 30 Q10 27 16 30 Q22 33 28 30 Q34 27 36 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" fill="none" />
    </svg>
  );
}

function SedanSvg({ primary, dark }: { primary: string; dark: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="3" y="20" width="34" height="10" rx="3" fill={primary} />
      {/* cabin */}
      <path d="M9 20 L13 12 Q20 9 27 12 L31 20 Z" fill={dark} />
      {/* windows */}
      <path d="M14 20 L17 13 L23 13 L26 20 Z" fill="white" opacity="0.8" />
      {/* headlights */}
      <rect x="33" y="22" width="3" height="4" rx="1" fill="#FAEADA" />
      <rect x="4"  y="22" width="3" height="4" rx="1" fill="#EAE4DA" opacity="0.7" />
      {/* wheels */}
      <circle cx="12" cy="31" r="4.5" fill={dark} />
      <circle cx="12" cy="31" r="2"   fill="#EAE4DA" />
      <circle cx="28" cy="31" r="4.5" fill={dark} />
      <circle cx="28" cy="31" r="2"   fill="#EAE4DA" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const SVG_MAP: Record<VehicleType, (c: { primary: string; dark: string }) => React.ReactElement> = {
  danfo:  (c) => <BusSvg {...c} />,
  brt:    (c) => <BusSvg {...c} />,
  keke:   (c) => <ThreeWheelerSvg {...c} />,
  okada:  (c) => <BikeSvg {...c} />,
  ferry:  (c) => <BoatSvg {...c} />,
  uber:   (c) => <SedanSvg {...c} />,
};

export default function VehicleIcon({ vehicle, size = 40 }: VehicleIconProps) {
  const colors = COLORS[vehicle];
  const renderFn = SVG_MAP[vehicle];

  return (
    <span
      aria-label={vehicle}
      role="img"
      style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}
    >
      {renderFn(colors)}
    </span>
  );
}
