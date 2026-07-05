"use client";

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { getTournamentWinner } from "@/contexts/tournament-context/engine";
import {
  useSyncTournament,
  useFinishTournament,
} from "@/lib/query/use-tournament-sync";

/**
 * Manual DB controls for a live tournament (strictly-manual sync):
 *  - Sync to DB — persists local progress, keeps playing.
 *  - Finish & Save — appears once the final is decided; saves then hands off to
 *    the read-only DB view.
 * Renders nothing for a finished (read-only) or not-yet-generated tournament.
 */
export function SyncBar() {
  const { state, isDirty, readOnly } = useLiveTournament();
  const sync = useSyncTournament();
  const finish = useFinishTournament();

  if (readOnly || !state.isGenerated) return null;

  const winner = getTournamentWinner(state);
  const busy = sync.isPending || finish.isPending;

  return (
    <Box
      bg="card.bg"
      borderWidth={1}
      borderColor="border.default"
      borderRadius="xl"
      p={3}
      mb={6}
      shadow="sm"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="center" gap={3}>
          <HStack gap={2} align="center" minW={0}>
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={isDirty ? "orange.400" : "green.400"}
              flexShrink={0}
            />
            <Text fontSize="sm" color="fg.muted" truncate>
              {isDirty ? "Unsaved changes on this device" : "Saved to database"}
            </Text>
          </HStack>

          <Button
            size="sm"
            variant="outline"
            colorPalette="blue"
            onClick={() => sync.mutate()}
            loading={sync.isPending}
            disabled={!isDirty || busy}
            flexShrink={0}
          >
            {isDirty ? "Sync to DB" : "Synced"}
          </Button>
        </HStack>

        {winner && (
          <Button
            colorPalette="green"
            w="full"
            onClick={() => finish.mutate()}
            loading={finish.isPending}
            disabled={busy}
          >
            🏁 Finish &amp; Save Tournament
          </Button>
        )}
      </VStack>
    </Box>
  );
}
