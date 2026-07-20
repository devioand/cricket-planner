import { Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import {
  TrophyCabinet,
  type CabinetTrophy,
} from "@/components/trophies/trophy-cabinet";
import type { TrophyConfig } from "@/contexts/tournament-context/types";

export const dynamic = "force-dynamic";

/** Tournaments created before trophies existed have no design of their own. */
const DEFAULT_TROPHY: TrophyConfig = { shape: "classic", metal: "gold" };

export default async function TrophiesPage() {
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

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <TrophyCabinet trophies={trophies} />
    </Box>
  );
}
