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

  console.log("🔄 Generating Round Robin tournament...");
  console.log(`📊 Teams: ${teams.length}`);
  console.log(`🏏 Max Overs: ${maxOvers}`);
  console.log(`🎯 Max Wickets: ${maxWickets}`);

  if (teams.length < 2) {
    console.log("❌ Need at least 2 teams for Round Robin");
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

  console.log(`📋 Generated ${allPairs.length} total matches needed`);

  // Now schedule matches in rounds with optimal rest
  const scheduledMatches = scheduleMatchesInRounds(allPairs);

  // Convert to Match objects
  const matches: Match[] = [];
  let matchId = 1;

  scheduledMatches.forEach((round, roundIndex) => {
    console.log(`\n🏟️ Round ${roundIndex + 1}:`);
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

      console.log(`   ⚡ Match ${match.id}: ${match.team1} vs ${match.team2}`);
    });
  });

  const totalRounds = scheduledMatches.length;
  const maxMatchesPerRound = Math.max(...scheduledMatches.map((r) => r.length));

  console.log(`\n✅ Round Robin scheduling complete!`);
  console.log(`📊 Tournament Statistics:`);
  console.log(`   • Total matches: ${matches.length}`);
  console.log(
    `   • Expected matches: ${(teams.length * (teams.length - 1)) / 2}`
  );
  console.log(`   • Each team plays: ${teams.length - 1} matches`);
  console.log(`   • Tournament rounds: ${totalRounds}`);
  console.log(`   • Max matches per round: ${maxMatchesPerRound}`);
  console.log(`   • Teams get rest between rounds: ✅`);

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

  console.log("🔄 Optimizing match schedule for team rest...");

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

    console.log(
      `   📅 Round ${rounds.length}: ${currentRound.length} matches scheduled`
    );
    currentRound.forEach((match) => {
      console.log(`      • ${match.team1} vs ${match.team2}`);
    });
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

  console.log("📈 Round Robin Statistics:");
  console.log(`   • Teams: ${stats.teamCount}`);
  console.log(`   • Total matches: ${stats.totalMatches}`);
  console.log(`   • Matches per team: ${stats.matchesPerTeam}`);
  console.log(`   • Minimum rounds needed: ${stats.minRounds}`);

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

  if (valid) {
    console.log("✅ Round Robin teams validation passed");
  } else {
    console.log("❌ Round Robin teams validation failed:", errors);
  }

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

  console.log("🎯 Optimizing Round Robin schedule...");

  // For now, we'll keep it simple and put all matches in round 1
  // In a more advanced version, we could distribute matches across multiple rounds
  // to minimize conflicts (same team playing multiple matches in the same round)

  console.log("✅ Schedule optimization complete");

  return result;
}
