// Fun tournament insights — derived, read-only analytics for the Stats page.
//
// Everything here is computed purely from `TournamentState`, so it stays
// testable and framework-free. Team season awards + power ratings come from the
// group-stage `teamStats`; match highlights scan every completed match.
//
// NOTE: the app tracks TEAM scores only (no individual players), so all awards
// are team-level.

import type { CricketTeamStats, InningsScore, Match, TournamentState } from "../types";
import { getTournamentStandings } from "./cricket-stats";
import { getTournamentWinner } from "../engine";

export interface Award {
  key: string;
  emoji: string;
  title: string;
  team: string;
  metric: string;
}

export interface Highlight {
  key: string;
  emoji: string;
  title: string;
  headline: string;
  detail?: string;
}

export interface PowerRank {
  team: string;
  rating: number; // 0–100
  wins: number;
  matchesPlayed: number;
}

export interface Standout {
  team: string;
  awardCount: number;
  totalAwards: number;
}

export interface TournamentInsights {
  hasData: boolean;
  matchesCompleted: number;
  totalRuns: number;
  totalWickets: number;
  /** The crowned champion (winner of the final, or table topper for "none"). */
  champion?: string;
  /** The team topping the most stat awards — a fun secondary note, NOT the champion. */
  standout?: Standout;
  awards: Award[];
  highlights: Highlight[];
  powerRankings: PowerRank[];
}

type Team = CricketTeamStats;

