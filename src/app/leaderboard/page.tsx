import { LuListOrdered } from "react-icons/lu";
import { requireUser } from "@/lib/session";
import { ComingSoon } from "@/components/layout/coming-soon";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  await requireUser();

  return (
    <ComingSoon
      icon={LuListOrdered}
      title="Leaderboard"
      description="See how teams stack up across every tournament — wins, net run rate, and form, all in one ranking."
    />
  );
}
