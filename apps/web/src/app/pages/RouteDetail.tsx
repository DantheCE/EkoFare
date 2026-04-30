import RouteDetailMobile from "./RouteDetailMobile";
import RouteDetailDesktop from "./desktop/RouteDetailDesktop";

export default function RouteDetail({ id }: { id: string }) {
  return (
    <>
      <div className="lg:hidden">
        <RouteDetailMobile id={id} />
      </div>
      <div className="hidden lg:block">
        <RouteDetailDesktop id={id} />
      </div>
    </>
  );
}
