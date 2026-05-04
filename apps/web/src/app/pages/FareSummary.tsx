import FareSummaryMobile from "./FareSummaryMobile";
import FareSummaryDesktop from "./desktop/FareSummaryDesktop";

export default function FareSummary({ id }: { id: string }) {
  return (
    <>
      <div className="lg:hidden">
        <FareSummaryMobile id={id} />
      </div>
      <div className="hidden lg:block">
        <FareSummaryDesktop id={id} />
      </div>
    </>
  );
}
