// ─────────────────────────────────────────────────────────────────────────────
// Contribute — responsive wrapper
// < 1024px → ContributeMobile (TICKET-013)
// ≥ 1024px → ContributeDesktop (TICKET-014)
// ─────────────────────────────────────────────────────────────────────────────

import ContributeMobile from "./ContributeMobile";

// ContributeDesktop will be wired up in TICKET-014.
// For now we fall back to the mobile layout on all breakpoints.

export default function Contribute() {
  return (
    <>
      {/* Mobile layout — visible below 1024px */}
      <div className="lg:hidden">
        <ContributeMobile />
      </div>

      {/* Desktop layout — visible 1024px and up (TICKET-014) */}
      <div className="hidden lg:block">
        {/* ContributeDesktop placeholder until TICKET-014 ships */}
        <ContributeMobile />
      </div>
    </>
  );
}
