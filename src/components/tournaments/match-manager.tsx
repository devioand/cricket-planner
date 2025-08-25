"use client";

import {
  Box,
  Button,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  Card,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTournament, type Match } from "@/contexts/tournament-context";

interface MatchManagerProps {
  showCompleted?: boolean;
}

export function MatchManager({ showCompleted = true }: MatchManagerProps) {
  const tournament = useTournament();
  const scheduledMatches = tournament.state.matches.filter(
    (m) => m.status === "scheduled"
  );
  const completedMatches = tournament.state.matches.filter(
    (m) => m.status === "completed"
  );

  if (tournament.state.matches.length === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md">
        <Text color="gray.600" textAlign="center">
          No matches available. Generate tournament matches first.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="md">🏏 Match Manager</Heading>

      {/* Scheduled Matches */}
      {scheduledMatches.length > 0 && (
        <VStack align="stretch" gap={4}>
          <Heading size="sm" color="blue.600">
            📅 Scheduled Matches ({scheduledMatches.length})
          </Heading>
          {scheduledMatches.map((match) => (
            <MatchScoreInput key={match.id} match={match} />
          ))}
        </VStack>
      )}

      {/* Completed Matches */}
      {showCompleted && completedMatches.length > 0 && (
        <VStack align="stretch" gap={4}>
          <Heading size="sm" color="green.600">
            ✅ Completed Matches ({completedMatches.length})
          </Heading>
          {completedMatches.map((match) => (
            <CompletedMatchCard key={match.id} match={match} />
          ))}
        </VStack>
      )}

      {scheduledMatches.length === 0 && completedMatches.length > 0 && (
        <Box p={4} bg="green.50" borderRadius="md" textAlign="center">
          <Text color="green.700" fontWeight="semibold">
            🎉 All matches completed! Check the tournament standings above.
          </Text>
        </Box>
      )}
    </VStack>
  );
}

interface MatchScoreInputProps {
  match: Match;
}

