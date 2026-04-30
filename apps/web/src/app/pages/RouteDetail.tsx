import RouteDetailMobile from "./RouteDetailMobile";

export default function RouteDetail({ id }: { id: string }) {
  return (
    <>
      <div className="lg:hidden">
        <RouteDetailMobile id={id} />
      </div>
      <div className="hidden lg:block">
        {/* Desktop layout for Route Detail will go here later */}
      </div>
    </>
  );
}
