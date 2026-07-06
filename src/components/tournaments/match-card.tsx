"use client";

import { Box, Text, VStack, HStack, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import type { Match } from "@/contexts/tournament-context/types";
import { displayCricketOvers } from "@/contexts/tournament-context/algorithms/cricket-stats";
import { MatchStatus } from "./match-status";
import { MatchActions } from "./match-actions";
import { TeamScoreInputDialog } from "./team-score-input-dialog";
import { TournamentCelebration } from "./tournament-celebration";
import { FinishMatchDialog } from "./finish-match-dialog";
import { useTournamentStore } from "@/contexts/tournament-context/live-provider";
import { toaster } from "@/components/ui/toaster";

// Playoff Consequences Component
function PlayoffConsequences({ playoffType }: { playoffType?: string }) {
  const getConsequences = (type?: string) => {
    switch (type) {
      case "qualifier-1":
        return { winner: "goes to Final", loser: "goes to Qualifier 2" };
      case "qualifier-2":
        return { winner: "goes to Final", loser: "is out of tournament" };
      case "eliminator":
        return { winner: "goes to Qualifier 2", loser: "is out of tournament" };
      case "semi-final":
        return { winner: "goes to Final", loser: "is out of tournament" };
      case "final":
        return { winner: "becomes Champion", loser: "becomes Runner-up" };
      default:
        return { winner: "goes to next round", loser: "is out of tournament" };
    }
  };

  const consequences = getConsequences(playoffType);

  return (
    <Text fontSize="xs" color="fg.muted" fontWeight="bold" textAlign="center">
      Note: Winner {consequences.winner.toLowerCase()} and loser{" "}
      {consequences.loser.toLowerCase()}.
    </Text>
  );
}

interface MatchCardProps {
  match: Match;
  matchNumber: number;
  totalMatches: number;
  isPlayoff?: boolean;
  readOnly?: boolean;
}

export function MatchCard({
  match,
  matchNumber,
  totalMatches,
  isPlayoff = false,
  readOnly = false,
}: MatchCardProps) {
  const [isTeam1ScoreDialogOpen, setIsTeam1ScoreDialogOpen] = useState(false);
  const [isTeam2ScoreDialogOpen, setIsTeam2ScoreDialogOpen] = useState(false);
  const [celebrationWinner, setCelebrationWinner] = useState<string | null>(
    null
  );
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const store = useTournamentStore();

  const isCompleted = match.status === "completed";
  const isInProgress = match.status === "in-progress";
  const isDraw = !!match.result?.isDraw;
  const hasToss = match.toss !== undefined;

  const hasTBDTeams =
    match.team1 === "TBD" ||
    match.team2 === "TBD" ||
    match.team1.includes("TBD") ||
    match.team2.includes("TBD");

  const getMatchState = () => {
    if (isCompleted) return "completed";
    if (isInProgress) {
      // After the toss the match is simply "in progress": both scores are
      // editable and there is a single Finish Match button.
      return hasToss ? "in-progress" : "in-progress-need-toss";
    }
    return "not-started";
  };

  const matchState = getMatchState();
  const team1Score = match.result?.team1Innings
    ? `${match.result.team1Innings.runs}/${
        match.result.team1Innings.wickets
      } (${displayCricketOvers(match.result.team1Innings.overs)})`
    : "0/0 (0.0)";
  const team2Score = match.result?.team2Innings
    ? `${match.result.team2Innings.runs}/${
        match.result.team2Innings.wickets
      } (${displayCricketOvers(match.result.team2Innings.overs)})`
    : "0/0 (0.0)";

  // After the toss, both teams' scores are editable at any time until the match
  // is finished (no more first/second-innings sequencing).
  const canEditScores = hasToss && !isCompleted && !readOnly && !hasTBDTeams;

  const getCardStyling = () => {
    const colorSchemes = {
      draw: { bg: "card.bg", borderColor: "red.300" },
      completed: {
        bg: "card.bg",
        borderColor: isPlayoff ? "green.500" : "green.400",
      },
      inProgress: {
        bg: "card.bg",
        borderColor: isPlayoff ? "yellow.300" : "blue.300",
      },
      scheduled: {
        bg: "card.bg",
        borderColor: isPlayoff ? "orange.300" : "border.default",
      },
    };

    let key: keyof typeof colorSchemes;
    if (isCompleted && isDraw) key = "draw";
    else if (isCompleted) key = "completed";
    else if (isInProgress) key = "inProgress";
    else key = "scheduled";

    return { ...colorSchemes[key], borderWidth: 2, shadow: "sm" };
  };

  const cardStyle = getCardStyling();

  const getPlayoffDisplayText = (playoffType?: string) => {
    if (!playoffType) return "";
    switch (playoffType) {
      case "semi-final-1":
        return "Semi Final - 1";
      case "semi-final-2":
        return "Semi Final - 2";
      case "qualifier-1":
        return "Qualifier 1";
      case "qualifier-2":
        return "Qualifier 2";
      case "eliminator":
        return "Eliminator";
      case "final":
        return "Final";
      default:
        return playoffType
          .replace("-", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const scrollToNext = (nextMatchId?: string | null) => {
    if (!nextMatchId) return;
    setTimeout(() => {
      document
        .getElementById(`match-${nextMatchId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  };

  const handleFinishMatch = () => {
    const bothScores =
      !!match.result?.team1Innings && !!match.result?.team2Innings;

    // Common path: both scores in → finish with a result (instant, local).
    if (bothScores) {
      const r = store.finishMatch(match.id);
      if (r.complete && r.winner) setCelebrationWinner(r.winner);
      else scrollToNext(r.nextMatchId);
      return;
    }

    // Scores incomplete. A playoff needs a winner; a group match can be a
    // No Result (both teams get 1 point).
    if (match.isPlayoff) {
      toaster.create({
        title: "Scores required",
        description: "Enter both teams' scores to finish a playoff match.",
        type: "warning",
        duration: 4000,
        closable: true,
      });
      return;
    }
    setIsFinishDialogOpen(true);
  };

  const handleConfirmNoResult = () => {
    setIsFinishDialogOpen(false);
    const r = store.completeAsNoResult(match.id);
    scrollToNext(r.nextMatchId);
  };

  return (
    <>
      <Box
        id={`match-${match.id}`}
        p={isPlayoff ? 6 : 4}
        bg={cardStyle.bg}
        borderRadius="lg"
        borderWidth={cardStyle.borderWidth}
        borderColor={cardStyle.borderColor}
        shadow={cardStyle.shadow}
        position="relative"
        overflow="hidden"
        _hover={{ transform: "scale(1.01)", shadow: "md" }}
        transition="all 0.2s ease"
      >
        {isPlayoff && (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            opacity="0.05"
            bgImage="radial-gradient(circle, gold 2px, transparent 2px)"
            bgSize="30px 30px"
            pointerEvents="none"
          />
        )}

        <VStack align="stretch" gap={isPlayoff ? 4 : 3} position="relative">
          {/* Match Header */}
          <HStack justify="center" align="center">
            <Text
              fontSize={isPlayoff ? "lg" : "sm"}
              color={isPlayoff ? "colorPalette.700" : "fg.muted"}
              fontWeight={isPlayoff ? "bold" : "medium"}
              textAlign="center"
              colorPalette="orange"
            >
              {isPlayoff
                ? (match.playoffType === "final" ? "🏆 " : "") +
                  getPlayoffDisplayText(match.playoffType)
                : `Match ${matchNumber} of ${totalMatches}`}
            </Text>
          </HStack>

          {/* Team Rows */}
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align="center">
              <Text fontSize="md" fontWeight="medium" color="fg.default">
                👤 {match.team1}
              </Text>
              <HStack gap={2} align="center">
                {canEditScores && (
                  <IconButton
                    aria-label="Edit team 1 score"
                    size="xs"
                    variant="ghost"
                    colorPalette="blue"
                    onClick={() => setIsTeam1ScoreDialogOpen(true)}
                  >
                    ✏️
                  </IconButton>
                )}
                <Text fontSize="md" fontFamily="mono" color="fg.default">
                  {team1Score}
                </Text>
              </HStack>
            </HStack>

            <HStack justify="space-between" align="center">
              <Text fontSize="md" fontWeight="medium" color="fg.default">
                👤 {match.team2}
              </Text>
              <HStack gap={2} align="center">
                {canEditScores && (
                  <IconButton
                    aria-label="Edit team 2 score"
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => setIsTeam2ScoreDialogOpen(true)}
                  >
                    ✏️
                  </IconButton>
                )}
                <Text fontSize="md" fontFamily="mono" color="fg.default">
                  {team2Score}
                </Text>
              </HStack>
            </HStack>
          </VStack>

          {/* Match Status */}
          {!hasTBDTeams ? (
            <MatchStatus match={match} matchState={matchState} />
          ) : (
            <Box
              p={3}
              bg="bg.subtle"
              rounded="md"
              textAlign="center"
              borderWidth={1}
              borderColor="border.subtle"
            >
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                ⏳ Teams will be determined after previous matches complete
              </Text>
            </Box>
          )}

          {/* Match Actions */}
          {!hasTBDTeams && !readOnly && (
            <MatchActions
              match={match}
              matchState={matchState}
              onFinishMatch={handleFinishMatch}
            />
          )}

          {/* Playoff Consequences */}
          {match.isPlayoff && !hasTBDTeams && (
            <PlayoffConsequences playoffType={match.playoffType} />
          )}
        </VStack>
      </Box>

      {/* Score Input Dialogs */}
      {isTeam1ScoreDialogOpen && (
        <TeamScoreInputDialog
          onClose={() => setIsTeam1ScoreDialogOpen(false)}
          match={match}
          matchNumber={matchNumber}
          teamName={match.team1}
          isTeam1={true}
        />
      )}
      {isTeam2ScoreDialogOpen && (
        <TeamScoreInputDialog
          onClose={() => setIsTeam2ScoreDialogOpen(false)}
          match={match}
          matchNumber={matchNumber}
          teamName={match.team2}
          isTeam1={false}
        />
      )}

      {/* Champion celebration (shown when finishing the final) */}
      <TournamentCelebration
        isOpen={celebrationWinner !== null}
        onClose={() => setCelebrationWinner(null)}
        winner={celebrationWinner || ""}
      />

      {/* Finish a group match that wasn't played (No Result) */}
      <FinishMatchDialog
        isOpen={isFinishDialogOpen}
        onClose={() => setIsFinishDialogOpen(false)}
        match={match}
        onNoResult={handleConfirmNoResult}
      />
    </>
  );
}
