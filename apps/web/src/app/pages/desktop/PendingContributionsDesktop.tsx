"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useContributions } from "../../../hooks/useContributions";
import { useDeviceStore } from "../../../stores/deviceStore";
import PendingCard from "../../components/PendingCard";

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function PendingContributionsDesktop({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {
  const { data: queryContribs = [], isLoading: queryLoading } = useContributions("pending");
  const isLoading = forceLoading ?? queryLoading;
  const contributions = forceEmpty ? [] : queryContribs;
  const deviceId = useDeviceStore((s) => s.deviceId);

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  function handleAnimateOut(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
  }

  const visible = contributions.filter(
    (c) => c.status === "pending" && !removedIds.has(c.id)
  );

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "48px",
      }}
    >
      {/* ── Dark header ───────────────────────────────────────────────────── */}
      <header
        style={{
          background: "var(--grey-900)",
          padding: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Link
            href="/contribute"
            aria-label="Back to contribute"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--white)",
              opacity: 0.7,
              textDecoration: "none",
              transition: "opacity 150ms ease",
            }}
          >
            <ChevronLeft size={28} />
          </Link>
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "30px",
              color: "var(--white)",
              margin: 0,
            }}
          >
            Pending routes
          </h1>
        </div>
      </header>

      {/* ── Centred content panel ─────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 40px 0",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* ── Loading skeleton ──────────────────────────────────────────── */}
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--white)",
                  borderRadius: "16px",
                  border: "1px solid var(--grey-100)",
                  height: "120px",
                  opacity: 0.6,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!isLoading && visible.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "64px 24px",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "9999px",
                background: "var(--white)",
                border: "2px dashed var(--grey-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
              }}
            >
              🗳️
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
              Nothing to review
            </h2>
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                color: "var(--grey-500)",
                margin: 0,
                lineHeight: 1.6,
                maxWidth: "280px",
              }}
            >
              Check back later, or add a route yourself.
            </p>
            <Link
              href="/contribute"
              id="pending-empty-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "13px 28px",
                borderRadius: "10px",
                background: "var(--green-800)",
                color: "var(--white)",
                textDecoration: "none",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                marginTop: "4px",
              }}
            >
              Add a route
            </Link>
          </div>
        )}

        {/* ── Contribution cards ────────────────────────────────────────── */}
        {!isLoading &&
          visible.map((contribution) => (
            <PendingCard
              key={contribution.id}
              contribution={contribution}
              deviceId={deviceId}
              onAnimateOut={handleAnimateOut}
            />
          ))}
      </div>
    </div>
  );
}
