"use client";

import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LuTrophy } from "react-icons/lu";
import type { TournamentState } from "@/contexts/tournament-context/types";
import {
  gamesToWin,
  getSeriesWinner,
  getSeriesWins,
} from "@/contexts/tournament-context/algorithms/series";

/**
 * Head-to-head scoreline for a series — replaces the points table on the
 * Series tab. With only two sides, points/NRR don't say much; the game count
 * is the whole story.
 */
export function SeriesScoreline({ state }: { state: TournamentState }) {
  const [team1, team2] = state.teams;
  if (!team1 || !team2) return null;

  const wins = getSeriesWins(state.matches, [team1, team2]);
  const winner = getSeriesWinner(
    state.matches,
    [team1, team2],
    state.seriesBestOf,
  );
  const need = gamesToWin(state.seriesBestOf);
  const played = state.matches.filter((m) => m.status === "completed").length;

  let status: string;
  if (winner) {
    const loser = winner === team1 ? team2 : team1;
    status = `${winner} win the series ${wins[winner]}-${wins[loser]}`;
  } else if (played === 0) {
    status = "Series not started";
  } else if (wins[team1] === wins[team2]) {
    status = `Series level ${wins[team1]}-${wins[team2]}`;
  } else if (wins[team1] > wins[team2]) {
    status = `${team1} lead ${wins[team1]}-${wins[team2]}`;
  } else {
    status = `${team2} lead ${wins[team2]}-${wins[team1]}`;
  }

  return (
    <Box
      borderWidth={1}
      borderColor="card.border"
      bg="card.bg"
      borderRadius="xl"
      p={6}
    >
      <HStack justify="center" mb={5}>
        <Badge
          colorPalette="brand"
          variant="subtle"
          borderRadius="full"
          px={3}
          py={1}
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.05em"
        >
          BEST OF {state.seriesBestOf} · FIRST TO {need}
        </Badge>
      </HStack>

      <HStack justify="center" align="center" gap={6}>
        <TeamScore name={team1} score={wins[team1]} isWinner={winner === team1} />
        <Text fontSize="2xl" fontWeight="bold" color="fg.muted">
          –
        </Text>
        <TeamScore name={team2} score={wins[team2]} isWinner={winner === team2} />
      </HStack>

      <HStack justify="center" align="center" gap={1.5} mt={5}>
        {winner && (
          <Box color={{ base: "gold.600", _dark: "gold.400" }} display="flex">
            <LuTrophy size={14} />
          </Box>
        )}
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color={winner ? "fg.default" : "fg.muted"}
          textAlign="center"
        >
          {status}
        </Text>
      </HStack>
    </Box>
  );
}

function TeamScore({
  name,
  score,
  isWinner,
}: {
  name: string;
  score: number;
  isWinner: boolean;
}) {
  return (
    <VStack gap={1} flex="1" minW={0}>
      <Text
        fontSize="4xl"
        fontWeight="bold"
        fontVariantNumeric="tabular-nums"
        colorPalette="brand"
        color={isWinner ? "colorPalette.600" : "fg.default"}
      >
        {score}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="medium"
        color="fg.muted"
        textAlign="center"
        truncate
        maxW="120px"
      >
        {name}
      </Text>
    </VStack>
  );
}
