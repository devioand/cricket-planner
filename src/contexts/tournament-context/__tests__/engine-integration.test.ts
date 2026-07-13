import {
  initialState,
  addTeam,
  setPlayoffFormat,
  setPlayoffConfig,
  generateMatches,
  simulateMatchResult,
  completeMatch,
  getStandings,
  getTournamentWinner,
  isTournamentComplete,
} from "../engine";
import { isRoundRobinComplete } from "../algorithms/playoff-engine";
import type {
  TournamentState,
  PlayoffConfig,
  PlayoffFormat,
} from "../types";

function setup(
  teams: string[],
  format: PlayoffFormat,
  config: PlayoffConfig | null = null,
): TournamentState {
  let state = initialState;
  for (const t of teams) state = addTeam(state, t);
  state = setPlayoffFormat(state, format);
  state = setPlayoffConfig(state, config);
  const gen = generateMatches(state);
  expect(gen.success).toBe(true);
  return gen.state;
}

function play(
  state: TournamentState,
  matchId: string,
  t1: { runs: number; wickets: number; overs: number },
  t2: { runs: number; wickets: number; overs: number }
): TournamentState {
  return completeMatch(simulateMatchResult(state, matchId, t1, t2), matchId)
    .state;
}

const WIN = { runs: 160, wickets: 5, overs: 20 };
const LOSE = { runs: 150, wickets: 7, overs: 20 };

