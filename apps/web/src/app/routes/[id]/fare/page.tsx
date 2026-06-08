import ComingSoon from '../../../components/ComingSoon';

export default async function FarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <ComingSoon title="Fare Ticket" />;
}
