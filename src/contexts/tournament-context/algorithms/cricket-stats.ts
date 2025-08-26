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
 * Convert overs and balls to decimal overs (e.g., 47.2 overs = 47.33 overs)
 */
export function ballsToOvers(balls: number): number {
  const completeOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return completeOvers + remainingBalls / 6;
}

/**
 * Convert decimal overs to total balls
 */
export function oversToBalls(overs: number): number {
  const completeOvers = Math.floor(overs);
  const fractionalPart = overs - completeOvers;
  const remainingBalls = Math.round(fractionalPart * 6);
  return completeOvers * 6 + remainingBalls;
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
  console.log(`🧮 Calculating NRR for ${stats.teamName}`);

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

  console.log(`   📊 ${stats.teamName} NRR Calculation:`);
  console.log(
    `      Batting: ${
      stats.totalRunsScored
    } runs in ${stats.totalOversPlayed.toFixed(
      2
    )} overs = ${battingRunRate.toFixed(3)} RPO`
  );
  console.log(
    `      Bowling: ${
      stats.totalRunsConceded
    } runs in ${stats.totalOversBowled.toFixed(
      2
    )} overs = ${bowlingRunRate.toFixed(3)} RPO`
  );
  console.log(
    `      Net Run Rate: ${battingRunRate.toFixed(
      3
    )} - ${bowlingRunRate.toFixed(3)} = ${nrr.toFixed(3)}`
  );

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
  console.log(
    `📈 Updating stats for ${teamStats.teamName} after match ${match.id}`
  );

  // Skip playoff matches - standings should only include round-robin stats
  if (match.isPlayoff) {
    console.log(
      `   ⚠️ Skipping playoff match stats for standings - ${match.id}`
    );
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

  // Update match counts
  updatedStats.matchesPlayed += 1;

  // Handle different match outcomes
  if (matchResult.matchType === "no-result" || matchResult.isNoResult) {
    updatedStats.noResults += 1;
    // No points awarded for no results
    console.log(`   ⚪ No result - no stats updated for batting/bowling`);
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

  console.log(`   ✅ Updated stats for ${teamStats.teamName}:`);
  console.log(
    `      Matches: ${updatedStats.matchesPlayed}, W: ${updatedStats.wins}, L: ${updatedStats.losses}, Points: ${updatedStats.points}`
  );
  console.log(`      NRR: ${updatedStats.netRunRate}`);

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

    // Then by Net Run Rate (descending)
    if (b.netRunRate !== a.netRunRate) {
      return b.netRunRate - a.netRunRate;
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
  const formatted = Math.abs(nrr).toFixed(3);
  if (nrr > 0) return `+${formatted}`;
  if (nrr < 0) return `-${formatted}`;
  return "0.000";
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

  if (team1Runs > team2Runs) {
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
