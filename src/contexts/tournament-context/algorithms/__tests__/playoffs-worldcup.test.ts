import {
  generateWorldCupPlayoffMatchesWithTBD,
  canGeneratePlayoffs,
  getPlayoffStatus,
  isRoundRobinComplete,
} from "../playoffs";
import type {
  TournamentState,
  Match,
  CricketTeamStats,
  CricketMatchResult,
} from "../../types";
import { getTournamentStandings } from "../cricket-stats";

// Mock the cricket-stats module
jest.mock("../cricket-stats", () => ({
  getTournamentStandings: jest.fn(),
}));

const mockGetTournamentStandings =
  getTournamentStandings as jest.MockedFunction<typeof getTournamentStandings>;

describe("World Cup Playoff Algorithm", () => {
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
      playoffFormat: "world-cup",
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateWorldCupPlayoffMatchesWithTBD", () => {
    it("should generate TBD final for 3 teams", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], false);
      const result = generateWorldCupPlayoffMatchesWithTBD(mockState);

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

    it("should generate TBD semi-finals and final for 4+ teams", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        false
      );
      const result = generateWorldCupPlayoffMatchesWithTBD(mockState);

      expect(result.success).toBe(true);
      expect(result.playoffMatches).toHaveLength(3);
      expect(result.qualifiedTeams).toEqual([]);

      const semiFinals = result.playoffMatches.filter((m) =>
        m.playoffType?.includes("semi-final")
      );
      const finals = result.playoffMatches.filter(
        (m) => m.playoffType === "final"
      );

      expect(semiFinals).toHaveLength(2);
      expect(finals).toHaveLength(1);

      // Check semi-final 1
      const sf1 = semiFinals.find((m) => m.playoffType === "semi-final-1");
      expect(sf1?.team1).toBe("TBD");
      expect(sf1?.team2).toBe("TBD");
      expect(sf1?.round).toBe(1);

      // Check semi-final 2
      const sf2 = semiFinals.find((m) => m.playoffType === "semi-final-2");
      expect(sf2?.team1).toBe("TBD");
      expect(sf2?.team2).toBe("TBD");
      expect(sf2?.round).toBe(1);

      // Check final
      const final = finals[0];
      expect(final.team1).toBe("TBD");
      expect(final.team2).toBe("TBD");
      expect(final.round).toBe(2);
    });

    it("should fail with insufficient teams", () => {
      const mockState = createMockState(["Team A", "Team B"], false);
      const result = generateWorldCupPlayoffMatchesWithTBD(mockState);

      expect(result.success).toBe(false);
      expect(result.playoffMatches).toHaveLength(0);
      expect(result.errors).toContain(
        "At least 3 teams are required for playoffs"
      );
    });

    it("should generate matches with correct properties", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        false
      );
      mockState.maxOvers = 50;
      mockState.maxWickets = 11;

      const result = generateWorldCupPlayoffMatchesWithTBD(mockState);

      result.playoffMatches.forEach((match) => {
        expect(match.overs).toBe(50);
        expect(match.maxWickets).toBe(11);
        expect(match.isPlayoff).toBe(true);
        expect(match.status).toBe("scheduled");
        expect(match.phase).toBe("playoffs");
      });
    });
  });

  describe("isRoundRobinComplete", () => {
    it("should return true when all round robin matches are completed", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], true);
      const result = isRoundRobinComplete(mockState);
      expect(result).toBe(true);
    });

    it("should return false when round robin matches are scheduled", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], false);
      // Add incomplete round robin match
      mockState.matches.push({
        id: "RR-001",
        team1: "Team A",
        team2: "Team B",
        round: 1,
        status: "scheduled",
        overs: 20,
        maxWickets: 10,
        isPlayoff: false,
        phase: "round-robin",
      });

      const result = isRoundRobinComplete(mockState);
      expect(result).toBe(false);
    });

    it("should return false when no matches exist", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], false);
      const result = isRoundRobinComplete(mockState);
      expect(result).toBe(false);
    });

    it("should ignore playoff matches when checking completion", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], true);
      // Add scheduled playoff match
      mockState.matches.push({
        id: "F-001",
        team1: "TBD",
        team2: "TBD",
        round: 1,
        status: "scheduled",
        overs: 20,
        maxWickets: 10,
        isPlayoff: true,
        playoffType: "final",
        phase: "playoffs",
      });

      const result = isRoundRobinComplete(mockState);
      expect(result).toBe(true); // Should still be true despite scheduled playoff
    });
  });

  describe("canGeneratePlayoffs", () => {
    it("should allow playoffs when round robin is complete and has enough teams", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], true);
      mockGetTournamentStandings.mockReturnValue([
        { teamName: "Team A" } as Partial<CricketTeamStats>,
        { teamName: "Team B" } as Partial<CricketTeamStats>,
        { teamName: "Team C" } as Partial<CricketTeamStats>,
      ] as CricketTeamStats[]);

      const result = canGeneratePlayoffs(mockState);
      expect(result.canGenerate).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it("should prevent playoffs when round robin is not complete", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], false);
      mockState.matches.push({
        id: "RR-001",
        team1: "Team A",
        team2: "Team B",
        round: 1,
        status: "scheduled",
        overs: 20,
        maxWickets: 10,
        isPlayoff: false,
        phase: "round-robin",
      });

      const result = canGeneratePlayoffs(mockState);
      expect(result.canGenerate).toBe(false);
      expect(result.reasons).toContain(
        "Round robin phase must be completed first"
      );
    });

    it("should prevent playoffs with insufficient teams", () => {
      const mockState = createMockState(["Team A", "Team B"], true);
      mockGetTournamentStandings.mockReturnValue([
        { teamName: "Team A" } as Partial<CricketTeamStats>,
        { teamName: "Team B" } as Partial<CricketTeamStats>,
      ] as CricketTeamStats[]);

      const result = canGeneratePlayoffs(mockState);
      expect(result.canGenerate).toBe(false);
      expect(result.reasons).toContain("Minimum 3 teams required for playoffs");
    });

    it("should prevent playoffs when already generated", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], true);
      mockState.matches.push({
        id: "F-001",
        team1: "TBD",
        team2: "TBD",
        round: 1,
        status: "scheduled",
        overs: 20,
        maxWickets: 10,
        isPlayoff: true,
        playoffType: "final",
        phase: "playoffs",
      });

      mockGetTournamentStandings.mockReturnValue([
        { teamName: "Team A" } as Partial<CricketTeamStats>,
        { teamName: "Team B" } as Partial<CricketTeamStats>,
        { teamName: "Team C" } as Partial<CricketTeamStats>,
      ] as CricketTeamStats[]);

      const result = canGeneratePlayoffs(mockState);
      expect(result.canGenerate).toBe(false);
      expect(result.reasons).toContain("Playoffs already generated");
    });
  });

  describe("getPlayoffStatus", () => {
    it("should return not-started when round robin is not complete", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], false);
      mockState.matches.push({
        id: "RR-001",
        team1: "Team A",
        team2: "Team B",
        round: 1,
        status: "scheduled",
        overs: 20,
        maxWickets: 10,
        isPlayoff: false,
        phase: "round-robin",
      });

      const result = getPlayoffStatus(mockState);
      expect(result.phase).toBe("not-started");
      expect(result.description).toBe("Round robin phase in progress");
      expect(result.nextAction).toBe("Complete all round robin matches");
    });

    it("should return not-started when ready to generate playoffs", () => {
      const mockState = createMockState(["Team A", "Team B", "Team C"], true);

      const result = getPlayoffStatus(mockState);
      expect(result.phase).toBe("not-started");
      expect(result.description).toBe("Ready to generate playoffs");
      expect(result.nextAction).toBe("Generate playoff matches");
    });

    it("should return semi-finals when semi-finals are in progress", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      mockState.matches.push(
        {
          id: "SF-001",
          team1: "Team A",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "semi-final-1",
          phase: "playoffs",
          result: {
            winner: "Team A",
            loser: "Team D",
          } as Partial<CricketMatchResult>,
        } as Match,
        {
          id: "SF-002",
          team1: "Team B",
          team2: "Team C",
          round: 1,
          status: "scheduled", // Still in progress
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "semi-final-2",
          phase: "playoffs",
        }
      );

      const result = getPlayoffStatus(mockState);
      expect(result.phase).toBe("semi-finals");
      expect(result.description).toBe(
        "Semi-finals in progress (1/2 completed)"
      );
      expect(result.nextAction).toBe("Complete remaining semi-final matches");
    });

    it("should return finals when final is ready", () => {
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      mockState.matches.push(
        {
          id: "SF-001",
          team1: "Team A",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "semi-final-1",
          phase: "playoffs",
        },
        {
          id: "SF-002",
          team1: "Team B",
          team2: "Team C",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "semi-final-2",
          phase: "playoffs",
        },
        {
          id: "F-001",
          team1: "Team A",
          team2: "Team B",
          round: 2,
          status: "scheduled",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "final",
          phase: "playoffs",
        }
      );

      const result = getPlayoffStatus(mockState);
      expect(result.phase).toBe("finals");
      expect(result.description).toBe("Final is ready");
      expect(result.nextAction).toBe("Complete the final match");
    });

    it("should return completed when tournament is finished", () => {
      // Use 4-team tournament to test World Cup format properly (needs semi-finals)
      const mockState = createMockState(
        ["Team A", "Team B", "Team C", "Team D"],
        true
      );
      // Add completed semi-finals and completed final
      mockState.matches.push(
        {
          id: "SF-001",
          team1: "Team A",
          team2: "Team D",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "semi-final-1",
          phase: "playoffs",
        },
        {
          id: "SF-002",
          team1: "Team B",
          team2: "Team C",
          round: 1,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "semi-final-2",
          phase: "playoffs",
        },
        {
          id: "F-001",
          team1: "Team A",
          team2: "Team B",
          round: 2,
          status: "completed",
          overs: 20,
          maxWickets: 10,
          isPlayoff: true,
          playoffType: "final",
          phase: "playoffs",
        }
      );

      const result = getPlayoffStatus(mockState);
      expect(result.phase).toBe("completed");
      expect(result.description).toBe("Tournament completed!");
      expect(result.nextAction).toBeUndefined();
    });
  });
});
