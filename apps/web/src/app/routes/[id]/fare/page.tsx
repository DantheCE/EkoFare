import FareTicketClient from './FareTicketClient';

export default async function FarePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; rev?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  return <FareTicketClient id={id} from={sp.from} to={sp.to} rev={sp.rev} />;
}
