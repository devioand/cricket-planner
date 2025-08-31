import {
  updateWorldCupPlayoffTeams,
  updateLeaguePlayoffTeams,
  updateInitialPlayoffTeamsFromStandings,
  hasResolvableTBDTeams,
} from "../update-playoff-teams";
import type {
  TournamentState,
  Match,
  CricketMatchResult,
  PlayoffType,
} from "../../types";

describe("TBD Playoff Team Updates", () => {
  const createMockMatch = (
    id: string,
    team1: string,
    team2: string,
    playoffType: string,
    status: "scheduled" | "completed" = "scheduled",
    result?: CricketMatchResult
  ): Match => ({
    id,
    team1,
    team2,
    round: 1,
    status,
    overs: 20,
    maxWickets: 10,
    isPlayoff: true,
    playoffType: playoffType as PlayoffType,
    phase: "playoffs",
    result,
  });

  const createMockResult = (
    winner: string,
    loser: string
  ): CricketMatchResult => ({
    winner,
    loser,
    team1Innings: {
      teamName: winner === "Team A" ? "Team A" : "Team B",
      runs: 150,
      wickets: 5,
      overs: 20,
      ballsFaced: 120,
      isAllOut: false,
      runRate: 7.5,
    },
    team2Innings: {
      teamName: loser,
      runs: 140,
      wickets: 8,
      overs: 20,
      ballsFaced: 120,
      isAllOut: false,
      runRate: 7.0,
    },
    marginType: "runs",
    margin: 10,
    matchType: "completed",
  });

  const createMockState = (matches: Match[]): TournamentState => ({
    algorithm: "round-robin",
    teams: ["Team A", "Team B", "Team C", "Team D"],
    maxOvers: 20,
    maxWickets: 10,
    matches,
    isGenerated: true,
    teamStats: {},
    phase: "playoffs",
    playoffFormat: "world-cup",
  });

  describe("updateWorldCupPlayoffTeams", () => {
    it("should update final team1 when semi-final-1 completes", () => {
      const sf1 = createMockMatch(
        "SF-001",
        "Team A",
        "Team D",
        "semi-final-1",
        "completed",
        createMockResult("Team A", "Team D")
      );
      const sf2 = createMockMatch("SF-002", "Team B", "Team C", "semi-final-2");
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = createMockState([sf1, sf2, final]);
      const result = updateWorldCupPlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Final team1 updated: Team A (SF1 winner)"
      );

      const updatedFinal = result.updatedMatches.find((m) => m.id === "F-001");
      expect(updatedFinal?.team1).toBe("Team A");
      expect(updatedFinal?.team2).toBe("TBD");
    });

    it("should update final team2 when semi-final-2 completes", () => {
      const sf1 = createMockMatch("SF-001", "Team A", "Team D", "semi-final-1");
      const sf2 = createMockMatch(
        "SF-002",
        "Team B",
        "Team C",
        "semi-final-2",
        "completed",
        createMockResult("Team B", "Team C")
      );
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = createMockState([sf1, sf2, final]);
      const result = updateWorldCupPlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Final team2 updated: Team B (SF2 winner)"
      );

      const updatedFinal = result.updatedMatches.find((m) => m.id === "F-001");
      expect(updatedFinal?.team1).toBe("TBD");
      expect(updatedFinal?.team2).toBe("Team B");
    });

    it("should update both final teams and log complete matchup", () => {
      const sf1 = createMockMatch(
        "SF-001",
        "Team A",
        "Team D",
        "semi-final-1",
        "completed",
        createMockResult("Team A", "Team D")
      );
      const sf2 = createMockMatch(
        "SF-002",
        "Team B",
        "Team C",
        "semi-final-2",
        "completed",
        createMockResult("Team B", "Team C")
      );
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = createMockState([sf1, sf2, final]);
      const result = updateWorldCupPlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Final team1 updated: Team A (SF1 winner)"
      );
      expect(result.updates).toContain(
        "Final team2 updated: Team B (SF2 winner)"
      );
      expect(result.updates).toContain(
        "Final matchup complete: Team A vs Team B"
      );

      const updatedFinal = result.updatedMatches.find((m) => m.id === "F-001");
      expect(updatedFinal?.team1).toBe("Team A");
      expect(updatedFinal?.team2).toBe("Team B");
    });

    it("should not update when teams are already set", () => {
      const sf1 = createMockMatch(
        "SF-001",
        "Team A",
        "Team D",
        "semi-final-1",
        "completed",
        createMockResult("Team A", "Team D")
      );
      const final = createMockMatch("F-001", "Team A", "Team B", "final"); // Already set

      const mockState = createMockState([sf1, final]);
      const result = updateWorldCupPlayoffTeams(mockState);

      expect(result.success).toBe(false);
      expect(result.updates).toHaveLength(0);
    });
  });

  describe("updateLeaguePlayoffTeams", () => {
    it("should update Q2 team1 when Q1 completes (Q1 loser gets second chance)", () => {
      const q1 = createMockMatch(
        "Q1-001",
        "Team A",
        "Team B",
        "qualifier-1",
        "completed",
        createMockResult("Team A", "Team B")
      );
      const eliminator = createMockMatch(
        "E-001",
        "Team C",
        "Team D",
        "eliminator"
      );
      const q2 = createMockMatch("Q2-001", "TBD", "TBD", "qualifier-2");
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = createMockState([q1, eliminator, q2, final]);
      const result = updateLeaguePlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Qualifier 2 team1 updated: Team B (Q1 loser)"
      );

      const updatedQ2 = result.updatedMatches.find((m) => m.id === "Q2-001");
      expect(updatedQ2?.team1).toBe("Team B");
    });

    it("should update Q2 team2 when Eliminator completes", () => {
      const q1 = createMockMatch("Q1-001", "Team A", "Team B", "qualifier-1");
      const eliminator = createMockMatch(
        "E-001",
        "Team C",
        "Team D",
        "eliminator",
        "completed",
        createMockResult("Team C", "Team D")
      );
      const q2 = createMockMatch("Q2-001", "TBD", "TBD", "qualifier-2");

      const mockState = createMockState([q1, eliminator, q2]);
      const result = updateLeaguePlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Qualifier 2 team2 updated: Team C (Eliminator winner)"
      );

      const updatedQ2 = result.updatedMatches.find((m) => m.id === "Q2-001");
      expect(updatedQ2?.team2).toBe("Team C");
    });

    it("should update final team1 when Q1 completes (direct entry)", () => {
      const q1 = createMockMatch(
        "Q1-001",
        "Team A",
        "Team B",
        "qualifier-1",
        "completed",
        createMockResult("Team A", "Team B")
      );
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = createMockState([q1, final]);
      const result = updateLeaguePlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain("Final team1 updated: Team A");

      const updatedFinal = result.updatedMatches.find((m) => m.id === "F-001");
      expect(updatedFinal?.team1).toBe("Team A");
    });

    it("should update final team2 when Q2 completes", () => {
      const q2 = createMockMatch(
        "Q2-001",
        "Team B",
        "Team C",
        "qualifier-2",
        "completed",
        createMockResult("Team B", "Team D")
      );
      const final = createMockMatch("F-001", "Team A", "TBD", "final");

      const mockState = createMockState([q2, final]);
      const result = updateLeaguePlayoffTeams(mockState);

      expect(result.success).toBe(true);
      expect(result.updates).toContain("Final team2 updated: Team B");

      const updatedFinal = result.updatedMatches.find((m) => m.id === "F-001");
      expect(updatedFinal?.team2).toBe("Team B");
    });
  });

  describe("updateInitialPlayoffTeamsFromStandings", () => {
    const mockStandings = [
      { teamName: "Team A" },
      { teamName: "Team B" },
      { teamName: "Team C" },
      { teamName: "Team D" },
    ];

    it("should update World Cup format 3-team final from standings", () => {
      const final = createMockMatch("F-001", "TBD", "TBD", "final");
      const mockState = {
        ...createMockState([final]),
        playoffFormat: "world-cup" as const,
      };

      const result = updateInitialPlayoffTeamsFromStandings(
        mockState,
        mockStandings.slice(0, 3)
      );

      expect(result.success).toBe(true);
      expect(result.updates).toContain("Final teams set: Team A vs Team B");

      const updatedFinal = result.updatedMatches.find((m) => m.id === "F-001");
      expect(updatedFinal?.team1).toBe("Team A");
      expect(updatedFinal?.team2).toBe("Team B");
    });

    it("should update World Cup format 4+ team semi-finals from standings", () => {
      const sf1 = createMockMatch("SF-001", "TBD", "TBD", "semi-final-1");
      const sf2 = createMockMatch("SF-002", "TBD", "TBD", "semi-final-2");
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = {
        ...createMockState([sf1, sf2, final]),
        playoffFormat: "world-cup" as const,
      };
      const result = updateInitialPlayoffTeamsFromStandings(
        mockState,
        mockStandings
      );

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Semi-final 1 teams set: Team A vs Team D"
      );
      expect(result.updates).toContain(
        "Semi-final 2 teams set: Team B vs Team C"
      );

      const updatedSF1 = result.updatedMatches.find((m) => m.id === "SF-001");
      expect(updatedSF1?.team1).toBe("Team A"); // 1st place
      expect(updatedSF1?.team2).toBe("Team D"); // 4th place

      const updatedSF2 = result.updatedMatches.find((m) => m.id === "SF-002");
      expect(updatedSF2?.team1).toBe("Team B"); // 2nd place
      expect(updatedSF2?.team2).toBe("Team C"); // 3rd place
    });

    it("should update League format 3-team final from standings", () => {
      const final = createMockMatch("F-001", "TBD", "TBD", "final");
      const mockState = {
        ...createMockState([final]),
        playoffFormat: "league" as const,
      };

      const result = updateInitialPlayoffTeamsFromStandings(
        mockState,
        mockStandings.slice(0, 3)
      );

      expect(result.success).toBe(true);
      expect(result.updates).toContain("Final teams set: Team A vs Team B");
    });

    it("should update League format 4+ team Q1 and Eliminator from standings", () => {
      const q1 = createMockMatch("Q1-001", "TBD", "TBD", "qualifier-1");
      const eliminator = createMockMatch("E-001", "TBD", "TBD", "eliminator");

      const mockState = {
        ...createMockState([q1, eliminator]),
        playoffFormat: "league" as const,
      };
      const result = updateInitialPlayoffTeamsFromStandings(
        mockState,
        mockStandings
      );

      expect(result.success).toBe(true);
      expect(result.updates).toContain(
        "Qualifier 1 teams set: Team A vs Team B"
      );
      expect(result.updates).toContain(
        "Eliminator teams set: Team C vs Team D"
      );

      const updatedQ1 = result.updatedMatches.find((m) => m.id === "Q1-001");
      expect(updatedQ1?.team1).toBe("Team A"); // 1st place
      expect(updatedQ1?.team2).toBe("Team B"); // 2nd place

      const updatedEliminator = result.updatedMatches.find(
        (m) => m.id === "E-001"
      );
      expect(updatedEliminator?.team1).toBe("Team C"); // 3rd place
      expect(updatedEliminator?.team2).toBe("Team D"); // 4th place
    });

    it("should not update matches that already have teams set", () => {
      const final = createMockMatch("F-001", "Team A", "Team B", "final"); // Already set
      const mockState = {
        ...createMockState([final]),
        playoffFormat: "world-cup" as const,
      };

      const result = updateInitialPlayoffTeamsFromStandings(
        mockState,
        mockStandings
      );

      expect(result.success).toBe(false);
      expect(result.updates).toHaveLength(0);
    });
  });

  describe("hasResolvableTBDTeams", () => {
    it("should return true when League Q2 team1 can be resolved (Q1 completed)", () => {
      const q1 = createMockMatch(
        "Q1-001",
        "Team A",
        "Team B",
        "qualifier-1",
        "completed"
      );
      const q2 = createMockMatch("Q2-001", "TBD", "TBD", "qualifier-2");

      const mockState = {
        ...createMockState([q1, q2]),
        playoffFormat: "league" as const,
      };
      const result = hasResolvableTBDTeams(mockState);

      expect(result).toBe(true);
    });

    it("should return true when League Q2 team2 can be resolved (Eliminator completed)", () => {
      const eliminator = createMockMatch(
        "E-001",
        "Team C",
        "Team D",
        "eliminator",
        "completed"
      );
      const q2 = createMockMatch("Q2-001", "TBD", "TBD", "qualifier-2");

      const mockState = {
        ...createMockState([eliminator, q2]),
        playoffFormat: "league" as const,
      };
      const result = hasResolvableTBDTeams(mockState);

      expect(result).toBe(true);
    });

    it("should return true when League Final can be resolved", () => {
      const q1 = createMockMatch(
        "Q1-001",
        "Team A",
        "Team B",
        "qualifier-1",
        "completed"
      );
      const q2 = createMockMatch(
        "Q2-001",
        "Team B",
        "Team C",
        "qualifier-2",
        "completed"
      );
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = {
        ...createMockState([q1, q2, final]),
        playoffFormat: "league" as const,
      };
      const result = hasResolvableTBDTeams(mockState);

      expect(result).toBe(true);
    });

    it("should return true when World Cup Final can be resolved", () => {
      const sf1 = createMockMatch(
        "SF-001",
        "Team A",
        "Team D",
        "semi-final-1",
        "completed"
      );
      const sf2 = createMockMatch(
        "SF-002",
        "Team B",
        "Team C",
        "semi-final-2",
        "completed"
      );
      const final = createMockMatch("F-001", "TBD", "TBD", "final");

      const mockState = {
        ...createMockState([sf1, sf2, final]),
        playoffFormat: "world-cup" as const,
      };
      const result = hasResolvableTBDTeams(mockState);

      expect(result).toBe(true);
    });

    it("should return false when no TBD teams can be resolved", () => {
      const q1 = createMockMatch(
        "Q1-001",
        "Team A",
        "Team B",
        "qualifier-1",
        "scheduled"
      );
      const eliminator = createMockMatch(
        "E-001",
        "Team C",
        "Team D",
        "eliminator",
        "scheduled"
      );
      const q2 = createMockMatch("Q2-001", "TBD", "TBD", "qualifier-2");

      const mockState = {
        ...createMockState([q1, eliminator, q2]),
        playoffFormat: "league" as const,
      };
      const result = hasResolvableTBDTeams(mockState);

      expect(result).toBe(false);
    });

    it("should return false when no playoff matches exist", () => {
      const mockState = createMockState([]);
      const result = hasResolvableTBDTeams(mockState);

      expect(result).toBe(false);
    });
  });
});
