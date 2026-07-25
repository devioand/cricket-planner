import { generateTriSeriesMatches, validateTriSeriesTeams } from "../tri-series";

const TEAMS: [string, string, string] = ["Team A", "Team B", "Team C"];

describe("Tri-series Algorithm", () => {
  describe("generateTriSeriesMatches", () => {
    it("generates 6 group matches — each pair playing twice", () => {
      const matches = generateTriSeriesMatches({
        teams: TEAMS,
        maxOvers: 20,
        maxWickets: 10,
      });

      expect(matches).toHaveLength(6);
      matches.forEach((m, i) => {
        expect(m.id).toBe(`T-${(i + 1).toString().padStart(3, "0")}`);
        expect(m.status).toBe("scheduled");
        expect(m.round).toBe(i + 1);
        expect(m.isPlayoff).toBeFalsy();
      });

      const pairKey = (t1: string, t2: string) => [t1, t2].sort().join("-");
      const counts: Record<string, number> = {};
      for (const m of matches) {
        const key = pairKey(m.team1, m.team2);
        counts[key] = (counts[key] ?? 0) + 1;
      }
      expect(Object.keys(counts).sort()).toEqual(
        ["Team A-Team B", "Team A-Team C", "Team B-Team C"].sort(),
      );
      Object.values(counts).forEach((c) => expect(c).toBe(2));
    });

    it("gives each team the same number of games", () => {
      const matches = generateTriSeriesMatches({
        teams: TEAMS,
        maxOvers: 20,
        maxWickets: 10,
      });
      const played: Record<string, number> = {};
      for (const m of matches) {
        played[m.team1] = (played[m.team1] ?? 0) + 1;
        played[m.team2] = (played[m.team2] ?? 0) + 1;
      }
      TEAMS.forEach((t) => expect(played[t]).toBe(4));
    });
  });

  describe("validateTriSeriesTeams", () => {
    it("accepts exactly 3 distinct, non-empty teams", () => {
      expect(validateTriSeriesTeams(TEAMS).valid).toBe(true);
    });

    it("rejects anything other than 3 teams", () => {
      expect(validateTriSeriesTeams(["A", "B"]).valid).toBe(false);
      expect(validateTriSeriesTeams(["A", "B", "C", "D"]).valid).toBe(false);
    });

    it("rejects duplicate or empty names", () => {
      expect(validateTriSeriesTeams(["A", "A", "B"]).valid).toBe(false);
      expect(validateTriSeriesTeams(["A", "B", "  "]).valid).toBe(false);
    });
  });
});