describe("Tournament Integration (engine)", () => {
  describe("Complete 3-Team Tournament Flow", () => {
    it("completes the entire flow with TBD playoff resolution", () => {
      let state = setup(
        ["Mumbai Indians", "Chennai Super Kings", "Royal Challengers"],
        "world-cup"
      );

      const rr = state.matches.filter((m) => !m.isPlayoff);
      const playoff = state.matches.filter((m) => m.isPlayoff);
      expect(rr).toHaveLength(3);
      expect(playoff).toHaveLength(1);
      expect(playoff[0].team1).toBe("TBD");
      expect(playoff[0].team2).toBe("TBD");

      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      expect(isRoundRobinComplete(state)).toBe(true);

      const standings = getStandings(state);
      expect(standings).toHaveLength(3);

      const final = state.matches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      )!;
      expect(final.team1).toBe(standings[0].teamName);
      expect(final.team2).toBe(standings[1].teamName);

      state = play(state, final.id, WIN, LOSE);

      expect(isTournamentComplete(state)).toBe(true);
      expect(getTournamentWinner(state)).toBe(standings[0].teamName);
    });
  });

  describe("Complete 4-Team World Cup Flow", () => {
    it("completes with semi-finals then final", () => {
      let state = setup(["Team A", "Team B", "Team C", "Team D"], "world-cup");

      const rr = state.matches.filter((m) => !m.isPlayoff);
      expect(rr).toHaveLength(6);
      expect(state.matches.filter((m) => m.isPlayoff)).toHaveLength(3);

      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      const semis = state.matches.filter((m) =>
        m.playoffType?.includes("semi-final")
      );
      expect(semis).toHaveLength(2);
      semis.forEach((sf) => {
        expect(sf.team1).not.toBe("TBD");
        expect(sf.team2).not.toBe("TBD");
      });

      for (const sf of semis) state = play(state, sf.id, WIN, LOSE);

      const final = state.matches.find((m) => m.playoffType === "final")!;
      expect(final.team1).not.toBe("TBD");
      expect(final.team2).not.toBe("TBD");

      state = play(state, final.id, WIN, LOSE);
      expect(isTournamentComplete(state)).toBe(true);
      expect(getTournamentWinner(state)).toBeTruthy();
    });
  });

  describe("Complete 4-Team League Flow", () => {
    it("completes Q1, Eliminator, Q2, and Final", () => {
      let state = setup(["Team A", "Team B", "Team C", "Team D"], "league");

      const playoff = state.matches.filter((m) => m.isPlayoff);
      expect(playoff).toHaveLength(4);

      const rr = state.matches.filter((m) => !m.isPlayoff);
      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      const q1 = state.matches.find((m) => m.playoffType === "qualifier-1")!;
      const eliminator = state.matches.find(
        (m) => m.playoffType === "eliminator"
      )!;
      expect(q1.team1).not.toBe("TBD");
      expect(eliminator.team1).not.toBe("TBD");

      state = play(state, q1.id, WIN, LOSE);
      state = play(state, eliminator.id, WIN, LOSE);

      const q2 = state.matches.find((m) => m.playoffType === "qualifier-2")!;
      let final = state.matches.find((m) => m.playoffType === "final")!;
      expect(q2.team1).not.toBe("TBD"); // Q1 loser
      expect(q2.team2).not.toBe("TBD"); // Eliminator winner
      expect(final.team1).not.toBe("TBD"); // Q1 winner (direct entry)
      expect(final.team2).toBe("TBD"); // waiting on Q2 winner

      state = play(state, q2.id, WIN, LOSE);
      final = state.matches.find((m) => m.playoffType === "final")!;
      expect(final.team1).not.toBe("TBD");
      expect(final.team2).not.toBe("TBD");

      state = play(state, final.id, WIN, LOSE);
      expect(isTournamentComplete(state)).toBe(true);
      expect(getTournamentWinner(state)).toBeTruthy();
    });
  });

  describe("Playoff progression (world-cup)", () => {
    it("keeps the final locked until both semis complete", () => {
      let state = setup(["Team A", "Team B", "Team C", "Team D"], "world-cup");

      // Semis start as TBD until the group stage finishes.
      const final0 = state.matches.find((m) => m.isFinal)!;
      expect(final0.team1).toBe("TBD");
      expect(final0.team2).toBe("TBD");

      const rr = state.matches.filter((m) => !m.isPlayoff);
      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      const semis = state.matches.filter((m) =>
        m.playoffType?.includes("semi-final")
      );
      expect(semis).toHaveLength(2);

      // First semi done → final has exactly one side filled.
      state = play(state, semis[0].id, WIN, LOSE);
      const finalMid = state.matches.find((m) => m.isFinal)!;
      const filledSides = [finalMid.team1, finalMid.team2].filter(
        (t) => t !== "TBD"
      );
      expect(filledSides).toHaveLength(1);
      expect(isTournamentComplete(state)).toBe(false);

      // Second semi done → final fully populated.
      state = play(state, semis[1].id, WIN, LOSE);
      const finalReady = state.matches.find((m) => m.isFinal)!;
      expect(finalReady.team1).not.toBe("TBD");
      expect(finalReady.team2).not.toBe("TBD");

      state = play(state, finalReady.id, WIN, LOSE);
      expect(isTournamentComplete(state)).toBe(true);
      expect(getTournamentWinner(state)).toBeTruthy();
    });
  });

  describe("No playoffs (champion = table topper)", () => {
    it("creates no playoff matches and crowns the standings leader", () => {
      let state = setup(["A", "B", "C", "D"], "none");
      expect(state.matches.filter((m) => m.isPlayoff)).toHaveLength(0);
      expect(getTournamentWinner(state)).toBeNull();

      const rr = state.matches.filter((m) => !m.isPlayoff);
      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      expect(isRoundRobinComplete(state)).toBe(true);
      expect(isTournamentComplete(state)).toBe(true);
      expect(getTournamentWinner(state)).toBe(getStandings(state)[0].teamName);
    });
  });

  describe("Final only (top 2)", () => {
    it("seeds a single final from the top two and crowns its winner", () => {
      let state = setup(["A", "B", "C", "D"], "final-only");
      const playoff = state.matches.filter((m) => m.isPlayoff);
      expect(playoff).toHaveLength(1);
      expect(playoff[0].isFinal).toBe(true);

      const rr = state.matches.filter((m) => !m.isPlayoff);
      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      const standings = getStandings(state);
      const final = state.matches.find((m) => m.isFinal)!;
      expect(final.team1).toBe(standings[0].teamName);
      expect(final.team2).toBe(standings[1].teamName);

      state = play(state, final.id, WIN, LOSE);
      expect(getTournamentWinner(state)).toBe(standings[0].teamName);
    });
  });

  describe("Custom bracket (5 teams: seed1 bye, 2v3 eliminator)", () => {
    const custom: PlayoffConfig = {
      qualifiers: 3,
      matches: [
        {
          id: "PO-001",
          label: "Eliminator",
          round: 1,
          slot1: { kind: "seed", seed: 2 },
          slot2: { kind: "seed", seed: 3 },
        },
        {
          id: "F-001",
          label: "Final",
          round: 2,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "winnerOf", matchId: "PO-001" },
          isFinal: true,
        },
      ],
    };

    it("plays through to a champion", () => {
      let state = setup(["A", "B", "C", "D", "E"], "custom", custom);
      expect(state.matches.filter((m) => m.isPlayoff)).toHaveLength(2);

      const rr = state.matches.filter((m) => !m.isPlayoff);
      for (const m of rr) state = play(state, m.id, WIN, LOSE);

      const standings = getStandings(state);
      const elim = state.matches.find((m) => m.id === "PO-001")!;
      expect(elim.team1).toBe(standings[1].teamName); // seed 2
      expect(elim.team2).toBe(standings[2].teamName); // seed 3
      let final = state.matches.find((m) => m.isFinal)!;
      expect(final.team1).toBe(standings[0].teamName); // seed 1 bye
      expect(final.team2).toBe("TBD");

      state = play(state, elim.id, WIN, LOSE);
      final = state.matches.find((m) => m.isFinal)!;
      expect(final.team2).not.toBe("TBD"); // eliminator winner joined

      state = play(state, final.id, WIN, LOSE);
      expect(isTournamentComplete(state)).toBe(true);
      expect(getTournamentWinner(state)).toBeTruthy();
    });
  });
});
