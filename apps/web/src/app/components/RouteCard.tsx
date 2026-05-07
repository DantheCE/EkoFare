"use client";

import { Heart } from "lucide-react";
import type { Route } from "@ekofare/types";
import VehicleIcon from "./VehicleIcon";
import { useSavedRoutesStore } from "../../stores/savedRoutesStore";
import { formatFare, formatDuration, getVehicleLabel } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// RouteCard
// White card (14px radius, grey-100 border) used on Home, RouteList, Saved.
// Shows: VehicleIcon · Route name · meta · total fare · heart toggle.
// ─────────────────────────────────────────────────────────────────────────────

interface RouteCardProps {
  route: Route;
  /** Optional click handler for the card body (used on RouteList to navigate). */
  onClick?: () => void;
}

export default function RouteCard({ route, onClick }: RouteCardProps) {
  const { isRouteSaved, addRoute, removeRoute } = useSavedRoutesStore();
  const saved = isRouteSaved(route.id);

  const totalFare = route.stops.reduce((sum, s) => sum + s.leg_fare, 0);
  const stopCount = route.stops.length - 1; // exclude origin from count

  function handleHeartClick(e: React.MouseEvent) {
    // Prevent the card's onClick from firing when toggling save
    e.stopPropagation();
    if (saved) {
      removeRoute(route.id);
    } else {
      addRoute(route);
    }
  }

  return (
    <article
      onClick={onClick}
      style={{
        background: "var(--white)",
        border: "1px solid var(--grey-100)",
        borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 4px 16px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 8px rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
      aria-label={`${route.name} route, ${formatFare(totalFare)}`}
    >
      {/* ── Vehicle icon tile (40×40) ── */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "10px",
          background: "var(--off-white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: "1px solid var(--grey-100)",
        }}
      >
        <VehicleIcon vehicle={route.vehicle} size={32} />
      </div>

      {/* ── Route info (name + meta) ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--grey-900)",
            lineHeight: 1.3,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {route.name}
        </p>

        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 400,
            fontSize: "13px",
            color: "var(--grey-500)",
            margin: "4px 0 0",
            lineHeight: 1.4,
          }}
        >
          {getVehicleLabel(route.vehicle)}
          <span style={{ margin: "0 5px", opacity: 0.5 }}>·</span>
          {stopCount} stop{stopCount !== 1 ? "s" : ""}
          <span style={{ margin: "0 5px", opacity: 0.5 }}>·</span>
          ~{formatDuration(route.duration_min)}
        </p>
      </div>

      {/* ── Fare + Heart ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            color: "var(--green-800)",
            lineHeight: 1,
          }}
        >
          {formatFare(totalFare)}
        </span>

        <button
          onClick={handleHeartClick}
          aria-label={saved ? `Remove ${route.name} from saved routes` : `Save ${route.name}`}
          aria-pressed={saved}
          style={{
            background: "none",
            border: "none",
            padding: "13px",
            margin: "-9px",
            cursor: "pointer",
            color: saved ? "var(--terra-700)" : "var(--grey-500)",
            transition: "color 150ms ease, transform 150ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--terra-700)";
            (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = saved
              ? "var(--terra-700)"
              : "var(--grey-500)";
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.outline =
              "2px solid var(--green-800)";
            (e.currentTarget as HTMLElement).style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.outline = "none";
          }}
        >
          <Heart
            size={18}
            fill={saved ? "currentColor" : "none"}
            strokeWidth={saved ? 0 : 2}
          />
        </button>
      </div>
    </article>
  );
}
