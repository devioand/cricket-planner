import {
  initialState,
  addTeam,
  removeTeam,
  setMaxOvers,
  setMaxWickets,
  setPlayoffFormat,
  generateMatches,
  completeMatch,
  completeMatchAsNoResult,
  simulateMatchResult,
  startMatch,
  setMatchToss,
  isTournamentComplete,
  getTournamentWinner,
} from "../engine";
import {
  validateRoundRobinTeams,
  calculateRoundRobinStats,
} from "../algorithms/round-robin";
import type { TournamentState } from "../types";

function withTeams(...names: string[]): TournamentState {
  let state = initialState;
  for (const name of names) state = addTeam(state, name);
  return state;
}

describe("Tournament Engine", () => {
  describe("Initial State", () => {
    it("has the correct initial state", () => {
      expect(initialState.algorithm).toBe("round-robin");
      expect(initialState.teams).toEqual([]);
      expect(initialState.maxOvers).toBe(20);
      expect(initialState.maxWickets).toBe(10);
      expect(initialState.matches).toEqual([]);
      expect(initialState.isGenerated).toBe(false);
      expect(initialState.phase).toBe("setup");
      expect(initialState.playoffFormat).toBe("world-cup");
    });
  });

  describe("Team Management", () => {
    it("adds teams", () => {
      const state = withTeams("Team A", "Team B");
      expect(state.teams).toEqual(["Team A", "Team B"]);
    });

    it("prevents duplicate team names", () => {
      const state = addTeam(withTeams("Team A"), "Team A");
      expect(state.teams).toEqual(["Team A"]);
    });

    it("prevents empty team names", () => {
      let state = addTeam(initialState, "");
      state = addTeam(state, "   ");
      expect(state.teams).toEqual([]);
    });

    it("removes teams", () => {
      const state = removeTeam(withTeams("Team A", "Team B", "Team C"), "Team B");
      expect(state.teams).toEqual(["Team A", "Team C"]);
    });

    it("clears matches when teams change", () => {
      const gen = generateMatches(withTeams("Team A", "Team B"));
      expect(gen.state.matches.length).toBeGreaterThan(0);
      const state = addTeam(gen.state, "Team C");
      expect(state.matches).toEqual([]);
      expect(state.isGenerated).toBe(false);
    });
  });

  describe("Settings", () => {
    it("sets max overs", () => {
      expect(setMaxOvers(initialState, 50).maxOvers).toBe(50);
    });

    it("validates max overs range", () => {
      expect(setMaxOvers(initialState, 0).maxOvers).toBe(20);
      expect(setMaxOvers(initialState, 100).maxOvers).toBe(20);
      expect(setMaxOvers(initialState, 25).maxOvers).toBe(25);
    });

    it("sets max wickets", () => {
      expect(setMaxWickets(initialState, 11).maxWickets).toBe(11);
    });

    it("validates max wickets range", () => {
      expect(setMaxWickets(initialState, 0).maxWickets).toBe(10);
      expect(setMaxWickets(initialState, 15).maxWickets).toBe(10);
      expect(setMaxWickets(initialState, 8).maxWickets).toBe(8);
    });

    it("sets playoff format", () => {
      expect(setPlayoffFormat(initialState, "league").playoffFormat).toBe(
        "league"
      );
    });
  });

  describe("Generation", () => {
    it("generates round robin + playoff matches (3 teams)", () => {
      const gen = generateMatches(withTeams("Team A", "Team B", "Team C"));
      expect(gen.success).toBe(true);
      expect(gen.state.isGenerated).toBe(true);

      const rr = gen.state.matches.filter((m) => !m.isPlayoff);
      const playoff = gen.state.matches.filter((m) => m.isPlayoff);
      expect(rr).toHaveLength(3);
      expect(playoff).toHaveLength(1);
      playoff.forEach((m) => {
        expect(m.team1).toBe("TBD");
        expect(m.team2).toBe("TBD");
        expect(m.isPlayoff).toBe(true);
      });
    });

    it("generates different playoff structures by format (4 teams)", () => {
      const base = withTeams("Team A", "Team B", "Team C", "Team D");

      const worldCup = generateMatches(base).state.matches.filter(
        (m) => m.isPlayoff
      );
      expect(worldCup).toHaveLength(3); // 2 semis + final

      const league = generateMatches(setPlayoffFormat(base, "league")).state
        .matches.filter((m) => m.isPlayoff);
      expect(league).toHaveLength(4); // Q1 + Eliminator + Q2 + Final
    });

    it("fails to generate with insufficient teams", () => {
      const gen = generateMatches(withTeams("Only Team"));
      expect(gen.success).toBe(false);
      expect(gen.errors?.length).toBeGreaterThan(0);
      expect(gen.state.isGenerated).toBe(false);
    });
  });

  describe("Match Management", () => {
    const setup = () =>
      generateMatches(withTeams("Team A", "Team B", "Team C")).state;

    it("starts a match", () => {
      const state = setup();
      const first = state.matches.find((m) => !m.isPlayoff)!;
      const next = startMatch(state, first.id);
      expect(next.matches.find((m) => m.id === first.id)?.status).toBe(
        "in-progress"
      );
    });

    it("records a simulated result", () => {
      const state = setup();
      const first = state.matches.find((m) => !m.isPlayoff)!;
      const next = simulateMatchResult(
        state,
        first.id,
        { runs: 150, wickets: 5, overs: 20 },
        { runs: 140, wickets: 8, overs: 20 }
      );
      const m = next.matches.find((x) => x.id === first.id);
      expect(m?.result?.team1Innings?.runs).toBe(150);
      expect(m?.result?.team2Innings?.runs).toBe(140);
    });

    it("completes a match and updates stats", () => {
      let state = setup();
      const first = state.matches.find((m) => !m.isPlayoff)!;
      state = simulateMatchResult(
        state,
        first.id,
        { runs: 150, wickets: 5, overs: 20 },
        { runs: 140, wickets: 8, overs: 20 }
      );
      const r = completeMatch(state, first.id);
      const m = r.state.matches.find((x) => x.id === first.id);
      expect(m?.status).toBe("completed");
      expect(m?.result?.winner).toBe(first.team1);
      expect(m?.result?.loser).toBe(first.team2);
      expect(r.nextMatchId).toBeDefined();
    });

    it("sets a toss", () => {
      const state = setup();
      const first = state.matches.find((m) => !m.isPlayoff)!;
      const next = setMatchToss(state, first.id, first.team1, "bat");
      const toss = next.matches.find((m) => m.id === first.id)?.toss;
      expect(toss?.tossWinner).toBe(first.team1);
      expect(toss?.decision).toBe("bat");
      expect(toss?.tossLoser).toBe(first.team2);
    });
  });

  describe("Two-Team Tournament", () => {
    it("plays a single final that produces a champion", () => {
      const gen = generateMatches(withTeams("Team A", "Team B"));
      expect(gen.success).toBe(true);

      expect(gen.state.matches).toHaveLength(1);
      const final = gen.state.matches[0];
      expect(final.isPlayoff).toBe(true);
      expect(final.playoffType).toBe("final");
      expect([final.team1, final.team2].sort()).toEqual(["Team A", "Team B"]);
      expect(isTournamentComplete(gen.state)).toBe(false);

      const played = simulateMatchResult(
        gen.state,
        final.id,
        { runs: 160, wickets: 4, overs: 20 },
        { runs: 150, wickets: 8, overs: 20 }
      );
      const done = completeMatch(played, final.id);
      expect(isTournamentComplete(done.state)).toBe(true);
      expect(getTournamentWinner(done.state)).toBe(final.team1);
    });
  });

  describe("Toss-aware results", () => {
    const rrMatch = () => {
      const state = generateMatches(
        withTeams("Team A", "Team B", "Team C")
      ).state;
      const first = state.matches.find((m) => !m.isPlayoff)!;
      return { state, first };
    };

    it("chasing team wins by wickets when the other team batted first", () => {
      const { state: base, first } = rrMatch();
      let state = startMatch(base, first.id);
      // team2 wins the toss and bats first; team1 chases and overtakes.
      state = setMatchToss(state, first.id, first.team2, "bat");
      state = simulateMatchResult(
        state,
        first.id,
        { runs: 160, wickets: 5, overs: 20 }, // team1 (chasing)
        { runs: 150, wickets: 8, overs: 20 } // team2 (batting first)
      );
      const m = completeMatch(state, first.id).state.matches.find(
        (x) => x.id === first.id
      )!;
      expect(m.result?.winner).toBe(first.team1);
      expect(m.result?.marginType).toBe("wickets");
      expect(m.result?.margin).toBe(5); // 10 - 5 wickets lost
    });

    it("batting-first team wins by runs", () => {
      const { state: base, first } = rrMatch();
      let state = startMatch(base, first.id);
      state = setMatchToss(state, first.id, first.team1, "bat"); // team1 bats first
      state = simulateMatchResult(
        state,
        first.id,
        { runs: 180, wickets: 6, overs: 20 }, // team1 (batting first)
        { runs: 150, wickets: 10, overs: 20 } // team2 (chasing, all out)
      );
      const m = completeMatch(state, first.id).state.matches.find(
        (x) => x.id === first.id
      )!;
      expect(m.result?.winner).toBe(first.team1);
      expect(m.result?.marginType).toBe("runs");
      expect(m.result?.margin).toBe(30);
    });

    it("equal scores are a tie regardless of toss", () => {
      const { state: base, first } = rrMatch();
      let state = startMatch(base, first.id);
      state = setMatchToss(state, first.id, first.team1, "bowl");
      state = simulateMatchResult(
        state,
        first.id,
        { runs: 150, wickets: 6, overs: 20 },
        { runs: 150, wickets: 8, overs: 20 }
      );
      const m = completeMatch(state, first.id).state.matches.find(
        (x) => x.id === first.id
      )!;
      expect(m.result?.isDraw).toBe(true);
      expect(m.result?.winner).toBe("");
    });

    it("supports negative runs (double-wicket formats)", () => {
      const { state: base, first } = rrMatch();
      let state = startMatch(base, first.id);
      state = setMatchToss(state, first.id, first.team1, "bat"); // team1 bats first
      state = simulateMatchResult(
        state,
        first.id,
        { runs: -4, wickets: 2, overs: 20 }, // team1 batting first (negative)
        { runs: 6, wickets: 1, overs: 20 } // team2 chasing, higher
      );
      const m = completeMatch(state, first.id).state.matches.find(
        (x) => x.id === first.id
      )!;
      expect(m.result?.winner).toBe(first.team2);
      expect(m.result?.marginType).toBe("wickets");
      expect(m.result?.margin).toBe(9); // 10 - 1 wickets
    });
  });

  describe("No-result matches", () => {
    it("finishes a group match as no result: 1 point each, no win", () => {
      let state = generateMatches(withTeams("Team A", "Team B", "Team C")).state;
      const first = state.matches.find((m) => !m.isPlayoff)!;
      state = startMatch(state, first.id);

      const r = completeMatchAsNoResult(state, first.id);
      const m = r.state.matches.find((x) => x.id === first.id)!;

      expect(m.status).toBe("completed");
      expect(m.result?.matchType).toBe("no-result");
      expect(m.result?.isNoResult).toBe(true);
      expect(r.state.teamStats[first.team1].points).toBe(1);
      expect(r.state.teamStats[first.team2].points).toBe(1);
      expect(r.state.teamStats[first.team1].noResults).toBe(1);
      expect(r.state.teamStats[first.team1].wins).toBe(0);
      expect(r.state.teamStats[first.team1].totalRunsScored).toBe(0);
    });

    it("is a no-op for playoff matches (they need a winner)", () => {
      const state = generateMatches(
        withTeams("Team A", "Team B", "Team C")
      ).state;
      const playoff = state.matches.find((m) => m.isPlayoff)!;
      const r = completeMatchAsNoResult(state, playoff.id);
      expect(r.state.matches.find((x) => x.id === playoff.id)?.status).toBe(
        "scheduled"
      );
    });
  });

  describe("Utility", () => {
    it("validates teams", () => {
      expect(
        validateRoundRobinTeams(withTeams("A", "B", "C").teams).valid
      ).toBe(true);
      expect(validateRoundRobinTeams(withTeams("A").teams).valid).toBe(false);
    });

    it("calculates tournament stats", () => {
      const stats = calculateRoundRobinStats(
        withTeams("A", "B", "C", "D").teams
      );
      expect(stats.teamCount).toBe(4);
      expect(stats.totalMatches).toBe(6);
      expect(stats.matchesPerTeam).toBe(3);
    });

    it("reports completion status", () => {
      expect(isTournamentComplete(initialState)).toBe(false);
      expect(getTournamentWinner(initialState)).toBeNull();
    });

    it("resets to the initial state", () => {
      let state = withTeams("A", "B", "C");
      state = setMaxOvers(state, 50);
      state = setPlayoffFormat(state, "league");
      state = generateMatches(state).state;
      expect(state.matches.length).toBeGreaterThan(0);

      // "Reset" is simply returning to the shared initial state.
      const reset = initialState;
      expect(reset.teams).toEqual([]);
      expect(reset.matches).toEqual([]);
      expect(reset.maxOvers).toBe(20);
      expect(reset.playoffFormat).toBe("world-cup");
      expect(reset.isGenerated).toBe(false);
    });
  });
});
