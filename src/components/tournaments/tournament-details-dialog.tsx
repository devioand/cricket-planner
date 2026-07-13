"use client";

import {
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuSettings2, LuTrophy, LuUsers } from "react-icons/lu";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import {
  BracketPreview,
  matchCounts,
  MatchCountBanner,
  StatTile,
  SummaryCard,
  TeamChips,
} from "@/components/tournaments/tournament-summary";

/**
 * Read-only tournament details (teams, settings, playoff bracket). Opened from
 * the tournament nav's info button so the setup stays discoverable without a
 * dedicated tab taking up space.
 */
export function TournamentDetailsDialog({
  open,
  onClose,
  name,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
}) {
  const { state } = useLiveTournament();
  const counts = matchCounts(state.teams.length, state.playoffConfig);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop bg="dialog.backdrop" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="480px"
            mx={4}
            bg="dialog.bg"
            borderRadius="xl"
          >
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="lg" fontWeight="600">
                {name}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  position="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  color="fg.muted"
                  _hover={{ color: "fg.default", bg: "bg.subtle" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body pb={5}>
              <VStack align="stretch" gap={3}>
                <MatchCountBanner
                  total={counts.total}
                  group={counts.group}
                  playoffs={counts.playoffs}
                />

                <SummaryCard
                  icon={<LuUsers size={16} />}
                  title="Teams"
                  badge={`${state.teams.length}`}
                >
                  <TeamChips teams={state.teams} />
                </SummaryCard>

                <SummaryCard
                  icon={<LuSettings2 size={16} />}
                  title="Match format"
                >
                  <VStack align="stretch" gap={3}>
                    <HStack gap={2} align="baseline">
                      <Text fontSize="sm" fontWeight="medium" color="fg.default">
                        Round Robin
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        every team plays once
                      </Text>
                    </HStack>
                    <HStack gap={2.5} align="stretch">
                      <StatTile label="Overs" value={state.maxOvers} />
                      <StatTile label="Wickets" value={state.maxWickets} />
                    </HStack>
                  </VStack>
                </SummaryCard>

                <SummaryCard
                  icon={<LuTrophy size={16} />}
                  title="Playoffs"
                  badge={
                    state.playoffConfig
                      ? `Top ${state.playoffConfig.qualifiers}`
                      : "None"
                  }
                >
                  {state.playoffConfig ? (
                    <BracketPreview config={state.playoffConfig} />
                  ) : (
                    <Text fontSize="sm" color="fg.muted">
                      No knockout — the team that tops the standings is the
                      champion.
                    </Text>
                  )}
                </SummaryCard>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
