"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { LuTrophy } from "react-icons/lu";
import { useTournament } from "@/contexts/tournament-context";

/**
 * Top bar shown when the user is viewing a finished (completed) tournament,
 * so it's immediately clear the tournament is over and read-only.
 */
export function CompletedBanner() {
  const tournament = useTournament();
  if (!tournament.readOnly) return null;

  const winner = tournament.getTournamentWinner();

  return (
    <Box
      mb={4}
      colorPalette="green"
      bg="colorPalette.100"
      borderWidth={1}
      borderColor="colorPalette.300"
      borderRadius="lg"
      px={4}
      py={3}
    >
      <HStack gap={2} justify="center" align="center">
        <Box color="colorPalette.600" display="flex">
          <LuTrophy />
        </Box>
        <Text fontSize="sm" fontWeight="medium" color="fg.default">
          This tournament is finished
          {winner ? (
            <>
              {" · Champion: "}
              <Text as="span" fontWeight="bold">
                {winner}
              </Text>
            </>
          ) : null}
        </Text>
      </HStack>
    </Box>
  );
}
