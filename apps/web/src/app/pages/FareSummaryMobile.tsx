"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Share, Link as LinkIcon } from "lucide-react";
import { useRoute } from "../../hooks/useRoutes";
import { formatFare, getVehicleLabel } from "../../utils/helpers";
import VehicleIcon from "../components/VehicleIcon";
import { useSavedRoutesStore } from "../../store/useSavedRoutesStore";
import { toast } from "sonner";

interface FareSummaryMobileProps {
  id: string;
}

export default function FareSummaryMobile({ id }: FareSummaryMobileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originStr = searchParams.get("origin");
  const destStr = searchParams.get("dest");
  const reversedStr = searchParams.get("reversed");

  const originIdx = originStr ? parseInt(originStr, 10) : null;
  const destIdx = destStr ? parseInt(destStr, 10) : null;
  const isReversed = reversedStr === "1";

  const { data: route, isLoading, isError } = useRoute(id);

  const { toggleRoute, isSaved } = useSavedRoutesStore();

  if (isLoading) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (isError || !route || originIdx === null || destIdx === null) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--grey-900)" }}>
          Invalid route or parameters.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: "16px",
            background: "var(--green-800)",
            color: "var(--white)",
            border: "none",
            borderRadius: "10px",
            padding: "0 24px",
            minHeight: "44px",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const baseStops = route.stops;
  const displayStops = isReversed ? [...baseStops].reverse() : baseStops;

  // For the selected legs, we need to show leg-by-leg.
  // A "leg" is from stop `i` to stop `i+1`.
  // The leg's fare is the `leg_fare` of the DESTINATION stop.
  // Origin stop has leg_fare = 0 (or at least, its leg_fare isn't added).
  const legs = [];
  let totalFare = 0;

  for (let i = originIdx; i < destIdx; i++) {
    const fromStop = displayStops[i];
    const toStop = displayStops[i + 1];
    const legFare = toStop.leg_fare;
    totalFare += legFare;
    legs.push({
      from: fromStop.name,
      to: toStop.name,
      fare: legFare,
    });
  }

  const originName = displayStops[originIdx].name;
  const destName = displayStops[destIdx].name;

  const saveKey = `${id}-${originIdx}-${destIdx}-${isReversed ? "rev" : "fwd"}`;
  const saved = isSaved(saveKey);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = () => {
    toast.success("Share dialog opened!"); // stub
  };

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px",
      }}
    >
      <header
        style={{
          padding: "48px 20px 32px",
          background: "var(--green-800)",
          color: "var(--white)",
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--white)",
            padding: "10px",
            margin: "-10px",
            cursor: "pointer",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "var(--grey-200)",
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Fare
          </p>
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: "48px",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {formatFare(totalFare)}
          </h1>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "15px",
              color: "var(--white)",
              marginTop: "16px",
            }}
          >
            <strong>{originName}</strong> &rarr; <strong>{destName}</strong>
          </p>
        </div>
      </header>

      <main style={{ padding: "32px 20px" }}>
        {/* Action Row */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <button
            onClick={() => toggleRoute(saveKey)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "var(--white)",
              border: "1px solid var(--grey-200)",
              borderRadius: "10px",
              padding: "0 12px",
              minHeight: "44px",
              flex: 1,
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--grey-900)",
              cursor: "pointer",
            }}
          >
            <Heart
              size={18}
              fill={saved ? "var(--terra-700)" : "transparent"}
              color={saved ? "var(--terra-700)" : "var(--grey-900)"}
            />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "var(--green-800)",
              border: "none",
              borderRadius: "10px",
              padding: "0 12px",
              minHeight: "44px",
              flex: 1,
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--white)",
              cursor: "pointer",
            }}
          >
            <Share size={18} />
            Share trip
          </button>
          <button
            onClick={handleCopyLink}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "transparent",
              border: "1px solid var(--grey-300)",
              borderRadius: "10px",
              padding: "0 12px",
              minHeight: "44px",
              flex: 1,
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--grey-900)",
              cursor: "pointer",
            }}
          >
            <LinkIcon size={18} />
            Copy link
          </button>
        </div>

        {/* Leg-by-leg Table */}
        <div
          style={{
            background: "var(--white)",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid var(--grey-200)",
          }}
        >
          <div
            style={{
              background: "var(--grey-50)",
              padding: "16px",
              borderBottom: "1px solid var(--grey-200)",
            }}
          >
            <h3
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                margin: 0,
                color: "var(--grey-900)",
              }}
            >
              Trip Breakdown
            </h3>
          </div>
          <div>
            {legs.map((leg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: index % 2 === 0 ? "var(--off-white, #FAFAFA)" : "var(--white)",
                  borderBottom: index === legs.length - 1 ? "none" : "1px solid var(--grey-100)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      background: "var(--grey-100)",
                      color: "var(--grey-600)",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <VehicleIcon vehicle={route.vehicle} size={14} />
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--grey-500)",
                        }}
                      >
                        {getVehicleLabel(route.vehicle)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--grey-900)",
                        margin: 0,
                      }}
                    >
                      {leg.from} &rarr; {leg.to}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--green-800)",
                  }}
                >
                  +{formatFare(leg.fare)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
