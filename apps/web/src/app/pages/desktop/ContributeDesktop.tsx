"use client";

import { useState } from "react";
import { Plus, X, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import VehicleIcon from "../../components/VehicleIcon";
import { submitContribution } from "../../../api/axios";
import type { VehicleType } from "@ekofare/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StopRow {
  name: string;
  fare: string; // string so controlled input works cleanly; empty == "0"
}

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "danfo", label: "Danfo" },
  { value: "brt", label: "BRT" },
  { value: "keke", label: "Keke Napep" },
  { value: "okada", label: "Okada" },
  { value: "ferry", label: "Ferry" },
  { value: "uber", label: "Uber / Bolt" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen — desktop variant (wider centred card)
// ─────────────────────────────────────────────────────────────────────────────

function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: "20px",
          padding: "56px 48px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "1px solid var(--grey-100)",
        }}
      >
        {/* Green check circle */}
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "9999px",
            background: "var(--green-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <Check size={44} color="var(--green-800)" strokeWidth={2.5} />
        </div>

        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "32px",
            color: "var(--grey-900)",
            margin: "0 0 14px",
          }}
        >
          Thank you!
        </h1>

        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "16px",
            color: "var(--grey-500)",
            lineHeight: 1.6,
            margin: "0 0 40px",
          }}
        >
          Your submission is under review. Conflicting prices are flagged for
          community voting.
        </p>

        <button
          id="contribute-desktop-add-another-btn"
          onClick={onReset}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: "12px",
            background: "var(--green-800)",
            color: "var(--white)",
            border: "none",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "14px",
            transition: "background 150ms ease",
          }}
        >
          Add another route
        </button>

        <Link
          href="/contribute/pending"
          id="contribute-desktop-view-pending-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "15px 24px",
            borderRadius: "12px",
            background: "transparent",
            color: "var(--grey-700)",
            border: "1px solid var(--grey-200)",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          View pending routes
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContributeDesktop — main form
// ─────────────────────────────────────────────────────────────────────────────

export default function ContributeDesktop() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("danfo");
  const [stops, setStops] = useState<StopRow[]>([
    { name: "", fare: "" }, // index 0 = origin (no fare)
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────

  const estimatedTotal = stops
    .slice(1)
    .reduce((sum, s) => sum + (Number(s.fare) || 0), 0);

  const stopCount = stops.length;

  // ── Stop list mutations ────────────────────────────────────────────────────

  function addStop() {
    setStops((prev) => [...prev, { name: "", fare: "" }]);
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStop(index: number, field: keyof StopRow, value: string) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  // ── Submission ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        route_name: `${from} → ${to}`,
        vehicle,
        stops_data: stops.map((s, i) => ({
          name: s.name,
          fare_from_previous: i === 0 ? 0 : Number(s.fare) || 0,
        })),
        notes: notes.trim() || undefined,
      };
      await submitContribution(payload);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFrom("");
    setTo("");
    setVehicle("danfo");
    setStops([{ name: "", fare: "" }]);
    setNotes("");
    setSuccess(false);
  }

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
        paddingBottom: "48px",
      }}
    >
      {/* ── Dark header ────────────────────────────────────────────────────── */}
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
            href="/"
            aria-label="Go back"
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
            Add a route
          </h1>
        </div>
      </header>

      {/* ── Centred form panel ─────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 40px 0",
        }}
      >
        <div
          style={{
            background: "var(--white)",
            borderRadius: "20px",
            border: "1px solid var(--grey-100)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div
              style={{
                padding: "32px 32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* ── From / To ─────────────────────────────────────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    htmlFor="contribute-desktop-from"
                    style={labelStyle}
                  >
                    From
                  </label>
                  <input
                    id="contribute-desktop-from"
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="e.g. CMS"
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    htmlFor="contribute-desktop-to"
                    style={labelStyle}
                  >
                    To
                  </label>
                  <input
                    id="contribute-desktop-to"
                    type="text"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="e.g. Lekki"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ── Vehicle selector ──────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="contribute-desktop-vehicle" style={labelStyle}>
                  Vehicle
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "var(--cream)",
                    border: "1px solid var(--grey-100)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                    <VehicleIcon vehicle={vehicle} size={36} />
                  </div>
                  <select
                    id="contribute-desktop-vehicle"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value as VehicleType)}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "16px",
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

              {/* ── Stops & fares ─────────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={labelStyle}>Stops &amp; Fares</span>

                {stops.map((stop, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* Stop number indicator */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
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
                          fontSize: "12px",
                          fontWeight: 700,
                          color: index === 0 ? "var(--white)" : "var(--grey-500)",
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Stop name input */}
                    <input
                      id={`desktop-stop-name-${index}`}
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
                          padding: "8px 14px",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "12px",
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
                            background: "var(--cream)",
                            border: "1px solid var(--grey-100)",
                            borderRadius: "12px",
                            padding: "0 12px",
                            height: "48px",
                            width: "110px",
                            flexShrink: 0,
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "15px",
                              color: "var(--grey-500)",
                            }}
                          >
                            ₦
                          </span>
                          <input
                            id={`desktop-stop-fare-${index}`}
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
                              fontSize: "15px",
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
                            width: "36px",
                            height: "36px",
                            borderRadius: "9999px",
                            border: "1px solid var(--grey-100)",
                            background: "var(--cream)",
                            cursor: "pointer",
                            flexShrink: 0,
                            color: "var(--grey-500)",
                            transition: "background 150ms ease",
                          }}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add next stop ghost button */}
                <button
                  type="button"
                  id="contribute-desktop-add-stop-btn"
                  onClick={addStop}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "1.5px dashed var(--grey-300)",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--grey-500)",
                    marginTop: "4px",
                    transition: "border-color 150ms ease",
                  }}
                >
                  <Plus size={18} />
                  Add next stop
                </button>
              </div>

              {/* ── Notes (optional) ──────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="contribute-desktop-notes" style={labelStyle}>
                  Notes{" "}
                  <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  id="contribute-desktop-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any useful context about this route or fare…"
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "88px",
                    background: "var(--cream)",
                  }}
                />
              </div>

              {/* ── Estimated total card ───────────────────────────────────── */}
              <div
                role="region"
                aria-live="polite"
                aria-label="Estimated total"
                style={{
                  background: "var(--grey-900)",
                  borderRadius: "16px",
                  padding: "20px 24px",
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
                      fontSize: "12px",
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
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {stopCount} {stopCount === 1 ? "stop" : "stops"}
                  </span>
                </div>
                {/* Dual-span ₦ rendering for cross-browser font consistency */}
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: "2px" }}>
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 700,
                      fontSize: "24px",
                      color: "var(--white)",
                    }}
                  >
                    ₦
                  </span>
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: "32px",
                      color: "var(--white)",
                    }}
                  >
                    {estimatedTotal.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* ── Review notice ──────────────────────────────────────────── */}
              <div
                style={{
                  background: "var(--green-100)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "14px",
                    color: "var(--green-800)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  All submissions are reviewed before going live. Conflicting prices
                  are flagged for community voting.
                </p>
              </div>

              {/* ── Submit button ──────────────────────────────────────────── */}
              <button
                id="contribute-desktop-submit-btn"
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "17px 24px",
                  borderRadius: "12px",
                  background: submitting ? "var(--green-600)" : "var(--green-800)",
                  color: "var(--white)",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "17px",
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: "DM Sans, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--grey-500)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  background: "var(--cream)",
  border: "1px solid var(--grey-100)",
  borderRadius: "12px",
  padding: "13px 16px",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "16px",
  fontWeight: 400,
  color: "var(--grey-900)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
