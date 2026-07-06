"use client";

import { Box, Text } from "@chakra-ui/react";
import { type Match } from "@/contexts/tournament-context/types";
import { displayCricketOvers } from "@/contexts/tournament-context/algorithms/cricket-stats";

interface MatchStatusProps {
  match: Match;
  matchState: string;
}

export function MatchStatus({ match, matchState }: MatchStatusProps) {
  const getStatusMessage = () => {
    switch (matchState) {
      case "not-started":
        return null;

      case "in-progress-need-toss":
        return {
          text: "Match in progress - Toss required",
          colorPalette: "blue",
        };

      case "in-progress": {
        // Who batted first (from the toss) drives the "needs runs" narrative.
        const team1BatsFirst =
          match.toss?.decision === "bat"
            ? match.toss.tossWinner === match.team1
            : match.toss?.tossWinner !== match.team1;
        const firstTeam = team1BatsFirst ? match.team1 : match.team2;
        const secondTeam = team1BatsFirst ? match.team2 : match.team1;
        const firstInnings = team1BatsFirst
          ? match.result?.team1Innings
          : match.result?.team2Innings;
        const secondInnings = team1BatsFirst
          ? match.result?.team2Innings
          : match.result?.team1Innings;

        if (!firstInnings && !secondInnings) {
          const decision =
            match.toss?.decision === "bat"
              ? "elected to bat first"
              : "elected to bowl first";
          return {
            text: `🪙 ${match.toss?.tossWinner} won the toss and ${decision}`,
            colorPalette: "blue",
          };
        }

        if (firstInnings && !secondInnings) {
          return {
            text: `${firstTeam}: ${firstInnings.runs}/${firstInnings.wickets} (${displayCricketOvers(firstInnings.overs)}). ${secondTeam} needs ${firstInnings.runs + 1} runs`,
            colorPalette: "green",
          };
        }

        if (!firstInnings && secondInnings) {
          return {
            text: `${secondTeam}: ${secondInnings.runs}/${secondInnings.wickets} (${displayCricketOvers(secondInnings.overs)}). ${firstTeam} yet to bat`,
            colorPalette: "orange",
          };
        }

        return {
          text: "Both innings recorded - ready to finish the match!",
          colorPalette: "purple",
        };
      }

      case "completed":
        if (!match.result) return null;
        if (match.result.isNoResult || match.result.matchType === "no-result") {
          return {
            text: "🤝 No result - Both teams get 1 point",
            colorPalette: "orange",
          };
        }
        if (match.result.isDraw) {
          return {
            text: "🤝 Match Tied - Both teams get 1 point",
            colorPalette: "orange",
          };
        }
        return {
          text: `🏆 ${match.result.winner} won by ${match.result.margin} ${
            match.result.marginType === "runs" ? "runs" : "wickets"
          }`,
          colorPalette: "green",
        };

      default:
        return null;
    }
  };

  const status = getStatusMessage();
  if (!status) return null;

  return (
    <Box textAlign="center" colorPalette={status.colorPalette}>
      <Text fontSize="sm" color="colorPalette.700" fontWeight="medium">
        {status.text}
      </Text>
    </Box>
  );
}
