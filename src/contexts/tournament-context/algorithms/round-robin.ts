// Round Robin Tournament Algorithm

import type { Match } from "../types";

export interface RoundRobinOptions {
  teams: string[];
  maxOvers: number;
  maxWickets: number;
}

export interface RoundRobinResult {
  matches: Match[];
  totalRounds: number;
  matchesPerRound: number;
}

/**
 * Generate Round Robin tournament matches with optimized scheduling
 * In Round Robin, every team plays every other team exactly once
 * Matches are scheduled in rounds to ensure teams get rest between games
 */
export function generateRoundRobinMatches(
  options: RoundRobinOptions
): RoundRobinResult {
  const { teams, maxOvers, maxWickets } = options;

  if (teams.length < 2) {
    return {
      matches: [],
      totalRounds: 0,
      matchesPerRound: 0,
    };
  }

  // Generate all possible pairs first
  const allPairs: { team1: string; team2: string }[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      allPairs.push({ team1: teams[i], team2: teams[j] });
    }
  }

  // Now schedule matches in rounds with optimal rest
  const scheduledMatches = scheduleMatchesInRounds(allPairs);

  // Convert to Match objects
  const matches: Match[] = [];
  let matchId = 1;

  scheduledMatches.forEach((round, roundIndex) => {
    round.forEach((pair) => {
      const match: Match = {
        id: `RR-${matchId.toString().padStart(3, "0")}`,
        team1: pair.team1,
        team2: pair.team2,
        round: roundIndex + 1,
        status: "scheduled",
        overs: maxOvers,
        maxWickets: maxWickets,
      };

      matches.push(match);
      matchId++;
    });
  });

  const totalRounds = scheduledMatches.length;
  const maxMatchesPerRound = Math.max(...scheduledMatches.map((r) => r.length));

  return {
    matches,
    totalRounds,
    matchesPerRound: maxMatchesPerRound,
  };
}

/**
 * Schedule matches in rounds to optimize team rest periods
 * Uses a greedy algorithm to maximize parallel matches while ensuring teams get rest
 */
function scheduleMatchesInRounds(
  pairs: { team1: string; team2: string }[]
): { team1: string; team2: string }[][] {
  const rounds: { team1: string; team2: string }[][] = [];
  const remainingPairs = [...pairs];

  while (remainingPairs.length > 0) {
    const currentRound: { team1: string; team2: string }[] = [];
    const teamsInCurrentRound = new Set<string>();

    // Greedy approach: try to fit as many non-conflicting matches as possible
    for (let i = remainingPairs.length - 1; i >= 0; i--) {
      const pair = remainingPairs[i];

      // Check if both teams are available (not already playing in this round)
      if (
        !teamsInCurrentRound.has(pair.team1) &&
        !teamsInCurrentRound.has(pair.team2)
      ) {
        currentRound.push(pair);
        teamsInCurrentRound.add(pair.team1);
        teamsInCurrentRound.add(pair.team2);
        remainingPairs.splice(i, 1);
      }
    }

    rounds.push(currentRound);
  }

  return rounds;
}

/**
 * Calculate Round Robin tournament statistics
 */
export function calculateRoundRobinStats(teams: string[]) {
  const teamCount = teams.length;
  const totalMatches = (teamCount * (teamCount - 1)) / 2;
  const matchesPerTeam = teamCount - 1;

  const stats = {
    teamCount,
    totalMatches,
    matchesPerTeam,
    minRounds: Math.ceil(totalMatches / Math.floor(teamCount / 2)), // Minimum rounds if we can play multiple matches simultaneously
  };

  return stats;
}

/**
 * Validate teams for Round Robin tournament
 */
export function validateRoundRobinTeams(teams: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (teams.length < 2) {
    errors.push("At least 2 teams are required for Round Robin");
  }

  if (teams.length > 20) {
    errors.push(
      "Maximum 20 teams allowed for Round Robin (too many matches otherwise)"
    );
  }

  // Check for duplicate team names
  const uniqueTeams = [...new Set(teams)];
  if (uniqueTeams.length !== teams.length) {
    errors.push("Duplicate team names are not allowed");
  }

  // Check for empty team names
  const emptyNames = teams.filter((team) => !team.trim());
  if (emptyNames.length > 0) {
    errors.push("Empty team names are not allowed");
  }

  const valid = errors.length === 0;

  return { valid, errors };
}

/**
 * Generate Round Robin schedule with optimal round distribution
 * This version tries to minimize the number of rounds by scheduling multiple matches per round
 */
export function generateOptimizedRoundRobinSchedule(
  options: RoundRobinOptions
) {
  const result = generateRoundRobinMatches(options);

  if (result.matches.length === 0) {
    return result;
  }

  // For now, we'll keep it simple and put all matches in round 1
  // In a more advanced version, we could distribute matches across multiple rounds
  // to minimize conflicts (same team playing multiple matches in the same round)

  return result;
}
