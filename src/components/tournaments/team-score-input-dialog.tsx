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
import { useTournament, type Match } from "@/contexts/tournament-context";
import { toaster } from "@/components/ui/toaster";

interface TeamScoreInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  matchNumber: number;
  teamName: string;
  isTeam1: boolean;
}

export function TeamScoreInputDialog({
  isOpen,
  onClose,
  match,
  matchNumber,
  teamName,
  isTeam1,
}: TeamScoreInputDialogProps) {
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
    // Validate the currently focused team's score
    const currentTeamScore = isTeam1 ? team1Score : team2Score;
    const runs = parseInt(currentTeamScore.runs);
    const wickets = parseInt(currentTeamScore.wickets);
    const overs = parseFloat(currentTeamScore.overs);

    if (isNaN(runs) || isNaN(wickets) || isNaN(overs)) {
      toaster.create({
        title: "Invalid Input",
        description: "Please fill in all score fields with valid numbers.",
        type: "error",
        duration: 3000,
      });
      return;
    }

    if (wickets > 10) {
      toaster.create({
        title: "Invalid Wickets",
        description: "Wickets cannot be more than 10.",
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

    setIsSubmitting(true);

    try {
      // Use updateSingleInnings for step-by-step scoring
      tournament.updateSingleInnings(match.id, isTeam1, {
        runs,
        wickets,
        overs,
      });

      // Reset form and close dialog
      setTeam1Score({ runs: "", wickets: "", overs: "" });
      setTeam2Score({ runs: "", wickets: "", overs: "" });
      onClose();
    } catch (error) {
      console.error("Error submitting innings result:", error);
      toaster.create({
        title: "Submission Error",
        description: "Error submitting innings result. Please try again.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setTeam1Score({ runs: "", wickets: "", overs: "" });
    setTeam2Score({ runs: "", wickets: "", overs: "" });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Portal>
        <Dialog.Positioner>
          <Dialog.Content
            maxW="md"
            mx={4}
            bg="white"
            borderRadius="lg"
            shadow="lg"
            border="1px solid"
            borderColor="gray.200"
          >
            <Dialog.Header>
              <HStack justify="space-between" align="center" w="full">
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  {teamName}&apos;s score board
                </Dialog.Title>
                <CloseButton size="sm" onClick={handleClose} />
              </HStack>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={6}>
                {/* Match Info */}
                <Box
                  textAlign="center"
                  p={3}
                  bg={isTeam1 ? "blue.50" : "red.50"}
                  rounded="md"
                >
                  <Text
                    fontSize="md"
                    fontWeight="semibold"
                    color={isTeam1 ? "blue.700" : "red.700"}
                  >
                    Match {matchNumber}: {match.team1} vs {match.team2}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Entering score for: <strong>{teamName}</strong>
                  </Text>
                  {match.isPlayoff && (
                    <Text fontSize="sm" color="purple.600" mt={1}>
                      🏆 {match.playoffType?.replace("-", " ").toUpperCase()}
                    </Text>
                  )}
                </Box>

                {/* Current Team Score Input */}
                <VStack align="stretch" gap={4}>
                  {/* Runs - First Line */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Runs
                    </Text>
                    <Input
                      type="number"
                      placeholder="180"
                      value={isTeam1 ? team1Score.runs : team2Score.runs}
                      onChange={(e) => {
                        if (isTeam1) {
                          setTeam1Score({
                            ...team1Score,
                            runs: e.target.value,
                          });
                        } else {
                          setTeam2Score({
                            ...team2Score,
                            runs: e.target.value,
                          });
                        }
                      }}
                      size="md"
                      autoFocus
                    />
                  </Box>

                  {/* Wickets and Overs - Second Line */}
                  <HStack gap={3}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Wickets
                      </Text>
                      <Input
                        type="number"
                        placeholder="7"
                        min={0}
                        max={10}
                        value={
                          isTeam1 ? team1Score.wickets : team2Score.wickets
                        }
                        onChange={(e) => {
                          if (isTeam1) {
                            setTeam1Score({
                              ...team1Score,
                              wickets: e.target.value,
                            });
                          } else {
                            setTeam2Score({
                              ...team2Score,
                              wickets: e.target.value,
                            });
                          }
                        }}
                        size="md"
                      />
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Overs
                      </Text>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="20.0"
                        max={match.overs}
                        value={isTeam1 ? team1Score.overs : team2Score.overs}
                        onChange={(e) => {
                          if (isTeam1) {
                            setTeam1Score({
                              ...team1Score,
                              overs: e.target.value,
                            });
                          } else {
                            setTeam2Score({
                              ...team2Score,
                              overs: e.target.value,
                            });
                          }
                        }}
                        size="md"
                      />
                    </Box>
                  </HStack>
                </VStack>

                {/* Submit Button */}
                <Button
                  colorPalette="green"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !(isTeam1
                      ? team1Score.runs &&
                        team1Score.wickets &&
                        team1Score.overs
                      : team2Score.runs &&
                        team2Score.wickets &&
                        team2Score.overs)
                  }
                  size="lg"
                  w="full"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : `🏏 Submit ${teamName} Score`}
                </Button>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
