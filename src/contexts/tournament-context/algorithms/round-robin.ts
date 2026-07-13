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
 * Generate Round Robin tournament matches with rest-optimized scheduling
 * In Round Robin, every team plays every other team exactly once.
 *
 * Matches are played one at a time (single pitch), so the ordering below is
 * the actual play order. It is built to give teams rest between games: whenever
 * enough other teams are still waiting, the next match is handed to teams that
 * have rested longest, so the two teams that just finished don't play again
 * back-to-back. With very few teams (e.g. 3) some repeats are unavoidable, and
 * the algorithm still spreads them out as much as possible.
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

  // Order the pairs into a play sequence that maximizes rest between games
  const scheduledMatches = scheduleMatchesForRest(allPairs);

  // Convert to Match objects. `round` carries the play-order position so the
  // matches view (which sorts by round) preserves this rest-optimized order.
  const matches: Match[] = scheduledMatches.map((pair, index) => ({
    id: `RR-${(index + 1).toString().padStart(3, "0")}`,
    team1: pair.team1,
    team2: pair.team2,
    round: index + 1,
    status: "scheduled",
    overs: maxOvers,
    maxWickets: maxWickets,
  }));

  // Matches are played sequentially, so each match occupies its own slot.
  return {
    matches,
    totalRounds: matches.length,
    matchesPerRound: 1,
  };
}

/**
 * Order round-robin pairs into a single play sequence that maximizes the rest
 * each team gets between its matches.
 *
 * Greedy: at every slot, pick the remaining pair whose two teams have rested
 * the longest since either last played. This pushes the just-finished teams to
 * the back of the queue whenever other teams are available, avoiding
 * back-to-back matches. Ties favour teams that have played fewer games so far
 * (so nobody's fixtures bunch up at the end), then original pair order for
 * deterministic output.
 */
function scheduleMatchesForRest(
  pairs: { team1: string; team2: string }[]
): { team1: string; team2: string }[] {
  const remaining = pairs.map((pair, origin) => ({ ...pair, origin }));
  const sequence: { team1: string; team2: string }[] = [];

  const lastPlayedAt = new Map<string, number>();
  const gamesPlayed = new Map<string, number>();

  // Rest = slots elapsed since a team last played (Infinity if it hasn't yet).
  const restOf = (team: string, slot: number) => {
    const last = lastPlayedAt.get(team);
    return last === undefined ? Number.POSITIVE_INFINITY : slot - last;
  };
  const gamesOf = (team: string) => gamesPlayed.get(team) ?? 0;

  for (let slot = 0; remaining.length > 0; slot++) {
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      const cand = remaining[i];
      const bestPair = remaining[best];

      // The team with the shorter rest is the binding constraint for a pair;
      // maximizing that value spreads every team's games as far apart as possible.
      const candRest = Math.min(
        restOf(cand.team1, slot),
        restOf(cand.team2, slot)
      );
      const bestRest = Math.min(
        restOf(bestPair.team1, slot),
        restOf(bestPair.team2, slot)
      );

      if (candRest !== bestRest) {
        if (candRest > bestRest) best = i;
        continue;
      }

      const candGames = gamesOf(cand.team1) + gamesOf(cand.team2);
      const bestGames = gamesOf(bestPair.team1) + gamesOf(bestPair.team2);
      if (candGames !== bestGames) {
        if (candGames < bestGames) best = i;
        continue;
      }

      if (cand.origin < bestPair.origin) best = i;
    }

    const [chosen] = remaining.splice(best, 1);
    sequence.push({ team1: chosen.team1, team2: chosen.team2 });
    lastPlayedAt.set(chosen.team1, slot);
    lastPlayedAt.set(chosen.team2, slot);
    gamesPlayed.set(chosen.team1, gamesOf(chosen.team1) + 1);
    gamesPlayed.set(chosen.team2, gamesOf(chosen.team2) + 1);
  }

  return sequence;
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
