"use client";

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Alert,
} from "@chakra-ui/react";
import { useTournament, type Match } from "@/contexts/tournament-context";

interface PlayoffManagerProps {
  showCompleted?: boolean;
}

export function PlayoffManager({
  showCompleted: _showCompleted = true, // eslint-disable-line @typescript-eslint/no-unused-vars
}: PlayoffManagerProps) {
  const tournament = useTournament();
  const playoffStatus = tournament.getPlayoffStatus();
  const canGeneratePlayoffs = tournament.canGeneratePlayoffs();
  const canGenerateFinals = tournament.canGenerateFinals();

  // Filter playoff matches from main matches array (where results are updated)
  const semiFinals = tournament.state.matches.filter(
    (match) => match.isPlayoff && match.playoffType?.startsWith("semi-final")
  );
  const finals = tournament.state.matches.filter(
    (match) => match.isPlayoff && match.playoffType === "final"
  );

  const handleGeneratePlayoffs = () => {
    const result = tournament.generatePlayoffs();
    if (!result.success && result.errors) {
      console.error("Failed to generate playoffs:", result.errors);
    }
  };

  const handleGenerateFinals = () => {
    const result = tournament.generateFinals();
    if (!result.success && result.errors) {
      console.error("Failed to generate finals:", result.errors);
    }
  };

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="md">🏆 Playoff Management</Heading>

      {/* Playoff Status */}
      <PlayoffStatusCard
        status={playoffStatus}
        canGeneratePlayoffs={canGeneratePlayoffs}
        canGenerateFinals={canGenerateFinals}
        onGeneratePlayoffs={handleGeneratePlayoffs}
        onGenerateFinals={handleGenerateFinals}
      />

      {/* Qualified Teams */}
      {tournament.state.qualifiedTeams.length > 0 && (
        <Box>
          <Heading size="sm" mb={3} color="green.600">
            🎯 Qualified Teams
          </Heading>
          <HStack flexWrap="wrap" gap={2}>
            {tournament.state.qualifiedTeams.map((team, index) => (
              <Badge
                key={team}
                colorPalette={
                  index === 0
                    ? "gold"
                    : index === 1
                    ? "gray"
                    : index === 2
                    ? "orange"
                    : "blue"
                }
                variant="solid"
                fontSize="sm"
                px={3}
                py={1}
              >
                #{index + 1} {team}
              </Badge>
            ))}
          </HStack>
        </Box>
      )}

      {/* World Cup Style Matches */}
      {tournament.state.playoffFormat === "world-cup" &&
        semiFinals.length > 0 && (
          <VStack align="stretch" gap={4}>
            <Heading size="sm" color="purple.600">
              ⚡ Semi-Finals
            </Heading>
            {semiFinals.map((match) => (
              <PlayoffMatchCard key={match.id} match={match} />
            ))}
          </VStack>
        )}

      {/* League Style Matches */}
      {tournament.state.playoffFormat === "league" && (
        <>
          {/* Qualification Round */}
          {tournament.state.matches.filter(
            (m) =>
              m.isPlayoff &&
              (m.playoffType === "qualifier-1" ||
                m.playoffType === "eliminator")
          ).length > 0 && (
            <VStack align="stretch" gap={4}>
              <Heading size="sm" color="blue.600">
                🎯 Qualification Round
              </Heading>
              {tournament.state.matches
                .filter(
                  (m) =>
                    m.isPlayoff &&
                    (m.playoffType === "qualifier-1" ||
                      m.playoffType === "eliminator")
                )
                .map((match) => (
                  <PlayoffMatchCard key={match.id} match={match} />
                ))}
            </VStack>
          )}

          {/* Qualifier 2 */}
          {tournament.state.matches.filter(
            (m) => m.isPlayoff && m.playoffType === "qualifier-2"
          ).length > 0 && (
            <VStack align="stretch" gap={4}>
              <Heading size="sm" color="purple.600">
                🔥 Qualifier 2
              </Heading>
              {tournament.state.matches
                .filter((m) => m.isPlayoff && m.playoffType === "qualifier-2")
                .map((match) => (
                  <PlayoffMatchCard key={match.id} match={match} />
                ))}
            </VStack>
          )}
        </>
      )}

      {/* Finals (Both Formats) */}
      {finals.length > 0 && (
        <VStack align="stretch" gap={4}>
          <Heading size="sm" color="gold.600">
            🏆 Finals
          </Heading>
          {finals.map((match) => (
            <PlayoffMatchCard key={match.id} match={match} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

interface PlayoffStatusCardProps {
  status: {
    phase:
      | "not-started"
      | "semi-finals"
      | "finals"
      | "completed"
      | "qualification"
      | "qualifier-2"
      | "final-ready";
    description: string;
    nextAction?: string;
  };
  canGeneratePlayoffs: { canGenerate: boolean; reasons: string[] };
  canGenerateFinals: { canGenerate: boolean; reasons: string[] };
  onGeneratePlayoffs: () => void;
  onGenerateFinals: () => void;
}

function PlayoffStatusCard({
  status,
  canGeneratePlayoffs,
  canGenerateFinals,
  onGeneratePlayoffs,
  onGenerateFinals,
}: PlayoffStatusCardProps) {
  const getStatusColor = (phase: string) => {
    switch (phase) {
      case "not-started":
        return "gray";
      case "semi-finals":
      case "qualification":
        return "blue";
      case "qualifier-2":
        return "purple";
      case "finals":
      case "final-ready":
        return "purple";
      case "completed":
        return "green";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (phase: string) => {
    switch (phase) {
      case "not-started":
        return "⏳";
      case "semi-finals":
        return "⚡";
      case "qualification":
        return "🎯";
      case "qualifier-2":
        return "🔥";
      case "finals":
      case "final-ready":
        return "🏆";
      case "completed":
        return "🎉";
      default:
        return "❓";
    }
  };

  return (
    <Card.Root>
      <Card.Body p={4}>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <Text fontSize="2xl">{getStatusIcon(status.phase)}</Text>
              <VStack align="start" gap={0}>
                <Badge
                  colorPalette={getStatusColor(status.phase)}
                  variant="solid"
                  textTransform="capitalize"
                >
                  {status.phase.replace("-", " ")}
                </Badge>
                <Text fontWeight="semibold">{status.description}</Text>
              </VStack>
            </HStack>
          </HStack>

          {status.nextAction && (
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
              Next: {status.nextAction}
            </Text>
          )}

          {/* Action Buttons */}
          <HStack gap={3}>
            {canGeneratePlayoffs.canGenerate && (
              <Button
                colorPalette="blue"
                onClick={onGeneratePlayoffs}
                size="sm"
              >
                🏆 Generate Playoffs
              </Button>
            )}

            {canGenerateFinals.canGenerate && (
              <Button
                colorPalette="purple"
                onClick={onGenerateFinals}
                size="sm"
              >
                🔄 Update Playoff Teams
              </Button>
            )}
          </HStack>

          {/* Error Messages */}
          {!canGeneratePlayoffs.canGenerate &&
            canGeneratePlayoffs.reasons.length > 0 && (
              <Alert.Root status="info" size="sm">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Cannot generate playoffs:</Alert.Title>
                  <Alert.Description>
                    <VStack align="start" gap={1}>
                      {canGeneratePlayoffs.reasons.map((reason, index) => (
                        <Text key={index} fontSize="sm">
                          • {reason}
                        </Text>
                      ))}
                    </VStack>
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

          {!canGenerateFinals.canGenerate &&
            canGenerateFinals.reasons.length > 0 &&
            status.phase === "semi-finals" && (
              <Alert.Root status="info" size="sm">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Cannot generate finals:</Alert.Title>
                  <Alert.Description>
                    <VStack align="start" gap={1}>
                      {canGenerateFinals.reasons.map((reason, index) => (
                        <Text key={index} fontSize="sm">
                          • {reason}
                        </Text>
                      ))}
                    </VStack>
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

interface PlayoffMatchCardProps {
  match: Match;
}

function PlayoffMatchCard({ match }: PlayoffMatchCardProps) {
  const getMatchTypeDisplay = (playoffType?: string) => {
    switch (playoffType) {
      case "semi-final-1":
        return "Semi-Final 1";
      case "semi-final-2":
        return "Semi-Final 2";
      case "qualifier-1":
        return "Qualifier 1";
      case "eliminator":
        return "Eliminator";
      case "qualifier-2":
        return "Qualifier 2";
      case "final":
        return "Final";
      default:
        return "Playoff Match";
    }
  };

  const getMatchTypeColor = (playoffType?: string) => {
    switch (playoffType) {
      case "semi-final-1":
      case "semi-final-2":
        return "purple";
      case "qualifier-1":
        return "blue";
      case "eliminator":
        return "red";
      case "qualifier-2":
        return "purple";
      case "final":
        return "gold";
      default:
        return "blue";
    }
  };

  const getMatchTypeIcon = (playoffType?: string) => {
    switch (playoffType) {
      case "semi-final-1":
      case "semi-final-2":
        return "⚡";
      case "qualifier-1":
        return "🎯";
      case "eliminator":
        return "💥";
      case "qualifier-2":
        return "🔥";
      case "final":
        return "🏆";
      default:
        return "🏏";
    }
  };

  return (
    <Card.Root
      borderLeft="4px solid"
      borderColor={`${getMatchTypeColor(match.playoffType)}.400`}
    >
      <Card.Body p={4}>
        <VStack align="stretch" gap={3}>
          {/* Match Header */}
          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <Text fontSize="xl">{getMatchTypeIcon(match.playoffType)}</Text>
              <VStack align="start" gap={0}>
                <Badge
                  colorPalette={getMatchTypeColor(match.playoffType)}
                  variant="solid"
                >
                  {getMatchTypeDisplay(match.playoffType)}
                </Badge>
                <Text fontWeight="bold" fontSize="lg">
                  {match.team1} vs {match.team2}
                </Text>
              </VStack>
            </HStack>
            <VStack align="end" gap={1}>
              <Badge
                colorPalette={match.status === "completed" ? "green" : "blue"}
                variant={match.status === "completed" ? "solid" : "outline"}
              >
                {match.status}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {match.overs} overs
              </Text>
            </VStack>
          </HStack>

          {/* Match Result */}
          {match.result &&
            match.result.team1Innings &&
            match.result.team2Innings && (
              <Box bg="green.50" p={3} borderRadius="md">
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text
                      fontWeight="semibold"
                      color={
                        match.result.team1Innings.teamName ===
                        match.result.winner
                          ? "green.600"
                          : "gray.600"
                      }
                    >
                      {match.result.team1Innings.teamName}:{" "}
                      {match.result.team1Innings.runs}/
                      {match.result.team1Innings.wickets} (
                      {match.result.team1Innings.overs} overs)
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      RR: {match.result.team1Innings.runRate.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text
                      fontWeight="semibold"
                      color={
                        match.result.team2Innings.teamName ===
                        match.result.winner
                          ? "green.600"
                          : "gray.600"
                      }
                    >
                      {match.result.team2Innings.teamName}:{" "}
                      {match.result.team2Innings.runs}/
                      {match.result.team2Innings.wickets} (
                      {match.result.team2Innings.overs} overs)
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      RR: {match.result.team2Innings.runRate.toFixed(2)}
                    </Text>
                  </HStack>
                  <Text
                    fontWeight="bold"
                    color="green.600"
                    textAlign="center"
                    fontSize="sm"
                  >
                    🏆 {match.result.winner} won by {match.result.margin}{" "}
                    {match.result.marginType}
                  </Text>
                </VStack>
              </Box>
            )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
