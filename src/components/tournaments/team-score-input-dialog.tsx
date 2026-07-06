"use client";

import {
  Box,
  Text,
  VStack,
  HStack,
  Dialog,
  Portal,
  CloseButton,
  Input,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Match } from "@/contexts/tournament-context/types";
import {
  formatCricketOvers,
  isValidCricketOvers,
  displayCricketOvers,
} from "@/contexts/tournament-context/algorithms/cricket-stats";
import { useTournamentStore } from "@/contexts/tournament-context/live-provider";
import { toaster } from "@/components/ui/toaster";

interface TeamScoreInputDialogProps {
  onClose: () => void;
  match: Match;
  matchNumber: number;
  teamName: string;
  isTeam1: boolean;
}

/**
 * Mounted only while open (parent renders it conditionally), so its state is
 * fresh each time: it pre-fills an already-entered innings when re-editing,
 * otherwise defaults to the tournament's full overs and 0 wickets.
 */
export function TeamScoreInputDialog({
  onClose,
  match,
  matchNumber,
  teamName,
  isTeam1,
}: TeamScoreInputDialogProps) {
  const store = useTournamentStore();

  const existing = isTeam1
    ? match.result?.team1Innings
    : match.result?.team2Innings;
  const [score, setScore] = useState({
    runs: existing ? String(existing.runs) : "",
    wickets: existing ? String(existing.wickets) : "0",
    overs: displayCricketOvers(existing ? existing.overs : match.overs),
  });

  const handleSubmit = () => {
    const runs = parseInt(score.runs);
    const wickets = parseInt(score.wickets);
    const overs = parseFloat(score.overs);

    if (isNaN(runs) || isNaN(wickets) || isNaN(overs)) {
      toaster.create({
        title: "Invalid Input",
        description: "Please fill in all score fields with valid numbers.",
        type: "error",
        duration: 3000,
      });
      return;
    }
    if (wickets > match.maxWickets) {
      toaster.create({
        title: "Invalid Wickets",
        description: `Wickets cannot be more than ${match.maxWickets}.`,
        type: "error",
        duration: 3000,
      });
      return;
    }
    if (overs > match.overs) {
      toaster.create({
        title: "Invalid Overs",
        description: `Overs cannot be more than ${match.overs}.`,
        type: "error",
        duration: 3000,
      });
      return;
    }
    if (runs < 0 || wickets < 0 || overs < 0) {
      toaster.create({
        title: "Invalid Scores",
        description: "Scores cannot be negative.",
        type: "error",
        duration: 3000,
      });
      return;
    }
    if (!isValidCricketOvers(overs)) {
      toaster.create({
        title: "Invalid Over Format",
        description:
          "Over format should be like 3.5 (max .6 balls). Example: 15.2 means 15 overs and 2 balls.",
        type: "error",
        duration: 4000,
      });
      return;
    }

    // Persist locally (instant); the DB is written later on Sync/Finish.
    store.updateInnings(match.id, isTeam1, {
      runs,
      wickets,
      overs: formatCricketOvers(overs),
    });
    onClose();
  };

  const focusStyles = {
    borderColor: "input.focusBorder",
    boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
  };

  return (
    <Dialog.Root open onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="md"
            mx={4}
            bg="dialog.bg"
            borderRadius="lg"
            shadow="lg"
          >
            <Dialog.Header>
              <HStack justify="space-between" align="center" w="full">
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  {teamName}&apos;s score board
                </Dialog.Title>
                <CloseButton size="sm" onClick={onClose} />
              </HStack>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                {/* Match Info */}
                <Box textAlign="center" p={3} bg="bg.subtle" rounded="md">
                  <Text fontSize="md" fontWeight="semibold" color="fg.default">
                    Match {matchNumber}: {match.team1} vs {match.team2}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    Entering score for: <strong>{teamName}</strong>
                  </Text>
                  {match.isPlayoff && (
                    <Text
                      fontSize="sm"
                      color="colorPalette.600"
                      mt={1}
                      colorPalette="purple"
                    >
                      🏆 {match.playoffType?.replace("-", " ").toUpperCase()}
                    </Text>
                  )}
                </Box>

                {/* Score Inputs */}
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={2}
                      color="fg.default"
                    >
                      Runs
                    </Text>
                    <Input
                      type="number"
                      placeholder="180"
                      value={score.runs}
                      onChange={(e) =>
                        setScore({ ...score, runs: e.target.value })
                      }
                      size="md"
                      autoFocus
                      bg="input.bg"
                      borderColor="input.border"
                      color="fg.default"
                      _placeholder={{ color: "fg.placeholder" }}
                      _focus={focusStyles}
                    />
                  </Box>

                  <HStack gap={3}>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        mb={2}
                        color="fg.default"
                      >
                        Wickets
                      </Text>
                      <Input
                        type="number"
                        placeholder="0"
                        min={0}
                        max={match.maxWickets}
                        value={score.wickets}
                        onChange={(e) =>
                          setScore({ ...score, wickets: e.target.value })
                        }
                        size="md"
                        bg="input.bg"
                        borderColor="input.border"
                        color="fg.default"
                        _placeholder={{ color: "fg.placeholder" }}
                        _focus={focusStyles}
                      />
                    </Box>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        mb={2}
                        color="fg.default"
                      >
                        Overs
                      </Text>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="20.0"
                        max={match.overs}
                        value={score.overs}
                        onChange={(e) =>
                          setScore({ ...score, overs: e.target.value })
                        }
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            setScore((s) => ({
                              ...s,
                              overs: formatCricketOvers(value).toFixed(1),
                            }));
                          }
                        }}
                        size="md"
                        bg="input.bg"
                        borderColor="input.border"
                        color="fg.default"
                        _placeholder={{ color: "fg.placeholder" }}
                        _focus={focusStyles}
                      />
                    </Box>
                  </HStack>
                </VStack>

                {/* Submit */}
                <Button
                  colorPalette="blue"
                  onClick={handleSubmit}
                  disabled={!(score.runs && score.wickets && score.overs)}
                  size="lg"
                  w="full"
                >
                  Submit {teamName} Score
                </Button>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
