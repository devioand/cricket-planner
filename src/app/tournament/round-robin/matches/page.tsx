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

  // Auto-generate playoffs when round robin is complete
  useEffect(() => {
    const roundRobinMatches = tournament.state.matches.filter(
      (match) => !match.isPlayoff
    );
    const incompleteRoundRobin = roundRobinMatches.filter(
      (match) => match.status === "scheduled"
    );
    const completedRoundRobin = roundRobinMatches.filter(
      (match) => match.status === "completed"
    );
    const hasPlayoffs = tournament.state.matches.some(
      (match) => match.isPlayoff
    );

    // Calculate expected matches for round robin: n*(n-1)/2 where n = number of teams
    const expectedMatches =
      tournament.state.teams.length > 1
        ? (tournament.state.teams.length *
            (tournament.state.teams.length - 1)) /
          2
        : 0;

    // Only trigger when round robin is TRULY complete:
    // 1. All expected matches exist
    // 2. All round robin matches are completed (not just no incomplete ones)
    // 3. No playoffs exist yet
    // 4. Additional validation from isRoundRobinComplete
    if (
      roundRobinMatches.length === expectedMatches &&
      completedRoundRobin.length === expectedMatches &&
      incompleteRoundRobin.length === 0 &&
      roundRobinMatches.length > 0 &&
      !hasPlayoffs &&
      tournament.isRoundRobinComplete()
    ) {
      console.log(
        `🏆 Round robin complete (${completedRoundRobin.length}/${expectedMatches} matches), auto-generating playoffs...`
      );
      tournament.generatePlayoffs();
    }
  }, [tournament.state.matches, tournament.state.teams.length, tournament]); // Watch matches and team count

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
          <Box p={8} bg="blue.50" rounded="lg" textAlign="center">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="semibold"
              color="blue.700"
              mb={4}
            >
              📋 No Tournament Generated
            </Text>
            <Text fontSize="md" color="blue.600" mb={6}>
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
          <Box textAlign="center" py={4}>
            <Text fontSize="xl" fontWeight="bold" color="blue.600" mb={1}>
              🔄 Group Stage
            </Text>
            <Text fontSize="sm" color="gray.600">
              Every team plays every other team once
            </Text>
          </Box>

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
          <Text fontSize="xl" fontWeight="bold" color="yellow.700" mb={1}>
            🏆 Playoff Stage
          </Text>
          <Text fontSize="sm" color="gray.600">
            Top teams compete for the championship
          </Text>
        </Box>

        {playoffMatches.length === 0 && (
          <Box p={6} bg="yellow.50" rounded="lg" textAlign="center">
            <Text fontSize="xl" fontWeight="bold" color="yellow.700" mb={2}>
              🚨 Playoff Matches Not Generated
            </Text>
            <Text fontSize="md" color="yellow.600">
              Playoff matches will be generated once the group stage matches are
              completed.
            </Text>
          </Box>
        )}

        {/* Playoff Matches */}
        {playoffMatches.map((match, index) => (
          <Box key={match.id} position="relative">
            {/* Special Playoff Styling Wrapper */}
            <Box
              p={1}
              bgGradient="linear(to-r, yellow.200, orange.200, yellow.200)"
              borderRadius="xl"
              _hover={{
                bgGradient: "linear(to-r, yellow.300, orange.300, yellow.300)",
                transform: "scale(1.01)",
              }}
              transition="all 0.2s ease"
            >
              <MatchCard
                key={match.id}
                match={match}
                matchNumber={index + 1}
                totalMatches={playoffMatches.length}
                isPlayoff={true}
              />
            </Box>
          </Box>
        ))}
      </VStack>

      {/* Completion Message - Only show when ALL matches are completed */}
      {allMatches.length > 0 &&
        allMatches.every((match) => match.status === "completed") && (
          <Box p={6} bg="green.50" rounded="lg" textAlign="center">
            <Text fontSize="xl" fontWeight="bold" color="green.700" mb={2}>
              🎉 Tournament Complete!
            </Text>
            <Text fontSize="md" color="green.600">
              All matches have been played. Check the standings to see the final
              results!
            </Text>
          </Box>
        )}
    </VStack>
  );
}
