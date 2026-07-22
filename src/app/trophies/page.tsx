import { Box } from "@chakra-ui/react";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import { getActiveClub } from "@/lib/clubs/active-club";
import {
  TrophyCabinet,
  type CabinetAward,
  type CabinetTrophy,
} from "@/components/trophies/trophy-cabinet";
import type { TrophyConfig } from "@/contexts/tournament-context/types";

export const dynamic = "force-dynamic";

/** Tournaments created before trophies existed have no design of their own. */
const DEFAULT_TROPHY: TrophyConfig = { shape: "classic", metal: "gold" };

export default async function CabinetPage() {
  const { userId, active } = await getActiveClub();
  const tournaments = await listTournaments(userId);

  // A trophy is earned once a tournament is completed and has a champion.
  const trophies: CabinetTrophy[] = tournaments
    .filter((t) => t.status === "completed" && t.winner)
    .map((t) => ({
      id: t.id,
      name: t.name,
      winner: t.winner as string,
      wonAt: t.updatedAt,
      config: t.trophy ?? DEFAULT_TROPHY,
    }));

  // Awards are derived cross-competition honours. "Most titles" is the only one
  // computable from the summary today; richer awards arrive with stats rollups.
  const wins = new Map<string, number>();
  for (const t of trophies) wins.set(t.winner, (wins.get(t.winner) ?? 0) + 1);
  const leader = [...wins.entries()].sort((a, b) => b[1] - a[1])[0];
  const awards: CabinetAward[] =
    leader && leader[1] >= 2
      ? [
          {
            key: "titles",
            title: "Most titles",
            subtitle: "across all competitions",
            who: `${leader[0]} · ${leader[1]}`,
          },
        ]
      : [];

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <TrophyCabinet trophies={trophies} awards={awards} clubName={active?.name} />
    </Box>
  );
}
