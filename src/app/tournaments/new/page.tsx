import { Box, VStack } from "@chakra-ui/react";
import {
  listTournaments,
  getPlayerFormData,
} from "@/lib/repositories/tournament-repository";
import { getActiveClub } from "@/lib/clubs/active-club";
import { listRoster } from "@/lib/repositories/club-repository";
import { CreationWizard } from "@/components/tournaments/wizard/creation-wizard";

export const dynamic = "force-dynamic";

export default async function NewTournamentPage() {
  // The active club only decides where NEW players/games get saved. The picker
  // itself is club-agnostic — you choose from your whole roster of people.
  const { userId, active } = await getActiveClub();
  const [tournaments, roster] = await Promise.all([
    listTournaments(userId),
    listRoster(userId),
  ]);

  // Real pre-match form for everyone on the roster — powers the fixture
  // predictions from actual past results (never fabricated).
  const formData = await getPlayerFormData(
    userId,
    roster.map((p) => p.name),
  );

  // Distinct past names, most-recent first — offered as one-tap chips so a
  // recurring competition (e.g. "SPL") isn't retyped every time.
  const recentNames = [
    ...new Set(tournaments.map((t) => t.name.trim()).filter(Boolean)),
  ].slice(0, 5);

  const clubPlayers = roster.map((p) => ({ id: p.id, name: p.name }));

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack align="stretch" gap={6}>
        <CreationWizard
          recentNames={recentNames}
          clubPlayers={clubPlayers}
          clubId={active?.id ?? null}
          formData={formData}
        />
      </VStack>
    </Box>
  );
}
