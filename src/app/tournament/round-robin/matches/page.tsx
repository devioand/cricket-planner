"use client";

import { Text, VStack, Box } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTournament } from "@/contexts/tournament-context";
import { MatchCard } from "@/components/tournaments/match-card";
import { TournamentCelebration } from "@/components/tournaments/tournament-celebration";
import { useEffect, useState } from "react";

export default function RoundRobinMatches() {
  const tournament = useTournament();
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  // Note: Playoffs are now generated automatically with TBD placeholders when tournament is created
  // TBD teams get replaced automatically when round robin matches complete

  // Check for tournament completion and show celebration
  useEffect(() => {
    const isComplete = tournament.isTournamentComplete();
    const winner = tournament.getTournamentWinner();

    if (isComplete && winner && !celebrationShown) {
      setShowCelebration(true);
      setCelebrationShown(true);
    }

    // Reset celebration flag when tournament is reset
    if (!isComplete && celebrationShown) {
      setCelebrationShown(false);
    }
  }, [tournament.state.matches, tournament, celebrationShown]);

  return (
    <>
      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        {!tournament.state.isGenerated ? (
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
            <Button
              onClick={() => router.push("/tournament/round-robin/setup")}
              colorPalette="blue"
              size="lg"
            >
              ← Go to Setup
            </Button>
          </Box>
        ) : (
          <MatchesFlow />
        )}
      </VStack>

      {/* Tournament Celebration */}
      <TournamentCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        winner={tournament.getTournamentWinner() || ""}
      />
    </>
  );
}

// Main matches component using the new MatchCard
function MatchesFlow() {
  const tournament = useTournament();

  // Separate round-robin and playoff matches
  const roundRobinMatches = tournament.state.matches
    .filter((match) => !match.isPlayoff)
    .sort((a, b) => a.round - b.round);

  const playoffMatches = tournament.state.matches
    .filter((match) => match.isPlayoff)
    .sort((a, b) => a.round - b.round);

  const allMatches = [...roundRobinMatches, ...playoffMatches];
  const pendingMatches = allMatches.filter(
    (match) => match.status !== "completed"
  ).length;

  const handleGenerateSampleResults = () => {
    tournament.generateSampleResults();
  };

  return (
    <VStack align="stretch" gap={6}>
      {/* Sample Results Button */}
      {process.env.NODE_ENV === "development" &&
        allMatches.length > 0 &&
        pendingMatches > 0 && (
          <Button
            size="sm"
            colorPalette="purple"
            variant="outline"
            onClick={handleGenerateSampleResults}
            alignSelf="flex-start"
          >
            🎲 Generate Sample Results ({pendingMatches} pending)
          </Button>
        )}

      {/* Group Stage Matches Section */}
      {roundRobinMatches.length > 0 && (
        <VStack align="stretch" gap={4}>
          {roundRobinMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              matchNumber={index + 1}
              totalMatches={roundRobinMatches.length}
            />
          ))}
        </VStack>
      )}

      {/* Playoff Matches Section */}
      <VStack align="stretch" gap={4}>
        {/* Option 1: Simple Clean Header (like Round Robin) */}
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

        {/* Playoff Matches */}
        {playoffMatches.map((match, index) => (
          <Box key={match.id} position="relative">
            <MatchCard
              key={match.id}
              match={match}
              matchNumber={index + 1}
              totalMatches={playoffMatches.length}
              isPlayoff={true}
            />
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}
