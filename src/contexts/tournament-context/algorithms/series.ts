// Series Tournament Algorithm — two sides, best of N.
//
// A series is the simplest format the engine runs: exactly two teams play up
// to `bestOf` matches (3, 5 or 7), and whoever reaches a winning majority
// first takes it. There is no group table and no playoff bracket — the
// scoreline itself decides the champion.

import type { Match, SeriesBestOf } from "../types";

export interface SeriesOptions {
  teams: [string, string];
  bestOf: SeriesBestOf;
  maxOvers: number;
  maxWickets: number;
}

/** Games a side needs to win to clinch a best-of-`bestOf` series. */
export function gamesToWin(bestOf: number): number {
  return Math.ceil((bestOf + 1) / 2);
}

/** Generate all `bestOf` fixtures up front, same two teams every game. Which
 *  side bats first each game is decided by the toss, not by this ordering. */
export function generateSeriesMatches(options: SeriesOptions): Match[] {
  const { teams, bestOf, maxOvers, maxWickets } = options;
  const [team1, team2] = teams;

  return Array.from({ length: bestOf }, (_, i) => ({
    id: `S-${(i + 1).toString().padStart(3, "0")}`,
    team1,
    team2,
    round: i + 1,
    status: "scheduled" as const,
    overs: maxOvers,
    maxWickets,
  }));
}

export function validateSeriesTeams(teams: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (teams.length !== 2) {
    errors.push("A series is between exactly 2 sides");
  }

  const uniqueTeams = new Set(teams);
  if (uniqueTeams.size !== teams.length) {
    errors.push("Duplicate team names are not allowed");
  }

  const emptyNames = teams.filter((team) => !team.trim());
  if (emptyNames.length > 0) {
    errors.push("Empty team names are not allowed");
  }

  return { valid: errors.length === 0, errors };
}

/** Games won so far by each side — only completed, decisive (non-draw) matches count. */
export function getSeriesWins(
  matches: Match[],
  teams: [string, string],
): Record<string, number> {
  const wins: Record<string, number> = { [teams[0]]: 0, [teams[1]]: 0 };
  for (const m of matches) {
    const winner = m.result?.winner;
    if (m.status === "completed" && winner) {
      wins[winner] = (wins[winner] ?? 0) + 1;
    }
  }
  return wins;
}

/** The side that has clinched the series (reached a winning majority), or null. */
export function getSeriesWinner(
  matches: Match[],
  teams: [string, string],
  bestOf: number,
): string | null {
  const wins = getSeriesWins(matches, teams);
  const need = gamesToWin(bestOf);
  if (wins[teams[0]] >= need) return teams[0];
  if (wins[teams[1]] >= need) return teams[1];
  return null;
}
