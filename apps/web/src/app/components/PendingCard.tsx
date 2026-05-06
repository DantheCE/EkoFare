"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useVerificationStore } from "../../stores/verificationStore";
import { useInvalidateContributions } from "../../hooks/useContributions";
import { confirmContribution, disputeContribution } from "../../api/axios";
import VehicleIcon from "./VehicleIcon";
import type { Contribution } from "@ekofare/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function totalFare(contribution: Contribution): number {
  return contribution.stops_data.reduce(
    (sum, s) => sum + (s.fare_from_previous ?? 0),
    0
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmationsBar
// ─────────────────────────────────────────────────────────────────────────────

export function ConfirmationsBar({ count, total = 3 }: { count: number; total?: number }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "6px" }}
      aria-label={`${count} of ${total} confirmations`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "9999px",
            background: i < count ? "var(--green-600)" : "var(--grey-200)",
            transition: "background 200ms ease",
          }}
        />
      ))}
      <span
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--grey-500)",
          marginLeft: "2px",
        }}
      >
        {count}/{total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop Breakdown
// ─────────────────────────────────────────────────────────────────────────────

export function StopBreakdown({ contribution }: { contribution: Contribution }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--grey-100)",
        marginTop: "12px",
        paddingTop: "16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {contribution.stops_data.map((stop, i) => {
        const isLast = i === contribution.stops_data.length - 1;
        return (
          <div
            key={i}
            style={{ display: "flex", gap: "14px", minHeight: "52px" }}
          >
            {/* Timeline graphic */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "20px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: i === 0 ? "4px solid var(--green-800)" : "3px solid var(--grey-300)",
                  backgroundColor: "var(--white)",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: "2px",
                    flex: 1,
                    backgroundColor: "var(--grey-200)",
                    margin: "4px 0",
                  }}
                />
              )}
            </div>

            {/* Stop info */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : "12px" }}>
              <p
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: i === 0 ? 700 : 500,
                  fontSize: "14px",
                  color: i === 0 ? "var(--grey-900)" : "var(--grey-700)",
                  margin: "0 0 2px",
                }}
              >
                {stop.name || `Stop ${i + 1}`}
              </p>
              {i > 0 && stop.fare_from_previous > 0 && (
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "12px",
                    color: "var(--green-800)",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  +₦{stop.fare_from_previous.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PendingCard
// ─────────────────────────────────────────────────────────────────────────────

interface PendingCardProps {
  contribution: Contribution;
  deviceId: string;
  onAnimateOut: (id: string) => void;
}

export default function PendingCard({ contribution, deviceId, onAnimateOut }: PendingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [voting, setVoting] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const getVote = useVerificationStore((s) => s.getVote);
  const castVote = useVerificationStore((s) => s.castVote);
  const invalidate = useInvalidateContributions();

  const myVote = getVote(contribution.id);
  const hasVoted = myVote !== null;

  const fare = totalFare(contribution);
  const stopCount = contribution.stops_data.length - 1;

  async function handleVote(type: "confirm" | "dispute") {
    if (hasVoted || voting) return;
    setVoting(true);
    try {
      if (type === "confirm") {
        const res = await confirmContribution(contribution.id, deviceId);
        castVote(contribution.id, "confirm");
        await invalidate();
        if (res.isVerified) {
          triggerRemoveAnimation("✅ Promoted to verified routes");
        }
      } else {
        const res = await disputeContribution(contribution.id, deviceId);
        castVote(contribution.id, "dispute");
        await invalidate();
        // Check disputes threshold in localStorage
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("ekofare.pending");
            const pending = raw ? JSON.parse(raw) : [];
            const found = pending.find((c: Contribution) => c.id === contribution.id);
            if (found?.status === "rejected") {
              triggerRemoveAnimation("❌ Submission rejected");
              return;
            }
          } catch { /* ignore */ }
        }
        void res;
      }
    } finally {
      setVoting(false);
    }
  }

  function triggerRemoveAnimation(toastMsg: string) {
    setAnimatingOut(true);
    setTimeout(() => {
      toast(toastMsg);
      onAnimateOut(contribution.id);
    }, 300);
  }

  return (
    <div
      style={{
        background: "var(--white)",
        borderRadius: "16px",
        border: "1px solid var(--grey-100)",
        overflow: "hidden",
        opacity: animatingOut ? 0 : 1,
        transform: animatingOut ? "translateY(12px)" : "translateY(0)",
        transition: "opacity 300ms ease, transform 300ms ease",
      }}
    >
      <button
        type="button"
        id={`pending-card-${contribution.id}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          width: "100%",
          padding: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "var(--green-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <VehicleIcon vehicle={contribution.vehicle} size={26} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "var(--grey-900)",
              margin: "0 0 4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contribution.route_name}
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "var(--grey-500)",
              margin: "0 0 6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={12} />
              {stopCount} {stopCount === 1 ? "stop" : "stops"}
            </span>
            <span style={{ color: "var(--grey-300)" }}>·</span>
            <span>~₦{fare.toLocaleString()}</span>
            <span style={{ color: "var(--grey-300)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} />
              submitted {formatRelativeTime(contribution.created_at)}
            </span>
          </p>
          <ConfirmationsBar count={contribution.confirmations} />
        </div>

        <div style={{ color: "var(--grey-400)", flexShrink: 0, marginTop: "2px" }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {contribution.notes && (
        <blockquote
          style={{
            margin: "0 16px 12px",
            padding: "10px 14px",
            borderLeft: "3px solid var(--green-200)",
            background: "var(--cream)",
            borderRadius: "0 8px 8px 0",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontStyle: "italic",
            color: "var(--grey-600)",
            lineHeight: 1.5,
          }}
        >
          {contribution.notes}
        </blockquote>
      )}

      {expanded && (
        <div style={{ padding: "0 16px" }}>
          <StopBreakdown contribution={contribution} />
        </div>
      )}

      <div
        style={{
          padding: "12px 16px 16px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        {hasVoted ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "9999px",
              background: myVote === "confirm" ? "var(--green-100)" : "var(--grey-100)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: myVote === "confirm" ? "var(--green-800)" : "var(--grey-600)",
            }}
            role="status"
            aria-label={myVote === "confirm" ? "You confirmed this" : "You disputed this"}
          >
            {myVote === "confirm" ? "✓ You confirmed this" : "✗ You disputed this"}
          </div>
        ) : (
          <>
            <button
              id={`confirm-btn-${contribution.id}`}
              type="button"
              onClick={() => handleVote("confirm")}
              disabled={voting}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "10px",
                background: "var(--green-800)",
                color: "var(--white)",
                border: "none",
                cursor: voting ? "not-allowed" : "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                opacity: voting ? 0.7 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              Confirm
            </button>
            <button
              id={`dispute-btn-${contribution.id}`}
              type="button"
              onClick={() => handleVote("dispute")}
              disabled={voting}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "10px",
                background: "transparent",
                color: "var(--grey-700)",
                border: "1px solid var(--grey-200)",
                cursor: voting ? "not-allowed" : "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                opacity: voting ? 0.7 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              Dispute
            </button>
          </>
        )}
      </div>
    </div>
  );
}
