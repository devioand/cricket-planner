"use client";

import { Box } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { TossManager } from "./toss-manager";
import type { Match } from "@/contexts/tournament-context/types";

interface MatchActionsProps {
  match: Match;
  matchState: string;
  onStartMatch: () => void;
  onFinishMatch?: () => void;
}

export function MatchActions({
  match,
  matchState,
  onStartMatch,
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
    return <TossManager match={match} />;
  }

  // Toss done — the match is being played. Both teams' scores are editable via
  // the ✏️ icons; a single Finish Match button ends it.
  if (matchState === "in-progress") {
    return (
      <Box textAlign="center">
        <Button onClick={onFinishMatch} colorPalette="green" w="full">
          Finish Match
        </Button>
      </Box>
    );
  }

  return null;
}
