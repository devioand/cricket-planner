// Cricket Statistics and Net Run Rate Calculations

import {
  CricketTeamStats,
  CricketMatchResult,
  InningsScore,
  Match,
} from "../types";

/**
 * Initialize empty team statistics
 */
export function initializeTeamStats(teamName: string): CricketTeamStats {
  return {
    teamName,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    noResults: 0,
    points: 0,
    totalRunsScored: 0,
    totalBallsFaced: 0,
    totalOversPlayed: 0,
    totalRunsConceded: 0,
    totalBallsBowled: 0,
    totalOversBowled: 0,
    battingRunRate: 0,
    bowlingRunRate: 0,
    netRunRate: 0,
  };
}

/**
 * Convert balls to cricket overs notation (e.g., 31 balls = 5.1 overs)
 */
export function ballsToOvers(balls: number): number {
  const completeOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return Number((completeOvers + remainingBalls / 10).toFixed(1));
}

/**
 * Convert cricket overs notation to total balls (e.g., 5.2 overs = 32 balls)
 */
export function oversToBalls(overs: number): number {
  const completeOvers = Math.floor(overs);
  const fractionalPart = overs - completeOvers;
  const remainingBalls = Math.round(fractionalPart * 10);
  return completeOvers * 6 + remainingBalls;
}

/**
 * Format overs input to proper cricket format (max .6)
 * Converts invalid decimals like 3.7 to 4.1, 3.12 to 5.0, etc.
 */
export function formatCricketOvers(input: number): number {
  const completeOvers = Math.floor(input);
  const fractionalPart = input - completeOvers;

  // Convert fractional part to balls (multiply by 10 to handle .1, .2, etc.)
  const balls = Math.round(fractionalPart * 10);

  // If balls > 6, convert to additional overs
  const extraOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;

  return completeOvers + extraOvers + remainingBalls / 10;
}

/**
 * Validate if overs input is in proper cricket format (.0 to .6)
 */
export function isValidCricketOvers(overs: number): boolean {
  const fractionalPart = overs - Math.floor(overs);
  const balls = Math.round(fractionalPart * 10);
  return balls >= 0 && balls <= 6;
}

/**
 * Format overs for display with exactly 1 decimal place for cricket format
 */
export function displayCricketOvers(overs: number): string {
  const formatted = formatCricketOvers(overs);
  return formatted.toFixed(1);
}

/**
 * Calculate run rate from runs and overs
 */
export function calculateRunRate(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return Number((runs / overs).toFixed(3));
}

/**
 * Calculate Net Run Rate according to ICC rules
 * NRR = (Runs scored / Overs faced) - (Runs conceded / Overs bowled)
 */
export function calculateNetRunRate(stats: CricketTeamStats): number {
  // For batting: total runs scored / total overs faced
  const battingRunRate =
    stats.totalOversPlayed > 0
      ? stats.totalRunsScored / stats.totalOversPlayed
      : 0;

  // For bowling: total runs conceded / total overs bowled
  const bowlingRunRate =
    stats.totalOversBowled > 0
      ? stats.totalRunsConceded / stats.totalOversBowled
      : 0;

  const nrr = battingRunRate - bowlingRunRate;

  return Number(nrr.toFixed(3));
}

/**
 * Update team statistics after a match
 * Handles all the nuances mentioned in the NRR calculation rules
 * NOTE: Only updates stats for round-robin matches, not playoff matches
 */
