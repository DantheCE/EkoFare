"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { VehicleType } from "@ekofare/types";
import { useRoutes } from "../../../hooks/useRoutes";
import RouteCard from "../../components/RouteCard";
import { RouteCardSkeleton } from "../../components/Skeleton";

type Filter = "all" | VehicleType;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Danfo", value: "danfo" },
  { label: "BRT", value: "brt" },
  { label: "Keke", value: "keke" },
];

export default function RouteListDesktop() {
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

  const { data: routes, isLoading, isError, refetch } = useRoutes(
    activeFilter,
    debouncedSearch
  );

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px", // clearance
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px",
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          gap: "40px",
        }}
      >
        {/* Main Content Area */}
        <div>
          {/* Eyebrow & Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--grey-500)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Browse
              </span>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: "44px",
                  color: "var(--grey-900)",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Find Your Route
              </h1>
            </div>
            {!isLoading && !isError && routes && (
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  color: "var(--grey-500)",
                  fontWeight: 500,
                }}
              >
                {routes.length} routes
              </span>
            )}
          </div>

          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--white)",
              borderRadius: "14px",
              padding: "0 20px",
              height: "64px",
              marginBottom: "32px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid var(--grey-100)",
            }}
          >
            <Search size={20} color="var(--grey-500)" />
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
                fontSize: "16px",
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
                  padding: "8px",
                  cursor: "pointer",
                  color: "var(--grey-500)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* States Rendering */}
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

          {isError && (
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
              }}
            >
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
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
                  padding: "10px 24px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
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
                gap: "12px",
                padding: "64px 20px",
                textAlign: "center",
                background: "var(--white)",
                borderRadius: "14px",
                border: "1px solid var(--grey-100)",
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

          {!isLoading && !isError && routes && routes.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {routes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </div>

        {/* Right Sticky Filter Panel */}
        <div>
          <div
            style={{
              position: "sticky",
              top: "24px",
              background: "var(--white)",
              borderRadius: "14px",
              border: "1px solid var(--grey-100)",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--grey-900)",
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Vehicle
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {FILTERS.map(({ label, value }) => {
                const isActive = activeFilter === value;
                return (
                  <button
                    key={value}
                    aria-pressed={isActive}
                    onClick={() => setActiveFilter(value)}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "none",
                      background: isActive ? "var(--green-100)" : "transparent",
                      color: isActive ? "var(--green-800)" : "var(--grey-700)",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "15px",
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
