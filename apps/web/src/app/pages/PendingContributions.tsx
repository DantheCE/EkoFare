// ─────────────────────────────────────────────────────────────────────────────
// PendingContributions — responsive wrapper
// < 1024px → PendingContributionsMobile (TICKET-015)
// ≥ 1024px → PendingContributionsDesktop (TICKET-016)
// ─────────────────────────────────────────────────────────────────────────────

import PendingContributionsMobile from "./PendingContributionsMobile";
import PendingContributionsDesktop from "./desktop/PendingContributionsDesktop";

export default function PendingContributions() {
  return (
    <>
      {/* Mobile layout — visible below 1024px */}
      <div className="lg:hidden">
        <PendingContributionsMobile />
      </div>

      {/* Desktop layout — visible 1024px and up (TICKET-016) */}
      <div className="hidden lg:block">
        <PendingContributionsDesktop />
      </div>
    </>
  );
}
