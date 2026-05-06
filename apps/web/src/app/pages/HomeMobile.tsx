"use client";

import { useState } from "react";
import { Mic, Search, ArrowRight } from "lucide-react";
import type { VehicleType } from "@ekofare/types";
import { useRoutes } from "../../hooks/useRoutes";
import RouteCard from "../components/RouteCard";
import { RouteCardSkeleton, Skeleton } from "../components/Skeleton";
import { getGreetingWithName } from "../../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Filter = "all" | VehicleType;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Danfo", value: "danfo" },
  { label: "BRT", value: "brt" },
  { label: "Keke", value: "keke" },
];

// ─────────────────────────────────────────────────────────────────────────────
// RecentlyViewedRow — shimmer row or real item
// ─────────────────────────────────────────────────────────────────────────────

function RecentlyViewedRow({
  isLoading,
  name,
  fare,
}: {
  isLoading: boolean;
  name?: string;
  fare?: string;
}) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
          borderBottom: "1px solid var(--grey-100)",
        }}
      >
        <Skeleton width="50%" height={14} />
        <Skeleton width={48} height={14} borderRadius="8px" />
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--grey-100)",
      }}
    >
      <span
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "14px",
          color: "var(--grey-700)",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: "13px",
          color: "var(--green-800)",
        }}
      >
        {fare}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeMobile — primary mobile layout (<1024px)
// ─────────────────────────────────────────────────────────────────────────────

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function HomeMobile({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const { data: routesQuery, isLoading: queryLoading } = useRoutes(activeFilter);
  const isLoading = forceLoading ?? queryLoading;
  const routes = forceEmpty ? [] : routesQuery;

  const greeting = getGreetingWithName();
  const popularRoutes = routes?.slice(0, 4) ?? [];

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px", // clearance above bottom nav
      }}
    >
      {/* ── Top bar ── */}
      <div style={{ padding: "24px 20px 0" }}>
        {/* Greeting */}
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--grey-500)",
            margin: "0 0 6px",
          }}
        >
          {greeting}
        </p>

        {/* Hero */}
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "40px",
            lineHeight: 1.15,
            color: "var(--grey-900)",
            margin: "0 0 20px",
          }}
        >
          Where are you{" "}
          <strong
            style={{
              fontWeight: 700,
              color: "var(--green-800)",
            }}
          >
            headed today?
          </strong>
        </h1>

        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--grey-900)",
            borderRadius: "14px",
            padding: "0 16px",
            height: "52px",
          }}
        >
          <Search size={18} color="var(--grey-500)" />
          <input
            id="home-search-input"
            type="search"
            placeholder="Search a route or stop…"
            aria-label="Search routes"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "15px",
              color: "var(--grey-100)",
            }}
          />
          <button
            aria-label="Search by voice"
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "var(--grey-500)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Mic size={18} />
          </button>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "16px 20px 0",
          // Hide scrollbar but keep functionality
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {FILTERS.map(({ label, value }) => {
          const isActive = activeFilter === value;
          return (
            <button
              key={value}
              id={`home-filter-${value}`}
              aria-pressed={isActive}
              onClick={() => setActiveFilter(value)}
              style={{
                flexShrink: 0,
                padding: "8px 18px",
                borderRadius: "9999px",
                border: isActive
                  ? "1.5px solid var(--green-800)"
                  : "1.5px solid var(--grey-200, var(--grey-100))",
                background: isActive ? "var(--green-800)" : "var(--white)",
                color: isActive ? "var(--white)" : "var(--grey-700)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Popular Routes ── */}
      <section style={{ padding: "24px 20px 0" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <h2
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "var(--grey-900)",
              margin: 0,
            }}
          >
            Popular Routes
          </h2>
          <a
            href="/routes"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--terra-700)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            See all <ArrowRight size={13} />
          </a>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <RouteCardSkeleton />
            <RouteCardSkeleton />
            <RouteCardSkeleton />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && popularRoutes.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <span
              aria-hidden="true"
              style={{ fontSize: "40px", color: "var(--grey-300)" }}
            >
              🔍
            </span>
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--grey-700)",
                margin: 0,
              }}
            >
              No routes found
            </p>
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                color: "var(--grey-500)",
                margin: 0,
              }}
            >
              Try searching above
            </p>
          </div>
        )}

        {/* Populated state */}
        {!isLoading && popularRoutes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {popularRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </section>

      {/* ── Trending Now ── */}
      <section style={{ padding: "24px 20px 0" }}>
        <div
          style={{
            background: "linear-gradient(135deg, var(--green-800) 0%, var(--green-600) 100%)",
            borderRadius: "16px",
            padding: "20px",
            color: "var(--white)",
          }}
        >
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.75,
              margin: "0 0 6px",
            }}
          >
            Trending now
          </p>
          <p
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              margin: "0 0 4px",
            }}
          >
            CMS → Lekki Phase 1
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              opacity: 0.8,
              margin: "0 0 14px",
            }}
          >
            Danfo · 4 stops · ~45 min
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: "24px",
              }}
            >
              ₦700
            </span>
            <button
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "10px",
                padding: "8px 16px",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--white)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              View route <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Recently Viewed ── */}
      <section style={{ padding: "24px 20px 0" }}>
        <div
          style={{
            background: "var(--white)",
            borderRadius: "14px",
            border: "1px solid var(--grey-100)",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--grey-900)",
              margin: "0 0 4px",
            }}
          >
            Recently viewed
          </h2>

          <div>
            {isLoading ? (
              <>
                <RecentlyViewedRow isLoading />
                <RecentlyViewedRow isLoading />
                <RecentlyViewedRow isLoading />
              </>
            ) : (
              <>
                <RecentlyViewedRow
                  isLoading={false}
                  name="CMS → Lekki Phase 1"
                  fare="₦700"
                />
                <RecentlyViewedRow
                  isLoading={false}
                  name="Oshodi → Ajah"
                  fare="₦500"
                />
                <RecentlyViewedRow
                  isLoading={false}
                  name="Ikeja → Victoria Island"
                  fare="₦450"
                />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
