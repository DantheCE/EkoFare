// ─────────────────────────────────────────────────────────────────────────────
// Home — responsive wrapper
// < 1024px → HomeMobile (this ticket)
// ≥ 1024px → HomeDesktop (TICKET-006, empty slot for now)
// ─────────────────────────────────────────────────────────────────────────────

import HomeMobile from "./HomeMobile";

export default function Home() {
  return (
    <>
      {/* Mobile layout — visible below 1024px */}
      <div className="lg:hidden">
        <HomeMobile />
      </div>

      {/* Desktop layout — TICKET-006 will fill this */}
      <div className="hidden lg:block">
        {/* HomeDesktop goes here */}
      </div>
    </>
  );
}
