"use client";

import { Box, Badge, Text, VStack, HStack } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import {
  useTournament,
  formatNRR,
  type CricketTeamStats,
} from "@/contexts/tournament-context";

export function TournamentStandings() {
  const tournament = useTournament();
  const standings = tournament.getTeamStandings();

  if (standings.length === 0) {
    return (
      <Box p={4} bg="bg.subtle" borderRadius="md">
        <Text color="fg.muted" textAlign="center">
          No team statistics available. Generate matches and simulate results to
          see standings.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={{ base: 4, md: 6 }}>
      {/* Responsive Table Container */}
      <Box
        bg="card.bg"
        borderRadius="lg"
        shadow="sm"
        borderWidth={1}
        borderColor="card.border"
        overflowX="auto"
      >
        <Table.Root size={{ base: "sm", md: "md" }} variant="outline">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                Team
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="center"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                P
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="center"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                W
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="center"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                L
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="center"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                D
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="center"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                Pts
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="center"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color="fg.default"
              >
                NRR
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {standings.map((team, index) => (
              <StandingsRow
                key={team.teamName}
                team={team}
                position={index + 1}
                totalTeams={standings.length}
              />
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Legend */}
      <Box
        p={{ base: 3, md: 4 }}
        bg="bg.subtle"
        borderRadius="md"
        fontSize={{ base: "xs", md: "sm" }}
        color="fg.default"
      >
        <Text fontWeight="bold" mb={2}>
          Legend:
        </Text>
        <HStack gap={{ base: 2, md: 4 }} flexWrap="wrap">
          <Text>P - Played</Text>
          <Text>W - Won</Text>
          <Text>L - Lost</Text>
          <Text>D - Draw</Text>
          <Text>Pts - Points</Text>
          <Text>NRR - Net Run Rate</Text>
        </HStack>
        <Text fontSize="2xs" color="fg.subtle" mt={2} fontStyle="italic">
          * Statistics from group stage matches only (playoff matches excluded)
        </Text>
      </Box>
    </VStack>
  );
}

interface StandingsRowProps {
  team: CricketTeamStats;
  position: number;
  totalTeams: number;
}

function StandingsRow({ team, position, totalTeams }: StandingsRowProps) {
  // Determine how many teams qualify for playoffs
  const qualifyingTeams = totalTeams === 3 ? 2 : 4;
  const isQualified = position <= qualifyingTeams;

  return (
    <Table.Row
      bg={isQualified ? { base: "green.50", _dark: "green.900" } : "card.bg"}
      _hover={{
        bg: isQualified
          ? { base: "green.100", _dark: "green.800" }
          : "bg.subtle",
      }}
    >
      {/* Team Column */}
      <Table.Cell>
        <VStack align="start" gap={0}>
          <Text
            fontWeight="bold"
            fontSize={{ base: "sm", md: "md" }}
            color="fg.default"
          >
            {team.teamName}
          </Text>
          {team.biggestWin && (
            <Text
              fontSize={{ base: "2xs", md: "xs" }}
              color="colorPalette.600"
              colorPalette="green"
              display={{ base: "none", sm: "block" }}
            >
              Best: {team.biggestWin.margin} {team.biggestWin.marginType} vs{" "}
              {team.biggestWin.opponent}
            </Text>
          )}
        </VStack>
      </Table.Cell>

      {/* Played */}
      <Table.Cell textAlign="center">
        <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>
          {team.matchesPlayed}
        </Text>
      </Table.Cell>

      {/* Won */}
      <Table.Cell textAlign="center">
        <Badge
          colorPalette="green"
          variant="subtle"
          fontSize={{ base: "xs", md: "sm" }}
          px={{ base: 1, md: 2 }}
        >
          {team.wins}
        </Badge>
      </Table.Cell>

      {/* Lost */}
      <Table.Cell textAlign="center">
        <Badge
          colorPalette="red"
          variant="subtle"
          fontSize={{ base: "xs", md: "sm" }}
          px={{ base: 1, md: 2 }}
        >
          {team.losses}
        </Badge>
      </Table.Cell>

      {/* Draw */}
      <Table.Cell textAlign="center">
        <Badge
          colorPalette="gray"
          variant="subtle"
          fontSize={{ base: "xs", md: "sm" }}
          px={{ base: 1, md: 2 }}
        >
          {team.draws}
        </Badge>
      </Table.Cell>

      {/* Points */}
      <Table.Cell textAlign="center">
        <Badge
          colorPalette="blue"
          variant="solid"
          fontSize={{ base: "xs", md: "sm" }}
          px={{ base: 2, md: 3 }}
          py={1}
        >
          {team.points}
        </Badge>
      </Table.Cell>

      {/* Net Run Rate */}
      <Table.Cell textAlign="center">
        <Text
          fontWeight="bold"
          color={
            team.netRunRate > 0
              ? "colorPalette.600"
              : team.netRunRate < 0
              ? "colorPalette.600"
              : "fg.muted"
          }
          colorPalette={
            team.netRunRate > 0 ? "green" : team.netRunRate < 0 ? "red" : "gray"
          }
          fontSize={{ base: "sm", md: "md" }}
        >
          {formatNRR(team.netRunRate)}
        </Text>
      </Table.Cell>
    </Table.Row>
  );
}
