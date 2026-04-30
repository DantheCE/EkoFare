// ─────────────────────────────────────────────────────────────────────────────
// RouteList — responsive wrapper
// < 1024px → RouteListMobile (TICKET-007)
// ≥ 1024px → RouteListDesktop (TICKET-008, empty slot for now)
// ─────────────────────────────────────────────────────────────────────────────

import RouteListMobile from "./RouteListMobile";

export default function RouteList() {
  return (
    <>
      {/* Mobile layout — visible below 1024px */}
      <div className="lg:hidden">
        <RouteListMobile />
      </div>

      {/* Desktop layout — TICKET-008 will fill this */}
      <div className="hidden lg:block">
        {/* RouteListDesktop coming in TICKET-008 */}
      </div>
    </>
  );
}
