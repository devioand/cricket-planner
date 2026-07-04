import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import { HomeDashboard } from "@/components/tournaments/home-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const tournaments = await listTournaments(user.id);

  return <HomeDashboard tournaments={tournaments} />;
}
