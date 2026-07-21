import { Box, VStack } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import { CreationWizard } from "@/components/tournaments/wizard/creation-wizard";

export const dynamic = "force-dynamic";

export default async function NewTournamentPage() {
  const user = await requireUser();
  const tournaments = await listTournaments(user.id);

  // Distinct past names, most-recent first — offered as one-tap chips so a
  // recurring competition (e.g. "SPL") isn't retyped every time.
  const recentNames = [
    ...new Set(tournaments.map((t) => t.name.trim()).filter(Boolean)),
  ].slice(0, 5);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack align="stretch" gap={6}>
        <CreationWizard recentNames={recentNames} />
      </VStack>
    </Box>
  );
}
