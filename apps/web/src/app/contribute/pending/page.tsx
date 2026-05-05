import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pending Contributions — EkoFare",
  description: "Review and verify community-submitted transit fare routes.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder — TICKET-015 will replace this with the full PendingContributions
// page (mobile + desktop layouts with verify / dispute controls).
// ─────────────────────────────────────────────────────────────────────────────

export default function PendingPage() {
  return (
    <div
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        paddingBottom: "88px",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: "24px",
          color: "var(--grey-900)",
          marginBottom: "12px",
        }}
      >
        Pending routes
      </h1>
      <p style={{ color: "var(--grey-500)", fontSize: "15px" }}>
        Coming soon — TICKET-015.
      </p>
    </div>
  );
}
