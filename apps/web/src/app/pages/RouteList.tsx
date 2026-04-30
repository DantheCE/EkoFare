// ─────────────────────────────────────────────────────────────────────────────
// RouteList — responsive wrapper
// < 1024px → RouteListMobile (TICKET-007)
// ≥ 1024px → RouteListDesktop (TICKET-008, empty slot for now)
// ─────────────────────────────────────────────────────────────────────────────

import RouteListMobile from "./RouteListMobile";
import RouteListDesktop from "./desktop/RouteListDesktop";

export default function RouteList() {
  return (
    <>
      {/* Mobile layout — visible below 1024px */}
      <div className="lg:hidden">
        <RouteListMobile />
      </div>

      {/* Desktop layout — visible at 1024px and above */}
      <div className="hidden lg:block">
        <RouteListDesktop />
      </div>
    </>
  );
}