function bothInnings(m: Match): { a: InningsScore; b: InningsScore } | null {
  const a = m.result?.team1Innings;
  const b = m.result?.team2Innings;
  return a && b ? { a, b } : null;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Blended 0–100 power rating: 70% win rate, 30% net run rate. */
function powerRating(t: Team): number {
  const winRate = t.matchesPlayed > 0 ? t.wins / t.matchesPlayed : 0;
  const nrrNorm = (clamp(t.netRunRate, -2.5, 2.5) + 2.5) / 5; // 0–1
  return Math.round(winRate * 70 + nrrNorm * 30);
}

export function computeTournamentInsights(
  state: TournamentState,
): TournamentInsights {
  const completed = state.matches.filter((m) => m.status === "completed");
  const teams = getTournamentStandings(state.teamStats).filter(
    (t) => t.matchesPlayed > 0,
  );

  const empty: TournamentInsights = {
    hasData: false,
    matchesCompleted: 0,
    totalRuns: 0,
    totalWickets: 0,
    awards: [],
    highlights: [],
    powerRankings: [],
  };
  if (completed.length === 0 || teams.length === 0) return empty;

  // ── Match scan: totals + highlights ─────────────────────────────────────────
  let totalRuns = 0;
  let totalWickets = 0;
  let highest:
    | { team: string; runs: number; wickets: number; opponent: string }
    | undefined;
  let biggestRunWin:
    | { winner: string; loser: string; margin: number }
    | undefined;
  let closest:
    | { winner: string; loser: string; margin: number; marginType: string }
    | undefined;
  let statement:
    | { winner: string; loser: string; diff: number }
    | undefined;

  for (const m of completed) {
    const pair = bothInnings(m);
    if (!pair) continue;
    for (const inn of [pair.a, pair.b]) {
      totalRuns += inn.runs;
      totalWickets += inn.wickets;
      if (!highest || inn.runs > highest.runs) {
        highest = {
          team: inn.teamName,
          runs: inn.runs,
          wickets: inn.wickets,
          opponent: inn.teamName === m.team1 ? m.team2 : m.team1,
        };
      }
    }

    const r = m.result;
    if (!r || r.isDraw || r.isNoResult || !r.margin) continue;

    if (r.marginType === "runs" && (!biggestRunWin || r.margin > biggestRunWin.margin)) {
      biggestRunWin = { winner: r.winner, loser: r.loser, margin: r.margin };
    }
    if (!closest || r.margin < closest.margin) {
      closest = {
        winner: r.winner,
        loser: r.loser,
        margin: r.margin,
        marginType: r.marginType ?? "runs",
      };
    }
    // Run-rate gap in the match — a proxy for how much it swung NRR.
    const winnerInn = r.winner === m.team1 ? pair.a : pair.b;
    const loserInn = r.winner === m.team1 ? pair.b : pair.a;
    const diff = winnerInn.runRate - loserInn.runRate;
    if (diff > 0 && (!statement || diff > statement.diff)) {
      statement = { winner: r.winner, loser: r.loser, diff };
    }
  }

  const highlights: Highlight[] = [];
  if (highest) {
    highlights.push({
      key: "highest",
      emoji: "💥",
      title: "Highest Total",
      headline: `${highest.team} — ${highest.runs}/${highest.wickets}`,
      detail: `vs ${highest.opponent}`,
    });
  }
  if (biggestRunWin) {
    highlights.push({
      key: "biggest",
      emoji: "💪",
      title: "Biggest Win",
      headline: `${biggestRunWin.winner} by ${biggestRunWin.margin} runs`,
      detail: `beat ${biggestRunWin.loser}`,
    });
  }
  if (closest) {
    highlights.push({
      key: "closest",
      emoji: "🤏",
      title: "Nail-biter",
      headline: `${closest.winner} by ${closest.margin} ${closest.marginType}`,
      detail: `edged ${closest.loser}`,
    });
  }
  if (statement) {
    highlights.push({
      key: "statement",
      emoji: "⚡",
      title: "Biggest NRR Swing",
      headline: `${statement.winner} outscored ${statement.loser}`,
      detail: `by ${statement.diff.toFixed(2)} runs/over`,
    });
  }

  // ── Team season awards ──────────────────────────────────────────────────────
  const best = (
    predicate: (t: Team) => boolean,
    compare: (a: Team, b: Team) => number,
  ): Team | undefined => {
    const eligible = teams.filter(predicate);
    return eligible.length ? [...eligible].sort(compare)[0] : undefined;
  };

  const awards: Award[] = [];
  const add = (a: Award | undefined) => a && awards.push(a);

  const nrr = best(() => true, (a, b) => b.netRunRate - a.netRunRate);
  if (nrr)
    add({
      key: "nrr",
      emoji: "📈",
      title: "Net Run Rate King",
      team: nrr.teamName,
      metric: `${nrr.netRunRate >= 0 ? "+" : ""}${nrr.netRunRate.toFixed(2)} net run rate`,
    });

  const batting = best((t) => t.totalOversPlayed > 0, (a, b) => b.battingRunRate - a.battingRunRate);
  if (batting)
    add({
      key: "batting",
      emoji: "🏏",
      title: "Best Batting Team",
      team: batting.teamName,
      metric: `${batting.battingRunRate.toFixed(2)} runs per over`,
    });

  const bowling = best((t) => t.totalOversBowled > 0, (a, b) => a.bowlingRunRate - b.bowlingRunRate);
  if (bowling)
    add({
      key: "bowling",
      emoji: "🎯",
      title: "Best Bowling Team",
      team: bowling.teamName,
      metric: `${bowling.bowlingRunRate.toFixed(2)} runs/over conceded`,
    });

  const wins = best((t) => t.wins > 0, (a, b) => b.wins - a.wins);
  if (wins)
    add({
      key: "wins",
      emoji: "🏆",
      title: "Most Wins",
      team: wins.teamName,
      metric: `${wins.wins} ${wins.wins === 1 ? "win" : "wins"}`,
    });

  // ── Standout: the team topping the most awards ──────────────────────────────
  const awardCounts = new Map<string, number>();
  for (const a of awards) {
    awardCounts.set(a.team, (awardCounts.get(a.team) ?? 0) + 1);
  }
  let standout: Standout | undefined;
  if (awards.length > 0) {
    const [topTeam, count] = [...awardCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    // Only celebrate when a team genuinely dominates (leads ≥ 2 categories).
    if (count >= 2) {
      standout = { team: topTeam, awardCount: count, totalAwards: awards.length };
    }
  }

  // ── Power rankings ──────────────────────────────────────────────────────────
  const powerRankings: PowerRank[] = teams
    .map((t) => ({
      team: t.teamName,
      rating: powerRating(t),
      wins: t.wins,
      matchesPlayed: t.matchesPlayed,
    }))
    .sort((a, b) => b.rating - a.rating);

  return {
    hasData: true,
    matchesCompleted: completed.length,
    totalRuns,
    totalWickets,
    champion: getTournamentWinner(state) ?? undefined,
    standout,
    awards,
    highlights,
    powerRankings,
  };
}
