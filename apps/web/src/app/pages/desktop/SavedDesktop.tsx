"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useSavedRoutesStore } from "../../../stores/savedRoutesStore";
import RouteCard from "../../components/RouteCard";

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function SavedDesktop({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {
  const savedRoutesMap = useSavedRoutesStore((state) => state.savedRoutes);
  const savedRoutes = Object.values(savedRoutesMap);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          background: "var(--cream)",
          minHeight: "100vh",
          padding: "48px 40px",
        }}
      />
    );
  }

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        padding: "48px 40px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "32px",
            color: "var(--grey-900)",
            margin: "0 0 32px",
          }}
        >
          Saved Routes
        </h1>

        <section>
          {savedRoutes.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                padding: "80px 0",
                textAlign: "center",
                background: "var(--white)",
                borderRadius: "16px",
                border: "1px solid var(--grey-100)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed var(--green-200)",
                  borderRadius: "9999px",
                  width: "120px",
                  height: "120px",
                  marginBottom: "8px",
                }}
              >
                <Heart size={48} color="var(--grey-300)" strokeWidth={1.5} />
              </div>

              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "var(--grey-900)",
                  margin: 0,
                }}
              >
                No saved routes yet
              </h2>

              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "var(--grey-500)",
                  margin: "0 0 16px",
                  lineHeight: 1.5,
                  maxWidth: "320px",
                }}
              >
                Tap ♡ on any route to save it here for quick access — handy for
                your daily commute.
              </p>

              <Link
                href="/routes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--green-800)",
                  color: "var(--white)",
                  textDecoration: "none",
                  borderRadius: "10px",
                  padding: "14px 32px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Browse routes
              </Link>

              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "14px",
                  color: "var(--grey-400)",
                  marginTop: "8px",
                }}
              >
                or search for a stop above
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "16px",
              }}
            >
              {savedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
