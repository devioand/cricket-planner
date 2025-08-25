"use client";

import {
  Box,
  Button,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Flex,
  NumberInput,
  Tabs,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  useTournament,
  logTournamentState,
} from "@/contexts/tournament-context";
import { runRoundRobinTests } from "@/contexts/tournament-context/algorithms/__tests__/round-robin.test";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";
import { MatchManager } from "@/components/tournaments/match-manager";
import { PlayoffManager } from "@/components/tournaments/playoff-manager";
import { TournamentCelebration } from "@/components/tournaments/tournament-celebration";

export default function RoundRobinTournament() {
  const tournament = useTournament();
  const [teamInput, setTeamInput] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  const handleAddTeam = () => {
    if (teamInput.trim()) {
      const success = tournament.addTeam(teamInput);
      if (success) {
        setTeamInput("");
      }
    }
  };

  const handleGenerateMatches = () => {
    const result = tournament.generateMatches();
    if (result.success) {
      logTournamentState(tournament.state);
    } else if (result.errors) {
      console.error("❌ Failed to generate matches:", result.errors);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTeam();
    }
  };

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
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto" w="full">
      {/* Header */}
      <VStack gap={4} align="stretch" mb={6}>
        <Box textAlign="center">
          <Heading size={{ base: "lg", md: "xl" }} color="blue.600" mb={2}>
            🔄 Round Robin Tournament
          </Heading>
          <Text
            color="gray.600"
            fontSize={{ base: "sm", md: "md" }}
            maxW="2xl"
            mx="auto"
          >
            Every team plays every other team once. The most fair and
            comprehensive tournament format.
          </Text>
        </Box>
      </VStack>

      <Tabs.Root
        defaultValue="setup"
        variant="enclosed"
        colorPalette="blue"
        fitted
      >
        <Box overflowX="auto" mb={4}>
          <Tabs.List minW="max-content" p={{ base: 1, md: 2 }}>
            <Tabs.Trigger
              value="setup"
              fontSize={{ base: "sm", md: "md" }}
              px={{ base: 3, md: 4 }}
              py={{ base: 2, md: 3 }}
              minH={{ base: "44px", md: "48px" }}
            >
              🏏 Setup
            </Tabs.Trigger>
            <Tabs.Trigger
              value="matches"
              fontSize={{ base: "sm", md: "md" }}
              px={{ base: 3, md: 4 }}
              py={{ base: 2, md: 3 }}
              minH={{ base: "44px", md: "48px" }}
            >
              ⚽ Matches
            </Tabs.Trigger>
            <Tabs.Trigger
              value="standings"
              fontSize={{ base: "sm", md: "md" }}
              px={{ base: 3, md: 4 }}
              py={{ base: 2, md: 3 }}
              minH={{ base: "44px", md: "48px" }}
            >
              🏆 Standings
            </Tabs.Trigger>
          </Tabs.List>
        </Box>

        <Tabs.Content value="setup">
          <VStack gap={{ base: 4, md: 6 }} align="stretch">
            <Box textAlign="center">
              <Text
                color="fg.muted"
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="medium"
              >
                Tournament Setup
              </Text>
            </Box>

            {/* Team Input */}
            <Box>
              <Heading size={{ base: "sm", md: "md" }} mb={3}>
                Teams
              </Heading>
              <VStack gap={3}>
                <Flex
                  gap={2}
                  w="full"
                  direction={{ base: "column", sm: "row" }}
                >
                  <Input
                    placeholder="Enter team name"
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    size={{ base: "md", md: "lg" }}
                    flex="1"
                  />
                  <Button
                    onClick={handleAddTeam}
                    disabled={!teamInput.trim()}
                    colorScheme="blue"
                    size={{ base: "md", md: "lg" }}
                    minW={{ base: "full", sm: "120px" }}
                  >
                    Add Team
                  </Button>
                </Flex>

                {tournament.state.teams.length > 0 && (
                  <Box w="full">
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Current teams: {tournament.state.teams.length}
                    </Text>
                    <Flex flexWrap="wrap" gap={2}>
                      {tournament.state.teams.map(
                        (team: string, index: number) => (
                          <Box
                            key={index}
                            px={3}
                            py={2}
                            bg="blue.100"
                            rounded="md"
                            fontSize="sm"
                            minH="36px"
                            display="flex"
                            alignItems="center"
                          >
                            {team}
                          </Box>
                        )
                      )}
                    </Flex>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Match Settings */}
            <Flex
              gap={{ base: 4, md: 6 }}
              direction={{ base: "column", md: "row" }}
            >
              {/* Max Overs */}
              <Box flex="1">
                <Heading size={{ base: "sm", md: "md" }} mb={3}>
                  Max Overs
                </Heading>
                <NumberInput.Root
                  value={tournament.state.maxOvers.toString()}
                  min={1}
                  max={50}
                  onValueChange={(details) => {
                    const value = parseInt(details.value);
                    if (!isNaN(value)) {
                      tournament.setMaxOvers(value);
                    }
                  }}
                  size={{ base: "md", md: "lg" }}
                >
                  <NumberInput.Control />
                  <NumberInput.Input />
                </NumberInput.Root>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  T20 = 20, ODI = 50, Test = N/A
                </Text>
              </Box>

              {/* Max Wickets */}
              <Box flex="1">
                <Heading size={{ base: "sm", md: "md" }} mb={3}>
                  Max Wickets
                </Heading>
                <NumberInput.Root
                  value={tournament.state.maxWickets.toString()}
                  min={1}
                  max={11}
                  onValueChange={(details) => {
                    const value = parseInt(details.value);
                    if (!isNaN(value)) {
                      tournament.setMaxWickets(value);
                    }
                  }}
                  size={{ base: "md", md: "lg" }}
                >
                  <NumberInput.Control />
                  <NumberInput.Input />
                </NumberInput.Root>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Standard cricket: 10 wickets
                </Text>
              </Box>
            </Flex>

            {/* Actions */}
            <VStack gap={3}>
              <Button
                onClick={handleGenerateMatches}
                disabled={tournament.state.teams.length < 2}
                colorScheme="green"
                size={{ base: "lg", md: "xl" }}
                w="full"
                minH={{ base: "48px", md: "56px" }}
              >
                Generate Round Robin Matches
              </Button>

              <Flex gap={2} w="full" direction={{ base: "column", sm: "row" }}>
                <Button
                  onClick={() => {
                    tournament.resetTournament();
                    console.log("🔄 Tournament reset");
                  }}
                  variant="outline"
                  size={{ base: "md", md: "lg" }}
                  flex="1"
                >
                  Reset
                </Button>

                <Button
                  onClick={() => logTournamentState(tournament.state)}
                  variant="ghost"
                  size={{ base: "md", md: "lg" }}
                  flex="1"
                >
                  Log Current State
                </Button>

                <Button
                  onClick={runRoundRobinTests}
                  variant="ghost"
                  size={{ base: "md", md: "lg" }}
                  colorScheme="purple"
                  flex="1"
                >
                  🧪 Run Tests
                </Button>
              </Flex>
            </VStack>

            {/* Status Display */}
            {tournament.state.isGenerated && (
              <Box p={4} bg="green.50" rounded="md" textAlign="center">
                <Text
                  fontWeight="semibold"
                  color="green.700"
                  fontSize={{ base: "md", md: "lg" }}
                >
                  ✅ Tournament Generated!
                </Text>
                <Text fontSize="sm" color="green.600">
                  {tournament.state.matches.length} matches created
                </Text>
              </Box>
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="matches">
          <VStack gap={{ base: 4, md: 6 }} align="stretch">
            {!tournament.state.isGenerated ? (
              <Box p={6} bg="blue.50" rounded="md" textAlign="center">
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="semibold"
                  color="blue.700"
                  mb={2}
                >
                  📋 No Matches Available
                </Text>
                <Text fontSize="sm" color="blue.600">
                  Please generate tournament matches from the Setup tab first
                </Text>
              </Box>
            ) : (
              <>
                {/* Playoff Manager */}
                <PlayoffManager />

                {/* Match Manager */}
                <MatchManager />
              </>
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="standings">
          <VStack gap={{ base: 4, md: 6 }} align="stretch">
            {!tournament.state.isGenerated ? (
              <Box p={6} bg="yellow.50" rounded="md" textAlign="center">
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="semibold"
                  color="yellow.700"
                  mb={2}
                >
                  📊 No Standings Available
                </Text>
                <Text fontSize="sm" color="yellow.600">
                  Generate tournament matches and play some games to see
                  standings
                </Text>
              </Box>
            ) : (
              <TournamentStandings />
            )}
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      {/* Tournament Celebration */}
      <TournamentCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        winner={tournament.getTournamentWinner() || ""}
      />
    </Box>
  );
}
