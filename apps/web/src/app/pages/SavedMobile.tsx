"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useSavedRoutesStore } from "../../stores/savedRoutesStore";
import RouteCard from "../components/RouteCard";
import { useRouter } from "next/navigation";

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function SavedMobile({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {
  const router = useRouter();
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
          paddingBottom: "88px",
        }}
      />
    );
  }

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px", // clearance above bottom nav
      }}
    >
      <div style={{ padding: "32px 20px 24px" }}>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "24px",
            color: "var(--grey-900)",
            margin: "0",
          }}
        >
          Saved Routes
        </h1>
      </div>

      <section style={{ padding: "0 20px" }}>
        {savedRoutes.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              padding: "48px 0",
              textAlign: "center",
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
                maxWidth: "280px",
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
                width: "100%",
                maxWidth: "280px",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {savedRoutes.map((route) => (
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
