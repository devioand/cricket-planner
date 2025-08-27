"use client";

import { Box, Text, VStack, HStack, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { useTournament, type Match } from "@/contexts/tournament-context";
import { MatchStatus } from "./match-status";
import { MatchActions } from "./match-actions";
import { TeamScoreInputDialog } from "./team-score-input-dialog";

// Playoff Consequences Component
function PlayoffConsequences({ playoffType }: { playoffType?: string }) {
  const getConsequences = (type?: string) => {
    switch (type) {
      case "qualifier-1":
        return {
          winner: "goes to Final",
          loser: "goes to Qualifier 2",
        };
      case "qualifier-2":
        return {
          winner: "goes to Final",
          loser: "is out of tournament",
        };
      case "eliminator":
        return {
          winner: "goes to Qualifier 2",
          loser: "is out of tournament",
        };
      case "semi-final":
        return {
          winner: "goes to Final",
          loser: "is out of tournament",
        };
      case "final":
        return {
          winner: "becomes Champion",
          loser: "becomes Runner-up",
        };
      default:
        return {
          winner: "goes to next round",
          loser: "is out of tournament",
        };
    }
  };

  const consequences = getConsequences(playoffType);

  return (
    <Text fontSize="xs" color="gray.600" fontWeight="bold" textAlign="center">
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
}

export function MatchCard({
  match,
  matchNumber,
  totalMatches,
  isPlayoff = false,
}: MatchCardProps) {
  const [isTeam1ScoreDialogOpen, setIsTeam1ScoreDialogOpen] = useState(false);
  const [isTeam2ScoreDialogOpen, setIsTeam2ScoreDialogOpen] = useState(false);
  const tournament = useTournament();

  const isCompleted = match.status === "completed";
  const isInProgress = match.status === "in-progress";
  const hasToss = match.toss !== undefined;

  // Check if this is a TBD (To Be Determined) match
  const hasTBDTeams =
    match.team1 === "TBD" ||
    match.team2 === "TBD" ||
    match.team1.includes("TBD") ||
    match.team2.includes("TBD");

  // Determine match state for better UX
  const getMatchState = () => {
    if (isCompleted) return "completed";

    // In-progress match states
    if (isInProgress) {
      if (!hasToss) return "in-progress-need-toss";

      // Determine which team bats first based on toss
      const team1BatsFirst =
        match.toss?.decision === "bat"
          ? match.toss.tossWinner === match.team1
          : match.toss?.tossWinner !== match.team1;

      const firstInningsComplete = team1BatsFirst
        ? match.result?.team1Innings
        : match.result?.team2Innings;

      const secondInningsComplete = team1BatsFirst
        ? match.result?.team2Innings
        : match.result?.team1Innings;

      if (firstInningsComplete && secondInningsComplete)
        return "ready-to-finish";
      if (firstInningsComplete && match.secondInningsStarted)
        return "second-innings-ready";
      if (firstInningsComplete && !match.secondInningsStarted)
        return "first-innings-complete";
      return "first-innings-ready";
    }

    // Scheduled match states
    if (!hasToss) return "not-started";
    return "scheduled";
  };

  const matchState = getMatchState();
  const team1Score = match.result?.team1Innings
    ? `${match.result.team1Innings.runs}/${match.result.team1Innings.wickets} (${match.result.team1Innings.overs})`
    : "0/0 (0)";
  const team2Score = match.result?.team2Innings
    ? `${match.result.team2Innings.runs}/${match.result.team2Innings.wickets} (${match.result.team2Innings.overs})`
    : "0/0 (0)";

  // Determine which team should show edit icon based on match progression
  const shouldShowTeam1EditIcon = () => {
    if (isCompleted) return false;
    if (!hasToss) return false;

    // Determine which team bats first based on toss
    const team1BatsFirst =
      match.toss?.decision === "bat"
        ? match.toss.tossWinner === match.team1
        : match.toss?.tossWinner !== match.team1;

    // Show for team 1 if:
    // 1. First innings ready and team1 bats first
    // 2. Second innings ready and team1 bats second
    if (matchState === "first-innings-ready") {
      return team1BatsFirst && !match.result?.team1Innings;
    }

    if (matchState === "second-innings-ready") {
      return !team1BatsFirst && !match.result?.team1Innings;
    }

    return false;
  };

  const shouldShowTeam2EditIcon = () => {
    if (isCompleted) return false;
    if (!hasToss) return false;

    // Determine which team bats first based on toss
    const team1BatsFirst =
      match.toss?.decision === "bat"
        ? match.toss.tossWinner === match.team1
        : match.toss?.tossWinner !== match.team1;

    // Show for team 2 if:
    // 1. First innings ready and team2 bats first
    // 2. Second innings ready and team2 bats second
    if (matchState === "first-innings-ready") {
      return !team1BatsFirst && !match.result?.team2Innings;
    }

    if (matchState === "second-innings-ready") {
      return team1BatsFirst && !match.result?.team2Innings;
    }

    return false;
  };

  // Get playoff-specific styling
  const getCardStyling = () => {
    if (isPlayoff) {
      return {
        bg: isCompleted ? "green.50" : isInProgress ? "yellow.50" : "orange.50",
        borderColor: isCompleted
          ? "green.300"
          : isInProgress
          ? "yellow.300"
          : "orange.300",
        borderWidth: 2,
        shadow: "lg",
      };
    }
    return {
      bg: isCompleted ? "green.50" : isInProgress ? "blue.50" : "gray.50",
      borderColor: isCompleted
        ? "green.200"
        : isInProgress
        ? "blue.200"
        : "gray.200",
      borderWidth: 1,
      shadow: "sm",
    };
  };

  const cardStyle = getCardStyling();

  // Format playoff type for display
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
      >
        {/* Playoff Background Effect */}
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
              color={isPlayoff ? "orange.700" : "gray.600"}
              fontWeight={isPlayoff ? "bold" : "medium"}
              textAlign="center"
            >
              {isPlayoff
                ? (match.playoffType === "final" ? "🏆 " : "") +
                  getPlayoffDisplayText(match.playoffType)
                : `Match ${matchNumber} of ${totalMatches}`}
            </Text>
          </HStack>

          {/* Team Rows */}
          <VStack align="stretch" gap={2}>
            {/* Team 1 */}
            <HStack justify="space-between" align="center">
              <Text fontSize="md" fontWeight="medium" color="gray.800">
                👤 {match.team1}
              </Text>
              <HStack gap={2} align="center">
                {shouldShowTeam1EditIcon() && (
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
                <Text fontSize="md" fontFamily="mono" color="gray.700">
                  {team1Score}
                </Text>
              </HStack>
            </HStack>

            {/* Team 2 */}
            <HStack justify="space-between" align="center">
              <Text fontSize="md" fontWeight="medium" color="gray.800">
                👤 {match.team2}
              </Text>
              <HStack gap={2} align="center">
                {shouldShowTeam2EditIcon() && (
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
                <Text fontSize="md" fontFamily="mono" color="gray.700">
                  {team2Score}
                </Text>
              </HStack>
            </HStack>
          </VStack>

          {/* Match Status - Only show if not TBD or show TBD guidance */}
          {!hasTBDTeams ? (
            <MatchStatus match={match} matchState={matchState} />
          ) : (
            <Box
              p={3}
              bg="gray.50"
              rounded="md"
              textAlign="center"
              borderWidth={1}
              borderColor="gray.200"
            >
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                ⏳ Teams will be determined after previous matches complete
              </Text>
            </Box>
          )}

          {/* Match Actions - Only show if not TBD */}
          {!hasTBDTeams && (
            <MatchActions
              matchState={matchState}
              onStartMatch={() => tournament.startMatch(match.id)}
              onTossMatch={() => tournament.generateRandomToss(match.id)}
              onStartSecondInnings={() =>
                tournament.startSecondInnings(match.id)
              }
              onFinishMatch={() => {
                const result = tournament.completeMatch(match.id);
                if (result.nextMatchId) {
                  // Scroll to next match or focus on it
                  setTimeout(() => {
                    const nextMatchElement = document.getElementById(
                      `match-${result.nextMatchId}`
                    );
                    if (nextMatchElement) {
                      nextMatchElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }, 500);
                }
              }}
            />
          )}

          {/* Playoff Consequences */}
          {match.isPlayoff && !hasTBDTeams && (
            <PlayoffConsequences playoffType={match.playoffType} />
          )}
        </VStack>
      </Box>

      {/* Team 1 Score Input Dialog */}
      <TeamScoreInputDialog
        isOpen={isTeam1ScoreDialogOpen}
        onClose={() => setIsTeam1ScoreDialogOpen(false)}
        match={match}
        matchNumber={matchNumber}
        teamName={match.team1}
        isTeam1={true}
      />

      {/* Team 2 Score Input Dialog */}
      <TeamScoreInputDialog
        isOpen={isTeam2ScoreDialogOpen}
        onClose={() => setIsTeam2ScoreDialogOpen(false)}
        match={match}
        matchNumber={matchNumber}
        teamName={match.team2}
        isTeam1={false}
      />
    </>
  );
}
