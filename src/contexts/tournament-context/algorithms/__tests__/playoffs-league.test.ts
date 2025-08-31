import {
  generateLeaguePlayoffMatchesWithTBD,
  getLeaguePlayoffStatus,
} from "../playoffs-league";
import type { TournamentState, Match } from "../../types";

describe("League Playoff Algorithm", () => {
  const createMockState = (
    teams: string[],
    hasRoundRobinMatches = true,
    playoffMatches: Match[] = []
  ): TournamentState => {
    const roundRobinMatches: Match[] = hasRoundRobinMatches
      ? teams.flatMap((team1, i) =>
          teams.slice(i + 1).map((team2, j) => ({
            id: `RR-${i}-${j}`,
            team1,
            team2,
            round: 1,
            status: "completed" as const,
            overs: 20,
            maxWickets: 10,
            isPlayoff: false,
            phase: "round-robin" as const,
          }))
        )
      : [];

    return {
      algorithm: "round-robin",
      teams,
      maxOvers: 20,
      maxWickets: 10,
      matches: [...roundRobinMatches, ...playoffMatches],
      isGenerated: true,
      teamStats: {},
      phase: hasRoundRobinMatches ? "round-robin" : "setup",
      playoffFormat: "league",
    };
  };

  describe("generateLeaguePlayoffMatchesWithTBD", () => {
    it("should generate TBD final for 3 teams (fallback to simple format)", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], false);
      const result = generateLeaguePlayoffMatchesWithTBD(mockState);

      expect(result.success).toBe(true);
      expect(result.playoffMatches).toHaveLength(1);
      expect(result.qualifiedTeams).toEqual([]);

      const final = result.playoffMatches[0];
      expect(final.id).toBe("F-001");
      expect(final.team1).toBe("TBD");
      expect(final.team2).toBe("TBD");
      expect(final.playoffType).toBe("final");
      expect(final.isPlayoff).toBe(true);
      expect(final.status).toBe("scheduled");
      expect(final.round).toBe(1);
    });

    it("should generate TBD league format matches for 4+ teams", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        false
      );
      const result = generateLeaguePlayoffMatchesWithTBD(mockState);

      expect(result.success).toBe(true);
      expect(result.playoffMatches).toHaveLength(4);
      expect(result.qualifiedTeams).toEqual([]);

      const qualifier1 = result.playoffMatches.find(
        (m) => m.playoffType === "qualifier-1"
      );
      const eliminator = result.playoffMatches.find(
        (m) => m.playoffType === "eliminator"
      );
      const qualifier2 = result.playoffMatches.find(
        (m) => m.playoffType === "qualifier-2"
      );
      const final = result.playoffMatches.find(
        (m) => m.playoffType === "final"
      );

      expect(qualifier1).toBeDefined();
      expect(eliminator).toBeDefined();
      expect(qualifier2).toBeDefined();
      expect(final).toBeDefined();

      // Check Qualifier 1
      expect(qualifier1?.id).toBe("Q1-001");
      expect(qualifier1?.team1).toBe("TBD");
      expect(qualifier1?.team2).toBe("TBD");
      expect(qualifier1?.round).toBe(1);

      // Check Eliminator
      expect(eliminator?.id).toBe("E-001");
      expect(eliminator?.team1).toBe("TBD");
      expect(eliminator?.team2).toBe("TBD");
      expect(eliminator?.round).toBe(1);

      // Check Qualifier 2
      expect(qualifier2?.id).toBe("Q2-001");
      expect(qualifier2?.team1).toBe("TBD");
      expect(qualifier2?.team2).toBe("TBD");
      expect(qualifier2?.round).toBe(2);

      // Check Final
      expect(final?.id).toBe("F-001");
      expect(final?.team1).toBe("TBD");
      expect(final?.team2).toBe("TBD");
      expect(final?.round).toBe(3);
    });

    it("should fail with insufficient teams", () => {
      const mockState = createMockState(["Team A", "Team B"], false);
      const result = generateLeaguePlayoffMatchesWithTBD(mockState);

      expect(result.success).toBe(false);
      expect(result.playoffMatches).toHaveLength(0);
      expect(result.errors).toContain(
        "At least 3 teams are required for playoffs"
      );
    });

    it("should generate matches with correct properties", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D", "Team E"],
        false
      );
      mockState.maxOvers = 50;
      mockState.maxWickets = 11;

      const result = generateLeaguePlayoffMatchesWithTBD(mockState);

      result.playoffMatches.forEach((match) => {
        expect(match.overs).toBe(50);
        expect(match.maxWickets).toBe(11);
        expect(match.isPlayoff).toBe(true);
        expect(match.status).toBe("scheduled");
        expect(match.phase).toBe("playoffs");
      });
    });

    it("should create proper round structure for league format", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        false
      );
      const result = generateLeaguePlayoffMatchesWithTBD(mockState);

      const round1Matches = result.playoffMatches.filter((m) => m.round === 1);
      const round2Matches = result.playoffMatches.filter((m) => m.round === 2);
      const round3Matches = result.playoffMatches.filter((m) => m.round === 3);

      // Round 1: Qualifier 1 and Eliminator
      expect(round1Matches).toHaveLength(2);
      expect(round1Matches.some((m) => m.playoffType === "qualifier-1")).toBe(
        true
      );
      expect(round1Matches.some((m) => m.playoffType === "eliminator")).toBe(
        true
      );

      // Round 2: Qualifier 2
      expect(round2Matches).toHaveLength(1);
      expect(round2Matches[0].playoffType).toBe("qualifier-2");

      // Round 3: Final
      expect(round3Matches).toHaveLength(1);
      expect(round3Matches[0].playoffType).toBe("final");
    });
  });

  describe("getLeaguePlayoffStatus", () => {
    it("should return not-started when no playoffs exist", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("not-started");
      expect(result.description).toBe("Ready to generate league playoffs");
      expect(result.nextAction).toBe("Generate Qualifier 1 and Eliminator");
    });

    it("should return qualification when Q1 and Eliminator are in progress", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      mockState.matches.push(
        {
          id: "Q1-001",
          team1: "Team A",
          team2: "Team B",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-1",
          phase: "playoffs",
        },
        {
          id: "E-001",
          team1: "Team C",
          team2: "Team D",
          round: 1,
          status: "scheduled", // Still in progress
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "eliminator",
          phase: "playoffs",
        }
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("qualification");
      expect(result.description).toBe(
        "Qualification round in progress (1/2 completed)"
      );
      expect(result.nextAction).toBe(
        "Complete remaining qualification matches"
      );
    });

    it("should return qualification completed when Q1 and Eliminator are done but Q2 not generated", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      mockState.matches.push(
        {
          id: "Q1-001",
          team1: "Team A",
          team2: "Team B",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-1",
          phase: "playoffs",
        },
        {
          id: "E-001",
          team1: "Team C",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "eliminator",
          phase: "playoffs",
        }
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("qualification");
      expect(result.description).toBe("Qualification round completed");
      expect(result.nextAction).toBe("Generate Qualifier 2 and Final");
    });

    it("should return qualifier-2 when Q2 is in progress", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      mockState.matches.push(
        {
          id: "Q1-001",
          team1: "Team A",
          team2: "Team B",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-1",
          phase: "playoffs",
        },
        {
          id: "E-001",
          team1: "Team C",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "eliminator",
          phase: "playoffs",
        },
        {
          id: "Q2-001",
          team1: "Team B", // Q1 loser
          team2: "Team C", // Eliminator winner
          round: 2,
          status: "scheduled",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-2",
          phase: "playoffs",
        }
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("qualifier-2");
      expect(result.description).toBe("Qualifier 2 in progress");
      expect(result.nextAction).toBe("Complete Qualifier 2");
    });

    it("should return qualifier-2 completed when Q2 is done but final has TBD", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      mockState.matches.push(
        {
          id: "Q1-001",
          team1: "Team A",
          team2: "Team B",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-1",
          phase: "playoffs",
        },
        {
          id: "E-001",
          team1: "Team C",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "eliminator",
          phase: "playoffs",
        },
        {
          id: "Q2-001",
          team1: "Team B",
          team2: "Team C",
          round: 2,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-2",
          phase: "playoffs",
        },
        {
          id: "F-001",
          team1: "Team A", // Q1 winner
          team2: "TBD", // Q2 winner not set yet
          round: 3,
          status: "scheduled",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "final",
          phase: "playoffs",
        }
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("qualifier-2");
      expect(result.description).toBe("Qualifier 2 completed");
      expect(result.nextAction).toBe("Update final with Q2 winner");
    });

    it("should return final-ready when final is ready to play", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      // Add all required playoff matches with completed status
      mockState.matches.push(
        {
          id: "Q1-001",
          team1: "Team A",
          team2: "Team B",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-1",
          phase: "playoffs",
        },
        {
          id: "E-001",
          team1: "Team C",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "eliminator",
          phase: "playoffs",
        },
        {
          id: "Q2-001",
          team1: "Team B",
          team2: "Team C",
          round: 2,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-2",
          phase: "playoffs",
        },
        // Final ready to play with both teams set
        {
          id: "F-001",
          team1: "Team A",
          team2: "Team B",
          round: 3,
          status: "scheduled",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "final",
          phase: "playoffs",
        }
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("final-ready");
      expect(result.description).toBe("Final is ready");
      expect(result.nextAction).toBe("Complete the final");
    });

    it("should return completed when final is finished", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      // Add all required playoff matches with completed status
      mockState.matches.push(
        {
          id: "Q1-001",
          team1: "Team A",
          team2: "Team B",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-1",
          phase: "playoffs",
        },
        {
          id: "E-001",
          team1: "Team C",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "eliminator",
          phase: "playoffs",
        },
        {
          id: "Q2-001",
          team1: "Team B",
          team2: "Team C",
          round: 2,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "qualifier-2",
          phase: "playoffs",
        },
        // Final completed
        {
          id: "F-001",
          team1: "Team A",
          team2: "Team B",
          round: 3,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "final",
          phase: "playoffs",
        }
      );

      const result = getLeaguePlayoffStatus(mockState);
      expect(result.phase).toBe("completed");
      expect(result.description).toBe("Tournament completed!");
      expect(result.nextAction).toBeUndefined();
    });
  });
});
