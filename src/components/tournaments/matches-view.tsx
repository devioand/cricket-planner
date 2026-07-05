"use client";

import Link from "next/link";
import { Text, VStack, Box } from "@chakra-ui/react";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { MatchCard } from "@/components/tournaments/match-card";
import { SampleResultsButton } from "@/components/tournaments/sample-results-button";
import { Button } from "@/components/ui/button";

/**
 * Matches tab — reads the live tournament from the local store, so every
 * scoring action reflects instantly without a server round-trip.
 */
export function MatchesView() {
  const { state, readOnly, store } = useLiveTournament();

  if (!state.isGenerated) {
    return (
      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        <Box p={8} bg="bg.subtle" rounded="lg" textAlign="center">
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            color="fg.default"
            mb={4}
          >
            📋 No Tournament Generated
          </Text>
          <Text fontSize="md" color="fg.muted" mb={6}>
            Please set up your tournament first by adding teams and generating
            matches
          </Text>
          <Link href={`/tournament/round-robin/${store.id}/setup`}>
            <Button colorPalette="blue" size="lg">
              ← Go to Setup
            </Button>
          </Link>
        </Box>
      </VStack>
    );
  }

  const roundRobinMatches = state.matches
    .filter((m) => !m.isPlayoff)
    .sort((a, b) => a.round - b.round);
  const playoffMatches = state.matches
    .filter((m) => m.isPlayoff)
    .sort((a, b) => a.round - b.round);
  const pending = state.matches.filter((m) => m.status !== "completed").length;

  return (
    <VStack align="stretch" gap={6}>
      {process.env.NODE_ENV === "development" && !readOnly && pending > 0 && (
        <SampleResultsButton pending={pending} />
      )}

      {/* Group Stage */}
      {roundRobinMatches.length > 0 && (
        <VStack align="stretch" gap={4}>
          {roundRobinMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              matchNumber={index + 1}
              totalMatches={roundRobinMatches.length}
              readOnly={readOnly}
            />
          ))}
        </VStack>
      )}

      {/* Playoffs */}
      <VStack align="stretch" gap={4}>
        <Box textAlign="center" py={4}>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="colorPalette.700"
            mb={1}
            colorPalette="yellow"
          >
            🏆 Playoff Stage
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Top teams compete for the championship
          </Text>
        </Box>

        {playoffMatches.length === 0 && (
          <Box p={6} bg="bg.subtle" rounded="lg" textAlign="center">
            <Text fontSize="xl" fontWeight="bold" color="fg.default" mb={2}>
              🚨 No Playoff Matches
            </Text>
            <Text fontSize="md" color="fg.muted">
              Playoff matches will appear here once the tournament is generated.
            </Text>
          </Box>
        )}

        {playoffMatches.map((match, index) => (
          <Box key={match.id} position="relative">
            <MatchCard
              match={match}
              matchNumber={index + 1}
              totalMatches={playoffMatches.length}
              isPlayoff
              readOnly={readOnly}
            />
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}
