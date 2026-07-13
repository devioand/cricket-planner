import { redirect } from "next/navigation";

// Tournaments are generated at creation time, so the tournament shell opens
// straight to the matches. (Setup is now the standalone /tournaments/new flow.)
export default async function RoundRobinTournamentIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tournament/round-robin/${id}/matches`);
}
