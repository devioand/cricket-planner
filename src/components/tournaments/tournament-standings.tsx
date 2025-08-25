"use client";

import {
  Box,
  Heading,
  Badge,
  Text,
  VStack,
  HStack,
  Button,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import {
  useTournament,
  formatNRR,
  type CricketTeamStats,
} from "@/contexts/tournament-context";

interface TournamentStandingsProps {
  showActions?: boolean;
}

export function TournamentStandings({
  showActions = true,
}: TournamentStandingsProps) {
  const tournament = useTournament();
  const standings = tournament.getTeamStandings();

  if (standings.length === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md">
        <Text color="gray.600" textAlign="center">
          No team statistics available. Generate matches and simulate results to
          see standings.
        </Text>
      </Box>
    );
  }

  const handleGenerateSampleResults = () => {
    tournament.generateSampleResults();
  };

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between" align="center">
        <Heading size="md">🏆 Tournament Standings</Heading>
        {showActions && (
          <Text fontSize="xs" color="gray.500" fontStyle="italic">
            Use Match Manager below to add scores or generate sample results
          </Text>
        )}
      </HStack>

      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row bg="gray.100">
              <Table.ColumnHeader>Pos</Table.ColumnHeader>
              <Table.ColumnHeader>Team</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">P</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">W</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">L</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">D</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">NR</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Pts</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">NRR</Table.ColumnHeader>
              <Table.ColumnHeader>For</Table.ColumnHeader>
              <Table.ColumnHeader>Against</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {standings.map((team, index) => (
              <StandingsRow
                key={team.teamName}
                team={team}
                position={index + 1}
              />
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <Box fontSize="xs" color="gray.600">
        <Text fontWeight="bold" mb={1}>
          Legend:
        </Text>
        <HStack gap={4} flexWrap="wrap">
          <Text>P - Played</Text>
          <Text>W - Won</Text>
          <Text>L - Lost</Text>
          <Text>D - Draw</Text>
          <Text>NR - No Result</Text>
          <Text>Pts - Points</Text>
          <Text>NRR - Net Run Rate</Text>
        </HStack>
      </Box>
    </VStack>
  );
}

interface StandingsRowProps {
  team: CricketTeamStats;
  position: number;
}

function StandingsRow({ team, position }: StandingsRowProps) {
  const getPositionColor = (pos: number) => {
    if (pos === 1) return "gold";
    if (pos === 2) return "gray.400";
    if (pos === 3) return "#CD7F32";
    return "gray.600";
  };

  const formatRunsAndOvers = (runs: number, overs: number) => {
    if (overs === 0) return `${runs}/0`;
    return `${runs}/${overs.toFixed(1)}`;
  };

  return (
    <Table.Row
      bg={position <= 3 ? "green.50" : "white"}
      _hover={{ bg: position <= 3 ? "green.100" : "gray.50" }}
    >
      <Table.Cell>
        <HStack gap={2}>
          <Box
            w="6"
            h="6"
            borderRadius="full"
            bg={getPositionColor(position)}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="xs"
            fontWeight="bold"
          >
            {position}
          </Box>
          {position <= 3 && (
            <Text fontSize="xs">
              {position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉"}
            </Text>
          )}
        </HStack>
      </Table.Cell>
      <Table.Cell>
        <VStack align="start" gap={0}>
          <Text fontWeight="semibold" fontSize="sm">
            {team.teamName}
          </Text>
          {team.biggestWin && (
            <Text fontSize="xs" color="green.600">
              Best: {team.biggestWin.margin} {team.biggestWin.marginType} vs{" "}
              {team.biggestWin.opponent}
            </Text>
          )}
        </VStack>
      </Table.Cell>
      <Table.Cell textAlign="right" fontWeight="semibold">
        {team.matchesPlayed}
      </Table.Cell>
      <Table.Cell textAlign="right">
        <Badge colorScheme="green" variant="subtle">
          {team.wins}
        </Badge>
      </Table.Cell>
      <Table.Cell textAlign="right">
        <Badge colorScheme="red" variant="subtle">
          {team.losses}
        </Badge>
      </Table.Cell>
      <Table.Cell textAlign="right">
        <Badge colorScheme="gray" variant="subtle">
          {team.draws}
        </Badge>
      </Table.Cell>
      <Table.Cell textAlign="right">
        <Badge colorScheme="orange" variant="subtle">
          {team.noResults}
        </Badge>
      </Table.Cell>
      <Table.Cell textAlign="right">
        <Badge colorScheme="blue" variant="solid" fontSize="sm" px={2} py={1}>
          {team.points}
        </Badge>
      </Table.Cell>
      <Table.Cell textAlign="right">
        <Text
          fontWeight="bold"
          color={
            team.netRunRate > 0
              ? "green.600"
              : team.netRunRate < 0
              ? "red.600"
              : "gray.600"
          }
          fontSize="sm"
        >
          {formatNRR(team.netRunRate)}
        </Text>
      </Table.Cell>
      <Table.Cell fontSize="xs">
        <VStack align="end" gap={0}>
          <Text>
            {formatRunsAndOvers(team.totalRunsScored, team.totalOversPlayed)}
          </Text>
          <Text color="gray.500" fontSize="2xs">
            {team.battingRunRate.toFixed(2)} RPO
          </Text>
        </VStack>
      </Table.Cell>
      <Table.Cell fontSize="xs">
        <VStack align="end" gap={0}>
          <Text>
            {formatRunsAndOvers(team.totalRunsConceded, team.totalOversBowled)}
          </Text>
          <Text color="gray.500" fontSize="2xs">
            {team.bowlingRunRate.toFixed(2)} RPO
          </Text>
        </VStack>
      </Table.Cell>
    </Table.Row>
  );
}
