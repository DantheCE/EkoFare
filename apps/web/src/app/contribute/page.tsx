import ContributeClient from './ContributeClient';

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string }>;
}) {
  const { route } = await searchParams;
  return <ContributeClient prefillRouteId={route ?? null} />;
}