export function updateTeamStatsAfterMatch(
  teamStats: CricketTeamStats,
  match: Match,
  matchResult: CricketMatchResult
): CricketTeamStats {
  // Skip playoff matches - standings should only include round-robin stats
  if (match.isPlayoff) {
    return teamStats; // Return unchanged stats
  }

  const updatedStats = { ...teamStats };
  const isTeam1 = match.team1 === teamStats.teamName;
  const teamInnings = isTeam1
    ? matchResult.team1Innings
    : matchResult.team2Innings;
  const opponentInnings = isTeam1
    ? matchResult.team2Innings
    : matchResult.team1Innings;

  // Early return if innings data is missing - can't update stats without complete data
  if (!teamInnings || !opponentInnings) {
    return updatedStats;
  }

  // Update match counts
  updatedStats.matchesPlayed += 1;

  // Handle different match outcomes
  if (matchResult.matchType === "no-result" || matchResult.isNoResult) {
    updatedStats.noResults += 1;
    // No points awarded for no results
    return updatedStats;
  }

  if (matchResult.isDraw) {
    updatedStats.draws += 1;
    updatedStats.points += 1; // Usually 1 point for a draw
  } else if (matchResult.winner === teamStats.teamName) {
    updatedStats.wins += 1;
    updatedStats.points += 2; // Standard 2 points for a win
  } else {
    updatedStats.losses += 1;
    // No points for a loss
  }

  // Update batting statistics
  updatedStats.totalRunsScored += teamInnings.runs;
  updatedStats.totalBallsFaced += teamInnings.ballsFaced;

  // For overs calculation - use full quota if team was all out
  const oversForNRR =
    teamInnings.isAllOut && teamInnings.overs < match.overs
      ? match.overs // Use full quota for NRR calculation when all out
      : teamInnings.overs; // Use actual overs when not all out

  updatedStats.totalOversPlayed += oversForNRR;

  // Update bowling statistics
  updatedStats.totalRunsConceded += opponentInnings.runs;
  updatedStats.totalBallsBowled += opponentInnings.ballsFaced;

  // Similar rule for opponent overs
  const opponentOversForNRR =
    opponentInnings.isAllOut && opponentInnings.overs < match.overs
      ? match.overs
      : opponentInnings.overs;

  updatedStats.totalOversBowled += opponentOversForNRR;

  // Update highest/lowest scores
  if (
    !updatedStats.highestScore ||
    teamInnings.runs > updatedStats.highestScore
  ) {
    updatedStats.highestScore = teamInnings.runs;
  }

  if (
    !updatedStats.lowestScore ||
    teamInnings.runs < updatedStats.lowestScore
  ) {
    updatedStats.lowestScore = teamInnings.runs;
  }

  // Update biggest win
  if (matchResult.winner === teamStats.teamName && matchResult.margin) {
    if (
      !updatedStats.biggestWin ||
      (matchResult.marginType === "runs" &&
        matchResult.margin > (updatedStats.biggestWin.margin || 0)) ||
      (matchResult.marginType === "wickets" &&
        matchResult.margin > (updatedStats.biggestWin.margin || 0))
    ) {
      updatedStats.biggestWin = {
        opponent: opponentInnings.teamName,
        margin: matchResult.margin,
        marginType: matchResult.marginType || "runs",
      };
    }
  }

  // Recalculate run rates
  updatedStats.battingRunRate = calculateRunRate(
    updatedStats.totalRunsScored,
    updatedStats.totalOversPlayed
  );

  updatedStats.bowlingRunRate = calculateRunRate(
    updatedStats.totalRunsConceded,
    updatedStats.totalOversBowled
  );

  // Recalculate Net Run Rate
  updatedStats.netRunRate = calculateNetRunRate(updatedStats);

  return updatedStats;
}

/**
 * Get tournament standings sorted by points and NRR
 * NOTE: Only includes round-robin match statistics, playoff matches are excluded
 */
export function getTournamentStandings(
  teamStats: Record<string, CricketTeamStats>
): CricketTeamStats[] {
  const teams = Object.values(teamStats);

  return teams.sort((a, b) => {
    // First sort by points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // Then by Net Run Rate (descending) - handle NaN values
    const aNRR = isNaN(a.netRunRate) ? -Infinity : a.netRunRate;
    const bNRR = isNaN(b.netRunRate) ? -Infinity : b.netRunRate;
    if (bNRR !== aNRR) {
      return bNRR - aNRR;
    }

    // Then by wins (descending)
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    // Finally by team name (alphabetical)
    return a.teamName.localeCompare(b.teamName);
  });
}

/**
 * Format NRR for display with proper sign
 */
export function formatNRR(nrr: number): string {
  const formatted = Math.abs(nrr).toFixed(2);
  if (nrr > 0) return `+${formatted}`;
  if (nrr < 0) return `-${formatted}`;
  return "+0.00";
}

/**
 * Create sample match result for testing
 */
export function createSampleMatchResult(
  team1: string,
  team2: string,
  team1Runs: number,
  team1Wickets: number,
  team1Overs: number,
  team2Runs: number,
  team2Wickets: number,
  team2Overs: number,
  _maxOvers: number // eslint-disable-line @typescript-eslint/no-unused-vars
): CricketMatchResult {
  const team1Balls = oversToBalls(team1Overs);
  const team2Balls = oversToBalls(team2Overs);

  const team1Innings: InningsScore = {
    teamName: team1,
    runs: team1Runs,
    wickets: team1Wickets,
    overs: team1Overs,
    ballsFaced: team1Balls,
    isAllOut: team1Wickets >= 10,
    runRate: calculateRunRate(team1Runs, team1Overs),
  };

  const team2Innings: InningsScore = {
    teamName: team2,
    runs: team2Runs,
    wickets: team2Wickets,
    overs: team2Overs,
    ballsFaced: team2Balls,
    isAllOut: team2Wickets >= 10,
    runRate: calculateRunRate(team2Runs, team2Overs),
  };

  let winner: string;
  let loser: string;
  let marginType: "runs" | "wickets";
  let margin: number;

  if (team1Runs === team2Runs) {
    // Handle tie/draw
    winner = "";
    loser = "";
    marginType = "runs";
    margin = 0;
  } else if (team1Runs > team2Runs) {
    winner = team1;
    loser = team2;
    marginType = "runs";
    margin = team1Runs - team2Runs;
  } else {
    winner = team2;
    loser = team1;
    marginType = "wickets";
    margin = 10 - team2Wickets;
  }

  return {
    winner,
    loser,
    isDraw: team1Runs === team2Runs,
    team1Innings,
    team2Innings,
    marginType,
    margin,
    matchType: "completed",
  };
}
