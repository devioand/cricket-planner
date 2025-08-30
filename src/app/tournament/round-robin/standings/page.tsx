"use client";

import { Heading, Text, VStack, Button, Box } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useTournament } from "@/contexts/tournament-context";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";

export default function RoundRobinStandings() {
  const tournament = useTournament();
  const router = useRouter();

  return (
    <>
      {/* Header */}
      <VStack gap={4} align="stretch" mb={8}>
        <Box textAlign="center">
          <Heading size={{ base: "lg", md: "xl" }} color="blue.600" mb={2}>
            🏆 Tournament Standings
          </Heading>
          <Text
            color="gray.600"
            fontSize={{ base: "sm", md: "md" }}
            maxW="2xl"
            mx="auto"
          >
            View group stage standings (playoff matches excluded)
          </Text>
        </Box>
      </VStack>

      {!tournament.state.isGenerated ? (
        <Box p={8} bg="yellow.50" rounded="lg" textAlign="center">
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            color="yellow.700"
            mb={4}
          >
            📊 No Tournament Data
          </Text>
          <Text fontSize="md" color="yellow.600" mb={6}>
            Generate tournament matches and play some games to see standings
          </Text>
          <Button
            onClick={() => router.push("/tournament/round-robin/setup")}
            colorPalette="yellow"
            size="lg"
          >
            ← Go to Setup
          </Button>
        </Box>
      ) : (
        <TournamentStandings />
      )}
    </>
  );
}
