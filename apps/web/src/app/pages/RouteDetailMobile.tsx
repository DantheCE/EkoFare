"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin, ArrowDownUp } from "lucide-react";
import { useRoute } from "../../hooks/useRoutes";
import { useStopSelection } from "../../hooks/useStopSelection";
import { StopRowSkeleton, LoadingPill } from "../components/Skeleton";
import { getVehicleLabel, formatDuration, calculateFare, formatFare } from "../../utils/helpers";
import VehicleIcon from "../components/VehicleIcon";

interface RouteDetailMobileProps {
  id: string;
}

export default function RouteDetailMobile({ id }: RouteDetailMobileProps) {
  const router = useRouter();
  const { data: route, isLoading, isError, refetch } = useRoute(id);

  const {
    originIdx,
    destIdx,
    isReversed,
    handleStopTap,
    handleReverse,
  } = useStopSelection();

  // --- RENDERING HELPERS ---

  const renderHeader = () => {
    return (
      <header
        style={{
          background: "var(--green-800)",
          padding: "48px 20px 32px",
          borderRadius: "0 0 24px 24px",
          color: "var(--white)",
          position: "relative",
          zIndex: 10,
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

        {isLoading ? (
          <div>
            <div style={{ width: "60%", height: "24px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ width: "80px", height: "28px", background: "rgba(255,255,255,0.2)", borderRadius: "9999px" }} />
              <div style={{ width: "80px", height: "28px", background: "rgba(255,255,255,0.2)", borderRadius: "9999px" }} />
            </div>
          </div>
        ) : route ? (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "16px" }}>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: "24px",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {route.name}
              </h1>
              <button
                onClick={handleReverse}
                aria-label="Reverse route"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "var(--white)",
                  padding: "12px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "transform 200ms ease",
                }}
              >
                <ArrowDownUp size={20} />
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* Meta Pill: Vehicle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <VehicleIcon vehicle={route.vehicle} size={16} />
                {getVehicleLabel(route.vehicle)}
              </div>
              {/* Meta Pill: Stops */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <MapPin size={14} />
                {route.stops.length - 1} stops
              </div>
              {/* Meta Pill: Duration */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <Clock size={14} />
                ~{formatDuration(route.duration_min)}
              </div>
            </div>
          </div>
        ) : (
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "24px", margin: 0 }}>
            Route Not Found
          </h1>
        )}
      </header>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ position: "relative", padding: "32px 20px" }}>
          <div
            style={{
              position: "absolute",
              top: "32px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
            }}
          >
            <LoadingPill />
          </div>
          <div style={{ display: "flex", flexDirection: "column", opacity: 0.5 }}>
            <StopRowSkeleton />
            <StopRowSkeleton />
            <StopRowSkeleton />
            <StopRowSkeleton />
            <StopRowSkeleton />
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--grey-900)" }}>
            Something went wrong
          </p>
          <button
            onClick={() => refetch()}
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
            Retry
          </button>
        </div>
      );
    }

    if (!route) {
      return (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "18px", color: "var(--grey-700)" }}>
            We couldn&apos;t find the route you are looking for.
          </p>
        </div>
      );
    }

    const displayStops = isReversed ? [...route.stops].reverse() : route.stops;

    return (
      <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column" }}>
        {displayStops.map((stop, i) => {
          const isOrigin = originIdx === i;
          const isDest = destIdx === i;
          const isSelected = originIdx !== null && destIdx !== null && i >= originIdx && i <= destIdx;
          const isHighlighted = isOrigin || isDest || isSelected;
          const isLineHighlighted = originIdx !== null && destIdx !== null && i >= originIdx && i < destIdx;
          const isLast = i === displayStops.length - 1;

          return (
            <div
              key={`${stop.id}-${i}`}
              onClick={() => handleStopTap(i)}
              style={{
                display: "flex",
                gap: "16px",
                cursor: "pointer",
                minHeight: "60px",
              }}
            >
              {/* Timeline Graphic */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px" }}>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: isHighlighted ? "4px solid var(--green-800)" : "2px solid var(--grey-300)",
                    backgroundColor: "var(--white)",
                    flexShrink: 0,
                    transition: "all 150ms ease",
                    marginTop: "2px",
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: "2px",
                      flex: 1,
                      backgroundColor: isLineHighlighted ? "var(--green-800)" : "var(--grey-200)",
                      transition: "all 150ms ease",
                      margin: "4px 0",
                    }}
                  />
                )}
              </div>

              {/* Stop Info */}
              <div style={{ flex: 1, paddingBottom: "24px" }}>
                <p
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontWeight: isHighlighted ? 700 : 500,
                    fontSize: "16px",
                    color: isHighlighted ? "var(--grey-900)" : "var(--grey-600)",
                    margin: "0 0 4px 0",
                    transition: "all 150ms ease",
                  }}
                >
                  {stop.name}
                </p>
                {isOrigin && (
                  <span style={{ fontSize: "12px", color: "var(--green-800)", fontWeight: 700 }}>
                    Origin
                  </span>
                )}
                {isDest && (
                  <span style={{ fontSize: "12px", color: "var(--terra-700)", fontWeight: 700 }}>
                    Destination
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFareDock = () => {
    if (originIdx === null || destIdx === null || !route) return null;

    const displayStops = isReversed ? [...route.stops].reverse() : route.stops;
    const totalFare = calculateFare(displayStops, originIdx, destIdx);
    const originName = displayStops[originIdx].name;
    const destName = displayStops[destIdx].name;

    const handleShareTrip = () => {
      const url = `/routes/${route.id}/fare?origin=${originIdx}&dest=${destIdx}${isReversed ? '&reversed=1' : ''}`;
      router.push(url);
    };

    return (
      <div
        style={{
          position: "fixed",
          bottom: "64px",
          left: 0,
          right: 0,
          padding: "16px 20px",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "var(--white)",
            borderRadius: "16px",
            padding: "16px 20px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
            border: "1px solid var(--grey-100)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "var(--grey-500)",
                  margin: "0 0 4px 0",
                }}
              >
                Total Fare
              </p>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: "20px",
                  color: "var(--green-800)",
                  margin: 0,
                }}
              >
                {formatFare(totalFare)}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "var(--grey-900)",
                  margin: "0 0 4px 0",
                  maxWidth: "140px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {originName}
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "var(--grey-500)",
                  margin: 0,
                  maxWidth: "140px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                to {destName}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleShareTrip}
            style={{
              background: "var(--green-800)",
              color: "var(--white)",
              border: "none",
              borderRadius: "10px",
              padding: "0 12px",
              minHeight: "44px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Share trip
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px", // clearance above bottom nav
      }}
    >
      {renderHeader()}
      <main>{renderContent()}</main>
      {renderFareDock()}
    </div>
  );
}


