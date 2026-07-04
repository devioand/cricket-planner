import { notFound } from "next/navigation";
import Link from "next/link";
import { Heading, Text, VStack, Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { getTournament } from "@/lib/repositories/tournament-repository";
import { getStandings } from "@/contexts/tournament-context/engine";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";
import { Button } from "@/components/ui/button";

export default async function RoundRobinStandings({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const record = await getTournament(user.id, id);
  if (!record) notFound();

  const { state } = record;
  const standings = getStandings(state);

  return (
    <>
      {/* Header */}
      <VStack gap={4} align="stretch" mb={8}>
        <Box textAlign="center">
          <Heading
            size={{ base: "lg", md: "xl" }}
            color="colorPalette.600"
            colorPalette="blue"
            mb={2}
          >
            🏆 Tournament Standings
          </Heading>
          <Text
            color="fg.muted"
            fontSize={{ base: "sm", md: "md" }}
            maxW="2xl"
            mx="auto"
          >
            View group stage standings (playoff matches excluded)
          </Text>
        </Box>
      </VStack>

      {!state.isGenerated ? (
        <Box p={8} bg="bg.subtle" rounded="lg" textAlign="center">
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            color="fg.default"
            mb={4}
          >
            📊 No Tournament Data
          </Text>
          <Text fontSize="md" color="fg.muted" mb={6}>
            Generate tournament matches and play some games to see standings
          </Text>
          <Link href={`/tournament/round-robin/${id}/setup`}>
            <Button colorPalette="blue" size="lg">
              ← Go to Setup
            </Button>
          </Link>
        </Box>
      ) : (
        <TournamentStandings standings={standings} />
      )}
    </>
  );
}
