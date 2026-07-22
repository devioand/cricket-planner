import { Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
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
  // The Cabinet is one global trophy room — every trophy from every club.
  const user = await requireUser();
  const tournaments = await listTournaments(user.id);

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
      <TrophyCabinet trophies={trophies} awards={awards} />
    </Box>
  );
}
