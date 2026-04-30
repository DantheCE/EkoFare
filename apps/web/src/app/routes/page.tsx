// TICKET-007 — Route List screen entry point.
// Renders RouteListMobile (<1024px) or RouteListDesktop (≥1024px — TICKET-008).
import RouteList from "../pages/RouteList";

export default function Page() {
  return <RouteList />;
}
