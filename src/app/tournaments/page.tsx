import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import { TournamentsList } from "@/components/tournaments/tournaments-list";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const user = await requireUser();
  const tournaments = await listTournaments(user.id);

  return <TournamentsList tournaments={tournaments} />;
}
