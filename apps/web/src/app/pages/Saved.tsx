// ─────────────────────────────────────────────────────────────────────────────
// Saved — responsive wrapper
// < 1024px → SavedMobile
// ≥ 1024px → SavedDesktop
// ─────────────────────────────────────────────────────────────────────────────

import SavedMobile from "./SavedMobile";
import SavedDesktop from "./desktop/SavedDesktop";

export default function Saved() {
  return (
    <>
      {/* Mobile layout — visible below 1024px */}
      <div className="lg:hidden">
        <SavedMobile />
      </div>

      {/* Desktop layout — visible 1024px and up */}
      <div className="hidden lg:block">
        <SavedDesktop />
      </div>
    </>
  );
}
