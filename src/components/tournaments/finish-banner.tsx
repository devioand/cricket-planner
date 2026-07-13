"use client";

import { Box, Heading, Text } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { getTournamentWinner } from "@/contexts/tournament-context/engine";
import { useFinishTournament } from "@/lib/query/use-tournament-sync";

/**
 * Shown at the top of the Matches list once a champion is decided (and the
 * tournament isn't already finished) — the celebratory, in-context place to
 * wrap things up. "Finish & Save" persists the final result and locks the
 * tournament read-only, so it lives here rather than in the global app bar.
 */
export function FinishBanner() {
  const { state, readOnly, hydrating } = useLiveTournament();
  const finish = useFinishTournament();

  if (hydrating || readOnly) return null;
  const winner = getTournamentWinner(state);
  if (!winner) return null;

  return (
    <Box
      bg={{ base: "green.50", _dark: "green.950" }}
      borderWidth={1}
      borderColor="green.400"
      borderRadius="2xl"
      px={5}
      py={5}
      textAlign="center"
    >
      <Text fontSize="3xl" lineHeight="1" mb={1}>
        🏁
      </Text>
      <Heading size="md" color="fg.default">
        {winner} are the champions!
      </Heading>
      <Text fontSize="sm" color="fg.muted" mt={1} mb={4}>
        Save the final result to wrap up and lock the tournament.
      </Text>
      <Button
        colorPalette="green"
        w="full"
        onClick={() => finish.mutate()}
        loading={finish.isPending}
      >
        🏁 Finish &amp; Save Tournament
      </Button>
    </Box>
  );
}
