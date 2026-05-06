"use client";

import { useState } from "react";
import HomeMobile from "../pages/HomeMobile";
import HomeDesktop from "../pages/desktop/HomeDesktop";
import RouteListMobile from "../pages/RouteListMobile";
import RouteListDesktop from "../pages/desktop/RouteListDesktop";
import RouteDetailMobile from "../pages/RouteDetailMobile";
import RouteDetailDesktop from "../pages/desktop/RouteDetailDesktop";
import FareSummaryMobile from "../pages/FareSummaryMobile";
import FareSummaryDesktop from "../pages/desktop/FareSummaryDesktop";
import SavedMobile from "../pages/SavedMobile";
import SavedDesktop from "../pages/desktop/SavedDesktop";
import ContributeMobile from "../pages/ContributeMobile";
import ContributeDesktop from "../pages/desktop/ContributeDesktop";
import PendingContributionsMobile from "../pages/PendingContributionsMobile";
import PendingContributionsDesktop from "../pages/desktop/PendingContributionsDesktop";
import { ChevronLeft } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

type Platform = "Mobile" | "Desktop";
type ScreenState = "Default" | "Loading" | "Empty" | "Error" | "Success" | "Disabled";

interface Entry {
  label: string;
  component: React.ElementType;
  platform: Platform;
  state: ScreenState;
  props: any;
}

const SCREENS = [
  {
    name: "Home",
    mobile: HomeMobile,
    desktop: HomeDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Loading", props: { isLoading: true } },
      { name: "Empty", props: { isEmpty: true } },
    ],
  },
  {
    name: "Route List",
    mobile: RouteListMobile,
    desktop: RouteListDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Loading", props: { isLoading: true } },
      { name: "Empty", props: { isEmpty: true } },
      { name: "Error", props: { isError: true } },
    ],
  },
  {
    name: "Route Detail",
    mobile: RouteDetailMobile,
    desktop: RouteDetailDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Loading", props: { isLoading: true } },
      { name: "Error", props: { isError: true } },
    ],
  },
  {
    name: "Fare Summary",
    mobile: FareSummaryMobile,
    desktop: FareSummaryDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Loading", props: { isLoading: true } },
      { name: "Error", props: { isError: true } },
    ],
  },
  {
    name: "Saved Routes",
    mobile: SavedMobile,
    desktop: SavedDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Empty State", props: { isEmpty: true } },
    ],
  },
  {
    name: "Contribute",
    mobile: ContributeMobile,
    desktop: ContributeDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Disabled", props: { isDisabled: true } },
      { name: "Success", props: { isSuccess: true } },
    ],
  },
  {
    name: "Pending Contributions",
    mobile: PendingContributionsMobile,
    desktop: PendingContributionsDesktop,
    states: [
      { name: "Default", props: {} },
      { name: "Loading", props: { isLoading: true } },
      { name: "Empty", props: { isEmpty: true } },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DevClientPage() {
  const [activeView, setActiveView] = useState<Entry | null>(null);

  if (activeView) {
    const Component = activeView.component;
    const isMobile = activeView.platform === "Mobile";

    return (
      <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "16px", background: "#111", display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setActiveView(null)}
            style={{
              background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center"
            }}
          >
            <ChevronLeft size={24} /> Back to Index
          </button>
          <div style={{ color: "#fff", fontFamily: "Syne", fontWeight: 700, fontSize: "18px" }}>
            {activeView.label}
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div
            style={{
              width: isMobile ? "375px" : "1024px",
              height: isMobile ? "812px" : "768px",
              background: "var(--cream)",
              borderRadius: "24px",
              overflow: "hidden",
              border: "8px solid #333",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <div style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
              <Component {...activeView.props} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", padding: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "36px", color: "var(--grey-900)", margin: "0 0 16px" }}>
          EkoFare Dev Lab
        </h1>
        <p style={{ fontFamily: "DM Sans", fontSize: "16px", color: "var(--grey-500)", marginBottom: "48px" }}>
          Directly inspect any screen in any state without relying on real network conditions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {SCREENS.map((screen) => (
            <section key={screen.name}>
              <h2
                style={{
                  fontFamily: "Syne",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "var(--green-800)",
                  borderBottom: "2px solid var(--green-200)",
                  paddingBottom: "8px",
                  marginBottom: "20px",
                }}
              >
                {screen.name}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {screen.states.map((state) => (
                  <React.Fragment key={state.name}>
                    {/* Mobile Button */}
                    <button
                      onClick={() => setActiveView({
                        label: `${screen.name} — Mobile — ${state.name}`,
                        component: screen.mobile,
                        platform: "Mobile",
                        state: state.name as ScreenState,
                        props: state.props,
                      })}
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--grey-200)",
                        borderRadius: "12px",
                        padding: "16px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--green-600)"}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--grey-200)"}
                    >
                      <span style={{ fontFamily: "DM Sans", fontSize: "12px", color: "var(--grey-400)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Mobile</span>
                      <span style={{ fontFamily: "DM Sans", fontSize: "16px", fontWeight: 600, color: "var(--grey-900)" }}>{screen.name} — Mobile — {state.name}</span>
                    </button>

                    {/* Desktop Button */}
                    <button
                      onClick={() => setActiveView({
                        label: `${screen.name} — Desktop — ${state.name}`,
                        component: screen.desktop,
                        platform: "Desktop",
                        state: state.name as ScreenState,
                        props: state.props,
                      })}
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--grey-200)",
                        borderRadius: "12px",
                        padding: "16px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--green-600)"}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--grey-200)"}
                    >
                      <span style={{ fontFamily: "DM Sans", fontSize: "12px", color: "var(--grey-400)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Desktop</span>
                      <span style={{ fontFamily: "DM Sans", fontSize: "16px", fontWeight: 600, color: "var(--grey-900)" }}>{screen.name} — Desktop — {state.name}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
