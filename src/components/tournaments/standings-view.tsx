"use client";

import Link from "next/link";
import { Heading, Text, VStack, Box, Skeleton } from "@chakra-ui/react";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { getStandings } from "@/contexts/tournament-context/engine";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";
import { Button } from "@/components/ui/button";

/** Standings tab — derived live from the local store's tournament state. */
export function StandingsView() {
  const { state, hydrating, store } = useLiveTournament();
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

      {hydrating ? (
        <StandingsSkeleton />
      ) : !state.isGenerated ? (
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
          <Link href={`/tournament/round-robin/${store.id}/setup`}>
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

/** Placeholder shown while the client reads the tournament from localStorage. */
function StandingsSkeleton() {
  return (
    <VStack align="stretch" gap={3} aria-busy="true">
      <Skeleton height="44px" borderRadius="md" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height="52px" borderRadius="md" />
      ))}
    </VStack>
  );
}
