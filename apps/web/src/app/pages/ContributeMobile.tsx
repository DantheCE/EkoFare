"use client";

import { useState } from "react";
import { Plus, X, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import VehicleIcon from "../components/VehicleIcon";
import { submitContribution } from "../../api/axios";
import { useContributeForm } from "../../hooks/useContributeForm";
import type { VehicleType } from "@ekofare/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "danfo", label: "Danfo" },
  { value: "brt", label: "BRT" },
  { value: "keke", label: "Keke Napep" },
  { value: "okada", label: "Okada" },
  { value: "ferry", label: "Ferry" },
  { value: "uber", label: "Uber / Bolt" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────────────────────────────────────

function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        background: "var(--white)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        paddingBottom: "88px",
      }}
    >
      {/* Green check circle */}
      <div
        style={{
          width: "88px",
          height: "88px",
          borderRadius: "9999px",
          background: "var(--green-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <Check size={40} color="var(--green-800)" strokeWidth={2.5} />
      </div>

      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: "28px",
          color: "var(--grey-900)",
          margin: "0 0 12px",
        }}
      >
        Thank you!
      </h1>

      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "15px",
          color: "var(--grey-500)",
          lineHeight: 1.6,
          maxWidth: "300px",
          margin: "0 0 36px",
        }}
      >
        Your submission is under review. Conflicting prices are flagged for
        community voting.
      </p>

      <button
        id="contribute-add-another-btn"
        onClick={onReset}
        style={{
          width: "100%",
          maxWidth: "320px",
          padding: "15px 24px",
          borderRadius: "10px",
          background: "var(--green-800)",
          color: "var(--white)",
          border: "none",
          cursor: "pointer",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "15px",
          fontWeight: 600,
          marginBottom: "12px",
        }}
      >
        Add another route
      </button>

      <Link
        href="/contribute/pending"
        id="contribute-view-pending-link"
        style={{
          width: "100%",
          maxWidth: "320px",
          padding: "14px 24px",
          borderRadius: "10px",
          background: "transparent",
          color: "var(--grey-700)",
          border: "1px solid var(--grey-100)",
          cursor: "pointer",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        View pending routes
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContributeMobile — main form
// ─────────────────────────────────────────────────────────────────────────────

export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }
export default function ContributeMobile({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {
  const {
    from, setFrom,
    to, setTo,
    vehicle, setVehicle,
    stops, addStop, removeStop, updateStop,
    notes, setNotes,
    submitting,
    success,
    estimatedTotal,
    stopCount,
    handleSubmit,
    reset,
  } = useContributeForm();

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return <SuccessScreen onReset={reset} />;
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingBottom: "88px",
      }}
    >
      {/* ── Dark header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "var(--grey-900)",
          padding: "48px 20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Link
          href="/"
          aria-label="Go back"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--white)",
            opacity: 0.7,
            textDecoration: "none",
          }}
        >
          <ChevronLeft size={24} />
        </Link>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "24px",
            color: "var(--white)",
            margin: 0,
          }}
        >
          Add a route
        </h1>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── From / To ──────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="contribute-from"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--grey-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                From
              </label>
              <input
                id="contribute-from"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g. CMS"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="contribute-to"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--grey-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                To
              </label>
              <input
                id="contribute-to"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. Lekki"
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── Vehicle selector ────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="contribute-vehicle"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--grey-500)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Vehicle
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--white)",
                border: "1px solid var(--grey-100)",
                borderRadius: "10px",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  flexShrink: 0,
                }}
              >
                <VehicleIcon vehicle={vehicle} size={32} />
              </div>
              <select
                id="contribute-vehicle"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value as VehicleType)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "var(--grey-900)",
                  cursor: "pointer",
                }}
              >
                {VEHICLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Stops & fares ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--grey-500)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Stops &amp; Fares
            </span>

            {stops.map((stop, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {/* Stop number indicator */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "9999px",
                    background: index === 0 ? "var(--green-800)" : "var(--grey-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: index === 0 ? "var(--white)" : "var(--grey-500)",
                    }}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Stop name input */}
                <input
                  id={`stop-name-${index}`}
                  type="text"
                  value={stop.name}
                  onChange={(e) => updateStop(index, "name", e.target.value)}
                  placeholder={index === 0 ? "Origin stop name" : "Stop name"}
                  required
                  aria-label={`Stop ${index + 1} name`}
                  style={{ ...inputStyle, flex: 1, margin: 0 }}
                />

                {/* ORIGIN chip (index 0) or fare input (index 1+) */}
                {index === 0 ? (
                  <div
                    aria-label="Origin stop — no fare"
                    style={{
                      background: "var(--green-100)",
                      color: "var(--green-800)",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    ORIGIN
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "var(--white)",
                        border: "1px solid var(--grey-100)",
                        borderRadius: "10px",
                        padding: "0 10px",
                        height: "44px",
                        width: "90px",
                        flexShrink: 0,
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "14px",
                          color: "var(--grey-500)",
                        }}
                      >
                        ₦
                      </span>
                      <input
                        id={`stop-fare-${index}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={stop.fare}
                        onChange={(e) => updateStop(index, "fare", e.target.value)}
                        aria-label={`Stop ${index + 1} fare in naira`}
                        style={{
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--grey-900)",
                          width: "100%",
                          minWidth: 0,
                        }}
                      />
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      aria-label={`Remove stop ${index + 1}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "9999px",
                        border: "1px solid var(--grey-100)",
                        background: "var(--white)",
                        cursor: "pointer",
                        flexShrink: 0,
                        color: "var(--grey-500)",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Add next stop ghost button */}
            <button
              type="button"
              id="contribute-add-stop-btn"
              onClick={addStop}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1.5px dashed var(--grey-300)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--grey-500)",
                marginTop: "4px",
              }}
            >
              <Plus size={16} />
              Add next stop
            </button>
          </div>

          {/* ── Notes (optional) ────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="contribute-notes"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--grey-500)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Notes{" "}
              <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                (optional)
              </span>
            </label>
            <textarea
              id="contribute-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any useful context about this route or fare…"
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "80px",
              }}
            />
          </div>

          {/* ── Estimated total card ─────────────────────────────────────────── */}
          <div
            role="region"
            aria-live="polite"
            aria-label="Estimated total"
            style={{
              background: "var(--grey-900)",
              borderRadius: "14px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Estimated total
              </span>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {stopCount} {stopCount === 1 ? "stop" : "stops"}
              </span>
            </div>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: "2px" }}>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "var(--white)",
                }}
              >
                ₦
              </span>
              <span
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: "28px",
                  color: "var(--white)",
                }}
              >
                {estimatedTotal.toLocaleString()}
              </span>
            </span>
          </div>

          {/* ── Review notice ────────────────────────────────────────────────── */}
          <div
            style={{
              background: "var(--green-100)",
              borderRadius: "10px",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                color: "var(--green-800)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              All submissions are reviewed before going live. Conflicting prices
              are flagged for community voting.
            </p>
          </div>

          {/* ── Submit button ────────────────────────────────────────────────── */}
          <button
            id="contribute-submit-btn"
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "15px 24px",
              borderRadius: "10px",
              background: submitting ? "var(--green-600)" : "var(--green-800)",
              color: "var(--white)",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              opacity: submitting ? 0.8 : 1,
              transition: "background 150ms ease, opacity 150ms ease",
            }}
            aria-disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit route"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared input style
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--grey-100)",
  borderRadius: "10px",
  padding: "12px 14px",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  color: "var(--grey-900)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
