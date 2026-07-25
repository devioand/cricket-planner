"use client";

import Link from "next/link";
import { Heading, Text, VStack, Box, Skeleton } from "@chakra-ui/react";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { getStandings } from "@/contexts/tournament-context/engine";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";
import { SeriesScoreline } from "@/components/tournaments/series-scoreline";
import { Button } from "@/components/ui/button";

/** Standings tab — derived live from the local store's tournament state.
 *  A series has no table, so it shows a head-to-head scoreline instead. */
export function StandingsView() {
  const { state, hydrating } = useLiveTournament();
  const isSeries = state.algorithm === "series";
  const standings = getStandings(state);

  return (
    <>
      {/* Header */}
      <VStack gap={4} align="stretch" mb={8}>
        <Box textAlign="center">
          <Heading
            size={{ base: "lg", md: "xl" }}
            color="colorPalette.600"
            colorPalette="brand"
            mb={2}
          >
            🏆 {isSeries ? "The Series" : "Tournament Standings"}
          </Heading>
          <Text
            color="fg.muted"
            fontSize={{ base: "sm", md: "md" }}
            maxW="2xl"
            mx="auto"
          >
            {isSeries
              ? "Head-to-head — first to a winning majority takes it"
              : "View group stage standings (playoff matches excluded)"}
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
            This tournament isn&apos;t available on this device yet. Play some
            matches to see the standings.
          </Text>
          <Link href="/tournaments">
            <Button colorPalette="brand" size="lg">
              ← Back to tournaments
            </Button>
          </Link>
        </Box>
      ) : isSeries ? (
        <SeriesScoreline state={state} />
      ) : (
        <TournamentStandings
          standings={standings}
          qualifiers={state.playoffConfig?.qualifiers ?? 0}
        />
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
