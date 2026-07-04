"use client";

import { Box, Text } from "@chakra-ui/react";
import { type Match } from "@/contexts/tournament-context";

interface MatchStatusProps {
  match: Match;
  matchState: string;
}

export function MatchStatus({ match, matchState }: MatchStatusProps) {
  const getStatusMessage = () => {
    switch (matchState) {
      case "not-started":
        return null; // Don't show status for not-started matches

      case "toss-done":
        const tossDoneTossWinner = match.toss?.tossWinner;
        const tossDoneDecision =
          match.toss?.decision === "bat"
            ? "elected to bat first"
            : "elected to bowl first";
        return {
          text: `🪙 ${tossDoneTossWinner} won the toss and ${tossDoneDecision}`,
          color: "colorPalette.700",
          bg: "colorPalette.50",
          colorPalette: "blue",
        };

      case "in-progress-need-toss":
        return {
          text: "Match in progress - Toss required",
          color: "colorPalette.700",
          bg: "colorPalette.50",
          colorPalette: "blue",
        };

      case "first-innings-ready":
        const firstInningsTossWinner = match.toss?.tossWinner;
        const firstInningsDecision =
          match.toss?.decision === "bat"
            ? "elected to bat first"
            : "elected to bowl first";
        return {
          text: `🪙 ${firstInningsTossWinner} won the toss and ${firstInningsDecision}`,
          color: "colorPalette.700",
          bg: "colorPalette.50",
          colorPalette: "blue",
        };

      case "first-innings-complete":
        // Determine which team batted first based on toss
        const team1BatsFirstComplete =
          match.toss?.decision === "bat"
            ? match.toss.tossWinner === match.team1
            : match.toss?.tossWinner !== match.team1;

        const firstInnings = team1BatsFirstComplete
          ? match.result?.team1Innings
          : match.result?.team2Innings;

        if (firstInnings) {
          const battingFirst = team1BatsFirstComplete
            ? match.team1
            : match.team2;
          const chasingTeam = team1BatsFirstComplete
            ? match.team2
            : match.team1;
          const target = firstInnings.runs + 1;

          return {
            text: `${battingFirst}: ${firstInnings.runs}/${firstInnings.wickets} (${firstInnings.overs}). ${chasingTeam} needs ${target} runs`,
            color: "colorPalette.700",
            bg: "colorPalette.50",
            colorPalette: "green",
          };
        }
        return {
          text: "First innings complete",
          color: "colorPalette.700",
          bg: "colorPalette.50",
          colorPalette: "green",
        };

      case "second-innings-ready":
        // Determine which team batted first based on toss
        const team1BatsFirstReady =
          match.toss?.decision === "bat"
            ? match.toss.tossWinner === match.team1
            : match.toss?.tossWinner !== match.team1;

        const firstInningsReady = team1BatsFirstReady
          ? match.result?.team1Innings
          : match.result?.team2Innings;

        if (firstInningsReady) {
          const battingFirst = team1BatsFirstReady ? match.team1 : match.team2;
          const chasingTeam = team1BatsFirstReady ? match.team2 : match.team1;
          const target = firstInningsReady.runs + 1;

          return {
            text: `${battingFirst}: ${firstInningsReady.runs}/${firstInningsReady.wickets}. ${chasingTeam} needs ${target} runs`,
            color: "colorPalette.700",
            bg: "colorPalette.50",
            colorPalette: "orange",
          };
        }
        return {
          text: "Second innings ready",
          color: "colorPalette.700",
          bg: "colorPalette.50",
          colorPalette: "blue",
        };

      case "ready-to-finish":
        return {
          text: "Both teams have played. Ready to finish the match!",
          color: "colorPalette.700",
          bg: "colorPalette.50",
          colorPalette: "purple",
        };

      case "completed":
        if (match.result) {
          // Check for tie/draw first
          if (match.result.isDraw) {
            return {
              text: `🤝 Match Tied - Both teams get 1 point`,
              color: "colorPalette.700",
              colorPalette: "orange",
            };
          }

          const winner = match.result.winner;
          const margin = match.result.margin;
          const marginType = match.result.marginType;
          const marginText =
            marginType === "runs" ? `${margin} runs` : `${margin} wickets`;

          return {
            text: `🏆 ${winner} won by ${marginText}`,
            color: "colorPalette.700",
            colorPalette: "green",
          };
        }
        break;

      default:
        return {
          text: "📋 Ready to play",
          color: "fg.muted",
          bg: "bg.subtle",
        };
    }
  };

  const status = getStatusMessage();
  if (!status) return null;

  return (
    <Box textAlign="center" colorPalette={status.colorPalette || "gray"}>
      <Text fontSize="sm" color={status.color} fontWeight="medium">
        {status.text}
      </Text>
    </Box>
  );
}
