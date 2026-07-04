import { redirect } from "next/navigation";

export default async function RoundRobinTournamentIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tournament/round-robin/${id}/setup`);
}
