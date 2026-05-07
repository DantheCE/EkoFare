"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { VehicleType } from "@ekofare/types";
import { useRoutes } from "../../hooks/useRoutes";
import RouteCard from "../components/RouteCard";
import { RouteCardSkeleton } from "../components/Skeleton";
import { useRouter } from "next/navigation";

type Filter = "all" | VehicleType;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Danfo", value: "danfo" },
  { label: "BRT", value: "brt" },
  { label: "Keke", value: "keke" },
];

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function RouteListMobile({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty }: DevProps = {}) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: routesQuery, isLoading: queryLoading, isError: queryError, refetch } = useRoutes(activeFilter, debouncedSearch);
  const isLoading = forceLoading ?? queryLoading;
  const isError = forceError ?? queryError;
  const routes = forceEmpty ? [] : routesQuery;

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px", // clearance above bottom nav
      }}
    >
      <div style={{ padding: "32px 20px 0" }}>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "24px",
            color: "var(--grey-900)",
            margin: "0 0 20px",
          }}
        >
          Find Your Route
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--white)",
            borderRadius: "10px",
            padding: "0 16px",
            height: "52px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Search size={18} color="var(--grey-500)" />
          <input
            type="search"
            placeholder="Search a route or stop…"
            aria-label="Search routes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "15px",
              color: "var(--grey-900)",
            }}
          />
          {searchTerm.trim().length > 0 && (
            <button
              aria-label="Clear search"
              onClick={() => setSearchTerm("")}
              style={{
                background: "none",
                border: "none",
                padding: "13px",
                margin: "-9px",
                cursor: "pointer",
                color: "var(--grey-500)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "16px 20px 0",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {FILTERS.map(({ label, value }) => {
          const isActive = activeFilter === value;
          return (
            <button
              key={value}
              aria-pressed={isActive}
              onClick={() => setActiveFilter(value)}
              style={{
                flexShrink: 0,
                padding: "0 18px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                borderRadius: "9999px",
                border: isActive
                  ? "1.5px solid var(--green-800)"
                  : "1.5px solid var(--grey-200)",
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

      <section style={{ padding: "24px 20px 0" }}>
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <RouteCardSkeleton />
            <RouteCardSkeleton />
            <RouteCardSkeleton />
            <RouteCardSkeleton />
          </div>
        )}

        {isError && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--grey-900)",
                margin: 0,
              }}
            >
              Something went wrong
            </p>
            <button
              onClick={() => refetch()}
              style={{
                background: "var(--green-800)",
                color: "var(--white)",
                border: "none",
                borderRadius: "10px",
                padding: "0 20px",
                minHeight: "44px",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && routes?.length === 0 && (
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
              Try a different search or filter
            </p>
          </div>
        )}

        {!isLoading && !isError && routes && routes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {routes.map((route) => (
              <RouteCard 
                key={route.id} 
                route={route} 
                onClick={() => router.push(`/fare-summary/${route.id}?origin=0&dest=${route.stops.length - 1}&reversed=0`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
