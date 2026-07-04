import {
  initialState,
  addTeam,
  setPlayoffFormat,
  generateMatches,
  simulateMatchResult,
  completeMatch,
  getStandings,
  getTournamentWinner,
  isTournamentComplete,
} from "../engine";
import {
  isRoundRobinComplete,
  getPlayoffStatus,
} from "../algorithms/playoffs";
import type { TournamentState, PlayoffFormat } from "../types";

function setup(teams: string[], format: PlayoffFormat): TournamentState {
  let state = initialState;
  for (const t of teams) state = addTeam(state, t);
  state = setPlayoffFormat(state, format);
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

  describe("Playoff status progression (world-cup)", () => {
    it("reports the correct phase throughout", () => {
      let state = setup(["Team A", "Team B", "Team C", "Team D"], "world-cup");

      expect(getPlayoffStatus(state).phase).toBe("not-started");

      const rr = state.matches.filter((m) => !m.isPlayoff);
      for (const m of rr) state = play(state, m.id, WIN, LOSE);
      expect(getPlayoffStatus(state).phase).toBe("semi-finals");

      const semis = state.matches.filter((m) =>
        m.playoffType?.includes("semi-final")
      );
      state = play(state, semis[0].id, WIN, LOSE);
      const midStatus = getPlayoffStatus(state);
      expect(midStatus.phase).toBe("semi-finals");
      expect(midStatus.description).toContain(
        "Semi-finals in progress (1/2 completed)"
      );

      state = play(state, semis[1].id, WIN, LOSE);
      expect(getPlayoffStatus(state).phase).toBe("finals");

      const final = state.matches.find((m) => m.playoffType === "final")!;
      state = play(state, final.id, WIN, LOSE);
      const finalStatus = getPlayoffStatus(state);
      expect(finalStatus.phase).toBe("completed");
      expect(finalStatus.description).toBe("Tournament completed!");
    });
  });
});
