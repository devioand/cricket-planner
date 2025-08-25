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
} from "@chakra-ui/react";
import { useState } from "react";
import {
  useTournament,
  logTournamentState,
} from "@/contexts/tournament-context";
import { runRoundRobinTests } from "@/contexts/tournament-context/algorithms/__tests__/round-robin.test";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";
import { MatchManager } from "@/components/tournaments/match-manager";

export default function Home() {
  const tournament = useTournament();
  const [teamInput, setTeamInput] = useState("");

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

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Tournament Standings */}
        {tournament.state.isGenerated && <TournamentStandings />}

        {/* Match Manager */}
        {tournament.state.isGenerated && <MatchManager />}

        <Box textAlign="center">
          <Text color="fg.muted" fontSize="lg" fontWeight="medium">
            Step 1: Round Robin Algorithm Setup
          </Text>
        </Box>

        {/* Team Input */}
        <Box>
          <Heading size="md" mb={3}>
            Teams
          </Heading>
          <HStack mb={3}>
            <Input
              placeholder="Enter team name"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button
              onClick={handleAddTeam}
              disabled={!teamInput.trim()}
              colorScheme="blue"
            >
              Add Team
            </Button>
          </HStack>

          {tournament.state.teams.length > 0 && (
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Current teams: {tournament.state.teams.length}
              </Text>
              <Flex flexWrap="wrap" gap={2}>
                {tournament.state.teams.map((team: string, index: number) => (
                  <Box
                    key={index}
                    px={3}
                    py={1}
                    bg="blue.100"
                    rounded="md"
                    fontSize="sm"
                  >
                    {team}
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </Box>

        {/* Max Overs */}
        <Box>
          <Heading size="md" mb={3}>
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
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          <Text fontSize="xs" color="gray.500" mt={1}>
            T20 = 20, ODI = 50, Test = N/A
          </Text>
        </Box>

        {/* Max Wickets */}
        <Box>
          <Heading size="md" mb={3}>
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
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Standard cricket: 10 wickets
          </Text>
        </Box>

        {/* Actions */}
        <VStack gap={3}>
          <Button
            onClick={handleGenerateMatches}
            disabled={tournament.state.teams.length < 2}
            colorScheme="green"
            size="lg"
            w="full"
          >
            Generate Round Robin Matches
          </Button>

          <Button
            onClick={() => {
              tournament.resetTournament();
              console.log("🔄 Tournament reset");
            }}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>

          <Button
            onClick={() => logTournamentState(tournament.state)}
            variant="ghost"
            size="sm"
          >
            Log Current State
          </Button>

          <Button
            onClick={runRoundRobinTests}
            variant="ghost"
            size="sm"
            colorScheme="purple"
          >
            🧪 Run Algorithm Tests
          </Button>
        </VStack>

        {/* Status Display */}
        {tournament.state.isGenerated && (
          <Box p={4} bg="green.50" rounded="md" textAlign="center">
            <Text fontWeight="semibold" color="green.700">
              ✅ Tournament Generated!
            </Text>
            <Text fontSize="sm" color="green.600">
              {tournament.state.matches.length} matches created. Check console
              for details.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
