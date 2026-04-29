"use client";

import RouteCard from "./components/RouteCard";
import { transformRoute } from "../utils/helpers";
import mockRoutes from "../api/mock/routes.json";
import type { BackendRoute } from "@ekofare/types";

// Demo page — temporary stub per TICKET-004 "How to demo"
// Will be replaced by HomeMobile/HomeDesktop in TICKET-005.
export default function Home() {
  const routes = (mockRoutes as BackendRoute[]).slice(0, 2).map(transformRoute);

  return (
    <main
      style={{
        padding: "32px 16px",
        maxWidth: "480px",
        margin: "0 auto",
        background: "var(--cream)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: "32px",
          color: "var(--grey-900)",
          marginBottom: "8px",
        }}
      >
        EkoFare
      </h1>
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "14px",
          color: "var(--grey-500)",
          marginBottom: "24px",
        }}
      >
        TICKET-004 demo — RouteCard + VehicleIcon + mock API
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </main>
  );
}

