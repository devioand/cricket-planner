"use client";

import { Box } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";

interface MatchActionsProps {
  matchState: string;
  onStartMatch: () => void;
  onTossMatch?: () => void;
  onStartSecondInnings?: () => void;
  onFinishMatch?: () => void;
}

export function MatchActions({
  matchState,
  onStartMatch,
  onTossMatch,
  onStartSecondInnings,
  onFinishMatch,
}: MatchActionsProps) {
  if (matchState === "completed") return null;

  if (matchState === "not-started") {
    return (
      <Box textAlign="center">
        <Button onClick={onStartMatch} colorPalette="blue" w="full">
          🚀 Start Match
        </Button>
      </Box>
    );
  }

  if (matchState === "in-progress-need-toss") {
    return (
      <Box textAlign="center">
        <Button onClick={onTossMatch} colorPalette="orange" w="full">
          🪙 Flip Coin & Toss
        </Button>
      </Box>
    );
  }

  if (matchState === "first-innings-ready") {
    return (
      <Box textAlign="center">
        <Button
          onClick={() =>
            toaster.create({
              title: "First Innings Required",
              description:
                "Please complete the first innings score using the ✏️ icon next to the batting team's score.",
              type: "warning",
              duration: 4000,
              closable: true,
            })
          }
          colorPalette="orange"
          w="full"
          opacity={0.5}
        >
          🏏 Start Second Innings
        </Button>
      </Box>
    );
  }

  if (matchState === "first-innings-complete") {
    return (
      <Box textAlign="center">
        <Button onClick={onStartSecondInnings} colorPalette="orange" w="full">
          🏏 Start Second Innings
        </Button>
      </Box>
    );
  }

  if (matchState === "second-innings-ready") {
    return (
      <Box textAlign="center">
        <Button
          onClick={() =>
            toaster.create({
              title: "Second Innings Required",
              description:
                "Please complete the second innings score using the ✏️ icon next to the chasing team's score.",
              type: "warning",
              duration: 4000,
              closable: true,
            })
          }
          colorPalette="green"
          w="full"
          opacity={0.5}
        >
          🏁 Finish Match
        </Button>
      </Box>
    );
  }

  if (matchState === "ready-to-finish") {
    return (
      <Box textAlign="center">
        <Button onClick={onFinishMatch} colorPalette="green" w="full">
          🏁 Finish Match
        </Button>
      </Box>
    );
  }

  return null;
}
