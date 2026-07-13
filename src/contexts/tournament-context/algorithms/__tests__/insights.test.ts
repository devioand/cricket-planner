import {
  initialState,
  addTeam,
  setPlayoffFormat,
  generateMatches,
  simulateMatchResult,
  completeMatch,
} from "../../engine";
import { computeTournamentInsights } from "../insights";
import type { TournamentState } from "../../types";

const WIN = { runs: 180, wickets: 4, overs: 20 };
const LOSE = { runs: 120, wickets: 9, overs: 20 };

function play(
  state: TournamentState,
  matchId: string,
  t1: { runs: number; wickets: number; overs: number },
  t2: { runs: number; wickets: number; overs: number },
): TournamentState {
  return completeMatch(simulateMatchResult(state, matchId, t1, t2), matchId)
    .state;
}

function setup(teams: string[]): TournamentState {
  let state = initialState;
  for (const t of teams) state = addTeam(state, t);
  state = setPlayoffFormat(state, "none");
  return generateMatches(state).state;
}

describe("computeTournamentInsights", () => {
  it("returns empty before any match is played", () => {
    const state = setup(["A", "B", "C"]);
    const insights = computeTournamentInsights(state);
    expect(insights.hasData).toBe(false);
    expect(insights.awards).toEqual([]);
    expect(insights.highlights).toEqual([]);
    expect(insights.powerRankings).toEqual([]);
  });

  it("aggregates totals, highlights, awards, standout and power after matches", () => {
    let state = setup(["A", "B", "C"]);
    const group = state.matches.filter((m) => !m.isPlayoff);
    // A beats everyone convincingly; the rest split.
    for (const m of group) {
      if (m.team1 === "A" || m.team2 === "A") {
        const aIsTeam1 = m.team1 === "A";
        state = play(state, m.id, aIsTeam1 ? WIN : LOSE, aIsTeam1 ? LOSE : WIN);
      } else {
        state = play(state, m.id, WIN, LOSE);
      }
    }

    const insights = computeTournamentInsights(state);
    expect(insights.hasData).toBe(true);
    expect(insights.matchesCompleted).toBe(group.length);
    expect(insights.totalRuns).toBeGreaterThan(0);
    expect(insights.totalWickets).toBeGreaterThan(0);

    // Highlights include the highest total (180) and the biggest win.
    const hKeys = insights.highlights.map((h) => h.key);
    expect(hKeys).toContain("highest");
    expect(hKeys).toContain("biggest");
    expect(insights.highlights.find((h) => h.key === "highest")!.headline).toContain(
      "180",
    );

    // Awards present and each names a team.
    const keys = insights.awards.map((a) => a.key);
    expect(keys).toContain("nrr");
    expect(keys).toContain("wins");
    insights.awards.forEach((a) => expect(a.team).toBeTruthy());

    // A dominates → standout, champion (table topper for "none"), and #1 power.
    expect(insights.standout?.team).toBe("A");
    expect(insights.champion).toBe("A");
    expect(insights.powerRankings[0].team).toBe("A");
    expect(insights.powerRankings[0].rating).toBeGreaterThan(
      insights.powerRankings[1].rating,
    );
  });
});
