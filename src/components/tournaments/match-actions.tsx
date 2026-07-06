"use client";

import { Box } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { TossManager } from "./toss-manager";
import type { Match } from "@/contexts/tournament-context/types";

interface MatchActionsProps {
  match: Match;
  matchState: string;
  onFinishMatch?: () => void;
}

export function MatchActions({
  match,
  matchState,
  onFinishMatch,
}: MatchActionsProps) {
  if (matchState === "completed") return null;

  // Start Match and the toss are a single step: the toss dialog's button starts
  // the match on confirm. This also covers a started match still needing a toss.
  if (matchState === "not-started" || matchState === "in-progress-need-toss") {
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