function MatchScoreInput({ match }: MatchScoreInputProps) {
  const tournament = useTournament();
  const [team1Score, setTeam1Score] = useState({
    runs: "",
    wickets: "",
    overs: "",
  });
  const [team2Score, setTeam2Score] = useState({
    runs: "",
    wickets: "",
    overs: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    // Validate inputs
    const team1Runs = parseInt(team1Score.runs);
    const team1Wickets = parseInt(team1Score.wickets);
    const team1Overs = parseFloat(team1Score.overs);
    const team2Runs = parseInt(team2Score.runs);
    const team2Wickets = parseInt(team2Score.wickets);
    const team2Overs = parseFloat(team2Score.overs);

    if (
      isNaN(team1Runs) ||
      isNaN(team1Wickets) ||
      isNaN(team1Overs) ||
      isNaN(team2Runs) ||
      isNaN(team2Wickets) ||
      isNaN(team2Overs)
    ) {
      alert("Please fill in all score fields with valid numbers.");
      return;
    }

    if (team1Wickets > 10 || team2Wickets > 10) {
      alert("Wickets cannot be more than 10.");
      return;
    }

    if (team1Overs > match.overs || team2Overs > match.overs) {
      alert(`Overs cannot be more than ${match.overs}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      tournament.simulateMatchResult(
        match.id,
        { runs: team1Runs, wickets: team1Wickets, overs: team1Overs },
        { runs: team2Runs, wickets: team2Wickets, overs: team2Overs }
      );

      // Reset form
      setTeam1Score({ runs: "", wickets: "", overs: "" });
      setTeam2Score({ runs: "", wickets: "", overs: "" });
    } catch (error) {
      console.error("Error submitting match result:", error);
      alert("Error submitting match result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card.Root p={4} borderLeft="4px solid" borderColor="blue.400">
      <VStack align="stretch" gap={4}>
        {/* Match Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Text fontWeight="bold" fontSize="lg">
              {match.team1} vs {match.team2}
            </Text>
            <HStack gap={2}>
              <Badge colorScheme="blue" variant="subtle">
                {match.id}
              </Badge>
              <Badge colorScheme="gray" variant="outline">
                Round {match.round}
              </Badge>
              <Badge colorScheme="orange" variant="outline">
                {match.overs} overs
              </Badge>
            </HStack>
          </VStack>
        </HStack>

        {/* Score Input Form */}
        <Flex gap={6} direction={{ base: "column", md: "row" }}>
          {/* Team 1 Score */}
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} color="blue.600">
              {match.team1} Score:
            </Text>
            <VStack align="stretch" gap={2}>
              <HStack>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Runs
                  </Text>
                  <Input
                    type="number"
                    placeholder="180"
                    value={team1Score.runs}
                    onChange={(e) =>
                      setTeam1Score({ ...team1Score, runs: e.target.value })
                    }
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Wickets
                  </Text>
                  <Input
                    type="number"
                    placeholder="7"
                    min={0}
                    max={10}
                    value={team1Score.wickets}
                    onChange={(e) =>
                      setTeam1Score({ ...team1Score, wickets: e.target.value })
                    }
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Overs
                  </Text>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="20.0"
                    max={match.overs}
                    value={team1Score.overs}
                    onChange={(e) =>
                      setTeam1Score({ ...team1Score, overs: e.target.value })
                    }
                    size="sm"
                  />
                </Box>
              </HStack>
            </VStack>
          </Box>

          {/* Team 2 Score */}
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} color="red.600">
              {match.team2} Score:
            </Text>
            <VStack align="stretch" gap={2}>
              <HStack>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Runs
                  </Text>
                  <Input
                    type="number"
                    placeholder="175"
                    value={team2Score.runs}
                    onChange={(e) =>
                      setTeam2Score({ ...team2Score, runs: e.target.value })
                    }
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Wickets
                  </Text>
                  <Input
                    type="number"
                    placeholder="9"
                    min={0}
                    max={10}
                    value={team2Score.wickets}
                    onChange={(e) =>
                      setTeam2Score({ ...team2Score, wickets: e.target.value })
                    }
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Overs
                  </Text>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="19.4"
                    max={match.overs}
                    value={team2Score.overs}
                    onChange={(e) =>
                      setTeam2Score({ ...team2Score, overs: e.target.value })
                    }
                    size="sm"
                  />
                </Box>
              </HStack>
            </VStack>
          </Box>
        </Flex>

        {/* Submit Button */}
        <Button
          colorScheme="green"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !team1Score.runs ||
            !team1Score.wickets ||
            !team1Score.overs ||
            !team2Score.runs ||
            !team2Score.wickets ||
            !team2Score.overs
          }
          size="sm"
        >
          {isSubmitting ? "Submitting..." : "🏏 Submit Match Result"}
        </Button>
      </VStack>
    </Card.Root>
  );
}

interface CompletedMatchCardProps {
  match: Match;
}

function CompletedMatchCard({ match }: CompletedMatchCardProps) {
  if (!match.result) return null;

  const result = match.result;
  const winnerScore =
    result.team1Innings.teamName === result.winner
      ? result.team1Innings
      : result.team2Innings;
  const loserScore =
    result.team1Innings.teamName === result.loser
      ? result.team1Innings
      : result.team2Innings;

  return (
    <Card.Root p={4} borderLeft="4px solid" borderColor="green.400">
      <VStack align="stretch" gap={3}>
        {/* Match Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Text fontWeight="bold" fontSize="lg">
              {match.team1} vs {match.team2}
            </Text>
            <HStack gap={2}>
              <Badge colorScheme="green" variant="subtle">
                {match.id}
              </Badge>
              <Badge colorScheme="gray" variant="outline">
                Round {match.round}
              </Badge>
              <Badge colorScheme="green" variant="solid">
                Completed
              </Badge>
            </HStack>
          </VStack>
        </HStack>

        {/* Match Result */}
        <Box bg="gray.50" p={3} borderRadius="md">
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <Text
                fontWeight="semibold"
                color={
                  result.team1Innings.teamName === result.winner
                    ? "green.600"
                    : "gray.600"
                }
              >
                {result.team1Innings.teamName}: {result.team1Innings.runs}/
                {result.team1Innings.wickets} ({result.team1Innings.overs}{" "}
                overs)
              </Text>
              <Text fontSize="sm" color="gray.500">
                RR: {result.team1Innings.runRate.toFixed(2)}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text
                fontWeight="semibold"
                color={
                  result.team2Innings.teamName === result.winner
                    ? "green.600"
                    : "gray.600"
                }
              >
                {result.team2Innings.teamName}: {result.team2Innings.runs}/
                {result.team2Innings.wickets} ({result.team2Innings.overs}{" "}
                overs)
              </Text>
              <Text fontSize="sm" color="gray.500">
                RR: {result.team2Innings.runRate.toFixed(2)}
              </Text>
            </HStack>
            <Text
              fontWeight="bold"
              color="green.600"
              textAlign="center"
              fontSize="sm"
            >
              🏆 {result.winner} won by {result.margin} {result.marginType}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Card.Root>
  );
}
