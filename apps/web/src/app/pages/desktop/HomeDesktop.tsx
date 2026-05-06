"use client";

import { useState } from "react";
import { Mic, Search, ArrowRight, TrendingUp, Clock, ChevronRight } from "lucide-react";
import type { VehicleType } from "@ekofare/types";
import { useRoutes } from "../../../hooks/useRoutes";
import RouteCard from "../../components/RouteCard";
import { RouteCardSkeleton, Skeleton } from "../../components/Skeleton";
import { getGreetingWithName } from "../../../utils/helpers";
import VehicleIcon from "../../components/VehicleIcon";

type Filter = "all" | VehicleType;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Danfo", value: "danfo" },
  { label: "BRT", value: "brt" },
  { label: "Keke", value: "keke" },
];

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Skeleton width={36} height={36} borderRadius="18px" />
          <Skeleton width={120} height={14} />
        </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "18px",
            background: "var(--green-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <VehicleIcon vehicle="danfo" size={20} />
        </div>
        <div>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--grey-900)",
              display: "block",
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              color: "var(--grey-500)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "2px",
            }}
          >
            <Clock size={12} /> 45 min
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        <ChevronRight size={16} color="var(--grey-300)" />
      </div>
    </div>
  );
}

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function HomeDesktop({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {
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
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 40px",
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "40px",
        }}
      >
        {/* Left Column (2 cols logically, acting as main) */}
        <div>
          {/* Greeting */}
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "16px",
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
              fontSize: "56px",
              lineHeight: 1.15,
              color: "var(--grey-900)",
              margin: "0 0 32px",
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
              padding: "0 20px",
              height: "64px",
              marginBottom: "32px",
            }}
          >
            <Search size={20} color="var(--grey-500)" />
            <input
              id="home-desktop-search-input"
              type="search"
              placeholder="Search a route or stop…"
              aria-label="Search routes"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "16px",
                color: "var(--grey-100)",
              }}
            />
            <button
              aria-label="Search by voice"
              style={{
                background: "none",
                border: "none",
                padding: "8px",
                cursor: "pointer",
                color: "var(--grey-500)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Filter pills */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            {FILTERS.map(({ label, value }) => {
              const isActive = activeFilter === value;
              return (
                <button
                  key={value}
                  id={`home-desktop-filter-${value}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(value)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "9999px",
                    border: isActive
                      ? "1.5px solid var(--green-800)"
                      : "1.5px solid var(--grey-200, var(--grey-100))",
                    background: isActive ? "var(--green-800)" : "var(--white)",
                    color: isActive ? "var(--white)" : "var(--grey-700)",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "14px",
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

          {/* Popular Routes */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
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
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--terra-700)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                See all <ArrowRight size={14} />
              </a>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <RouteCardSkeleton />
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
                  gap: "12px",
                  padding: "64px 20px",
                  textAlign: "center",
                  background: "var(--white)",
                  borderRadius: "14px",
                  border: "1px solid var(--grey-100)",
                  gridColumn: "1 / -1",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ fontSize: "48px", color: "var(--grey-300)" }}
                >
                  🔍
                </span>
                <p
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "var(--grey-700)",
                    margin: 0,
                  }}
                >
                  No routes found
                </p>
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "15px",
                    color: "var(--grey-500)",
                    margin: 0,
                  }}
                >
                  Try a different search or filter
                </p>
              </div>
            )}

            {/* Populated state */}
            {!isLoading && popularRoutes.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                {popularRoutes.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div style={{ paddingTop: "56px" /* pt-14 = 56px */ }}>
          {/* Trending Now */}
          <section style={{ marginBottom: "24px" }}>
            <div
              style={{
                background: "linear-gradient(160deg, var(--green-800), var(--green-900))",
                borderRadius: "16px",
                padding: "24px",
                color: "var(--white)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    padding: "4px 8px",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <TrendingUp size={12} /> Trending now
                </span>
              </div>
              
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: "20px",
                  margin: "0 0 6px",
                }}
              >
                CMS → Lekki Phase 1
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  opacity: 0.85,
                  margin: "0 0 20px",
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
                    fontSize: "28px",
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
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--white)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 150ms ease",
                  }}
                >
                  View route <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* Recently Viewed */}
          <section>
            <div
              style={{
                background: "var(--white)",
                borderRadius: "14px",
                border: "1px solid var(--grey-100)",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "var(--grey-900)",
                  margin: "0 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
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
      </div>
    </div>
  );
}
