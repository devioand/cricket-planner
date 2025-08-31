// World Cup style playoff algorithms for cricket tournaments

import type { Match, TournamentState } from "../types";
import { getTournamentStandings } from "./cricket-stats";

// Note: Removed old generateWorldCupPlayoffMatches and generateWorldCupFinalMatches functions
// These are replaced by generateWorldCupPlayoffMatchesWithTBD which creates matches immediately
// with TBD placeholders that get populated automatically when round robin completes

/**
 * Checks if all round robin matches are complete
 */
export function isRoundRobinComplete(state: TournamentState): boolean {
  const roundRobinMatches = state.matches.filter((match) => !match.isPlayoff);
  const incompleteMatches = roundRobinMatches.filter(
    (match) => match.status === "scheduled"
  );

  return incompleteMatches.length === 0 && roundRobinMatches.length > 0;
}

/**
 * Checks if playoffs can be generated (round robin complete + minimum teams)
 */
export function canGeneratePlayoffs(state: TournamentState): {
  canGenerate: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!isRoundRobinComplete(state)) {
    reasons.push("Round robin phase must be completed first");
  }

  const standings = getTournamentStandings(state.teamStats);
  if (standings.length < 3) {
    reasons.push("Minimum 3 teams required for playoffs");
  }

  if (state.matches.some((match) => match.isPlayoff)) {
    reasons.push("Playoffs already generated");
  }

  return {
    canGenerate: reasons.length === 0,
    reasons,
  };
}

// Note: Removed canGenerateFinals function - no longer needed since all playoff matches
// are generated immediately with TBD placeholders

/**
 * Gets the current playoff phase status
 */
export function getPlayoffStatus(state: TournamentState): {
  phase: "not-started" | "semi-finals" | "finals" | "completed";
  description: string;
  nextAction?: string;
} {
  if (!isRoundRobinComplete(state)) {
    return {
      phase: "not-started",
      description: "Round robin phase in progress",
      nextAction: "Complete all round robin matches",
    };
  }

  const semiFinals = state.matches.filter(
    (match) => match.isPlayoff && match.playoffType?.startsWith("semi-final")
  );

  const finals = state.matches.filter(
    (match) => match.isPlayoff && match.playoffType === "final"
  );

  if (semiFinals.length === 0) {
    return {
      phase: "not-started",
      description: "Ready to generate playoffs",
      nextAction: "Generate playoff matches",
    };
  }

  const completedSemiFinals = semiFinals.filter(
    (match) => match.status === "completed"
  );

  if (completedSemiFinals.length < 2) {
    return {
      phase: "semi-finals",
      description: `Semi-finals in progress (${completedSemiFinals.length}/2 completed)`,
      nextAction: "Complete remaining semi-final matches",
    };
  }

  if (finals.length === 0) {
    return {
      phase: "semi-finals",
      description: "Semi-finals completed",
      nextAction: "Generate final matches",
    };
  }

  const completedFinals = finals.filter(
    (match) => match.status === "completed"
  );

  if (completedFinals.length < 1) {
    return {
      phase: "finals",
      description: "Final is ready",
      nextAction: "Complete the final match",
    };
  }

  return {
    phase: "completed",
    description: "Tournament completed!",
  };
}

/**
 * Generates world cup style playoff matches with TBD placeholders immediately
 * This function creates playoff matches at tournament start without requiring round robin completion
 */
export function generateWorldCupPlayoffMatchesWithTBD(state: TournamentState): {
  success: boolean;
  playoffMatches: Match[];
  qualifiedTeams: string[];
  errors?: string[];
} {
  const teamCount = state.teams.length;

  if (teamCount < 3) {
    return {
      success: false,
      playoffMatches: [],
      qualifiedTeams: [],
      errors: ["At least 3 teams are required for playoffs"],
    };
  }

  // For TBD generation, we assume top teams will qualify based on team count
  const playoffMatches: Match[] = [];

  // Handle 3-team tournament (Simple Final format)
  if (teamCount === 3) {
    const final: Match = {
      id: `F-001`,
      team1: "TBD", // 1st place (to be determined)
      team2: "TBD", // 2nd place (to be determined)
      round: 1,
      status: "scheduled",
      overs: state.maxOvers,
      maxWickets: state.maxWickets,
      isPlayoff: true,
      playoffType: "final",
      phase: "playoffs",
    };

    playoffMatches.push(final);

    return {
      success: true,
      playoffMatches,
      qualifiedTeams: [], // No qualified teams yet - TBD
    };
  }

  // Handle 4+ team tournament (Standard World Cup format with TBDs)

  // Semi-final 1: TBD vs TBD (1st vs 4th when determined)
  const semiFinal1: Match = {
    id: `SF-001`,
    team1: "TBD", // 1st place
    team2: "TBD", // 4th place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "semi-final-1",
    phase: "playoffs",
  };

  // Semi-final 2: TBD vs TBD (2nd vs 3rd when determined)
  const semiFinal2: Match = {
    id: `SF-002`,
    team1: "TBD", // 2nd place
    team2: "TBD", // 3rd place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "semi-final-2",
    phase: "playoffs",
  };

  // Final: TBD vs TBD (Winners of semi-finals)
  const final: Match = {
    id: `F-001`,
    team1: "TBD", // Winner of Semi-final 1
    team2: "TBD", // Winner of Semi-final 2
    round: 2,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "final",
    phase: "playoffs",
  };

  playoffMatches.push(semiFinal1, semiFinal2, final);

  return {
    success: true,
    playoffMatches,
    qualifiedTeams: [], // No qualified teams yet - TBD
  };
}
