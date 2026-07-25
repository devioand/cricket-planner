import {
  gamesToWin,
  generateSeriesMatches,
  getSeriesWinner,
  getSeriesWins,
  validateSeriesTeams,
} from "../series";
import type { Match } from "../../types";

const TEAMS: [string, string] = ["Team A", "Team B"];

function completedMatch(id: string, winner: string, loser: string): Match {
  return {
    id,
    team1: TEAMS[0],
    team2: TEAMS[1],
    round: 1,
    status: "completed",
    overs: 20,
    maxWickets: 10,
    result: {
      winner,
      loser,
      team1Innings: null,
      team2Innings: null,
      matchType: "completed",
    },
  };
}

describe("Series Algorithm", () => {
  describe("gamesToWin", () => {
    it("computes the winning majority for each best-of length", () => {
      expect(gamesToWin(3)).toBe(2);
      expect(gamesToWin(5)).toBe(3);
      expect(gamesToWin(7)).toBe(4);
    });
  });

  describe("generateSeriesMatches", () => {
    it("generates bestOf fixtures between the same two teams", () => {
      const result = generateSeriesMatches({
        teams: TEAMS,
        bestOf: 5,
        maxOvers: 20,
        maxWickets: 10,
      });

      expect(result).toHaveLength(5);
      result.forEach((m, i) => {
        expect(m.id).toBe(`S-${(i + 1).toString().padStart(3, "0")}`);
        expect(m.team1).toBe(TEAMS[0]);
        expect(m.team2).toBe(TEAMS[1]);
        expect(m.status).toBe("scheduled");
        expect(m.round).toBe(i + 1);
      });
    });
  });

  describe("validateSeriesTeams", () => {
    it("accepts exactly 2 distinct, non-empty teams", () => {
      expect(validateSeriesTeams(TEAMS).valid).toBe(true);
    });

    it("rejects anything other than 2 teams", () => {
      expect(validateSeriesTeams(["Only One"]).valid).toBe(false);
      expect(validateSeriesTeams(["A", "B", "C"]).valid).toBe(false);
    });

    it("rejects duplicate or empty names", () => {
      expect(validateSeriesTeams(["Team A", "Team A"]).valid).toBe(false);
      expect(validateSeriesTeams(["Team A", "  "]).valid).toBe(false);
    });
  });

  describe("getSeriesWins / getSeriesWinner", () => {
    it("counts only completed, decisive matches", () => {
      const matches: Match[] = [
        completedMatch("S-001", "Team A", "Team B"),
        completedMatch("S-002", "Team A", "Team B"),
        { ...completedMatch("S-003", "Team B", "Team A"), status: "scheduled" },
      ];
      const wins = getSeriesWins(matches, TEAMS);
      expect(wins["Team A"]).toBe(2);
      expect(wins["Team B"]).toBe(0);
    });

    it("declares no winner before a majority is reached", () => {
      const matches: Match[] = [completedMatch("S-001", "Team A", "Team B")];
      expect(getSeriesWinner(matches, TEAMS, 5)).toBeNull();
    });

    it("declares the winner the moment a majority is reached, without playing every game", () => {
      const matches: Match[] = [
        completedMatch("S-001", "Team A", "Team B"),
        completedMatch("S-002", "Team A", "Team B"),
        completedMatch("S-003", "Team A", "Team B"),
      ];
      // Best of 5 needs 3 wins — reached after 3 games, 2 left unplayed.
      expect(getSeriesWinner(matches, TEAMS, 5)).toBe("Team A");
    });
  });
});
