import React from "react";
import { renderHook, act, type RenderHookResult } from "@testing-library/react";
import { TournamentProvider, useTournament } from "../index";
import type { Match } from "../types";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock the localStorage utils
jest.mock("../utils/localStorage", () => ({
  saveTournamentState: jest.fn(),
  loadTournamentState: jest.fn(() => ({
    algorithm: "round-robin",
    teams: [],
    maxOvers: 20,
    maxWickets: 10,
    matches: [],
    isGenerated: false,
    teamStats: {},
    phase: "setup",
    playoffFormat: "world-cup",
  })),
  clearTournamentState: jest.fn(),
}));

describe("Tournament Context", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TournamentProvider>{children}</TournamentProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      expect(result.current.state.algorithm).toBe("round-robin");
      expect(result.current.state.teams).toEqual([]);
      expect(result.current.state.maxOvers).toBe(20);
      expect(result.current.state.maxWickets).toBe(10);
      expect(result.current.state.matches).toEqual([]);
      expect(result.current.state.isGenerated).toBe(false);
      expect(result.current.state.phase).toBe("setup");
      expect(result.current.state.playoffFormat).toBe("world-cup");
    });
  });

  describe("Team Management", () => {
    it("should add teams successfully", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        const added1 = result.current.addTeam("Team A");
        const added2 = result.current.addTeam("Team B");
        expect(added1).toBe(true);
        expect(added2).toBe(true);
      });

      expect(result.current.state.teams).toEqual(["Team A", "Team B"]);
    });

    it("should prevent duplicate team names", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.addTeam("Team A");
      });

      let duplicate: boolean;
      act(() => {
        duplicate = result.current.addTeam("Team A");
      });

      expect(duplicate!).toBe(false);
      expect(result.current.state.teams).toEqual(["Team A"]);
    });

    it("should prevent empty team names", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        const empty = result.current.addTeam("");
        const whitespace = result.current.addTeam("   ");
        expect(empty).toBe(false);
        expect(whitespace).toBe(false);
      });

      expect(result.current.state.teams).toEqual([]);
    });

    it("should remove teams successfully", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
      });

      act(() => {
        result.current.removeTeam("Team B");
      });

      expect(result.current.state.teams).toEqual(["Team A", "Team C"]);
    });

    it("should clear matches when teams change", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
      });

      act(() => {
        result.current.generateMatches();
      });

      expect(result.current.state.matches.length).toBeGreaterThan(0);

      act(() => {
        result.current.addTeam("Team C");
      });

      expect(result.current.state.matches).toEqual([]);
      expect(result.current.state.isGenerated).toBe(false);
    });
  });

  describe("Tournament Settings", () => {
    it("should set max overs", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.setMaxOvers(50);
      });

      expect(result.current.state.maxOvers).toBe(50);
    });

    it("should validate max overs range", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.setMaxOvers(0); // Invalid
      });
      expect(result.current.state.maxOvers).toBe(20); // Should remain unchanged

      act(() => {
        result.current.setMaxOvers(100); // Invalid
      });
      expect(result.current.state.maxOvers).toBe(20); // Should remain unchanged

      act(() => {
        result.current.setMaxOvers(25); // Valid
      });
      expect(result.current.state.maxOvers).toBe(25);
    });

    it("should set max wickets", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.setMaxWickets(11);
      });

      expect(result.current.state.maxWickets).toBe(11);
    });

    it("should validate max wickets range", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.setMaxWickets(0); // Invalid
      });
      expect(result.current.state.maxWickets).toBe(10); // Should remain unchanged

      act(() => {
        result.current.setMaxWickets(15); // Invalid
      });
      expect(result.current.state.maxWickets).toBe(10); // Should remain unchanged

      act(() => {
        result.current.setMaxWickets(8); // Valid
      });
      expect(result.current.state.maxWickets).toBe(8);
    });

    it("should set playoff format", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.setPlayoffFormat("league");
      });

      expect(result.current.state.playoffFormat).toBe("league");
    });
  });

  describe("Tournament Generation", () => {
    it("should generate tournament with round robin and playoff matches", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
      });

      act(() => {
        const generateResult = result.current.generateMatches();
        expect(generateResult.success).toBe(true);
      });

      expect(result.current.state.isGenerated).toBe(true);
      expect(result.current.state.matches.length).toBeGreaterThan(0);

      // Should have both round robin and playoff matches
      const roundRobinMatches = result.current.state.matches.filter(
        (m) => !m.isPlayoff
      );
      const playoffMatches = result.current.state.matches.filter(
        (m) => m.isPlayoff
      );

      expect(roundRobinMatches.length).toBe(3); // 3 teams = 3 matches
      expect(playoffMatches.length).toBe(1); // 3 teams = 1 final match with TBD

      // Check playoff matches have TBD teams initially
      playoffMatches.forEach((match) => {
        expect(match.team1).toBe("TBD");
        expect(match.team2).toBe("TBD");
        expect(match.status).toBe("scheduled");
        expect(match.isPlayoff).toBe(true);
      });
    });

    it("should generate different playoff structures based on format", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Set up 4 teams
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.addTeam("Team D");
      });

      // Test World Cup format
      act(() => {
        result.current.setPlayoffFormat("world-cup");
      });

      act(() => {
        result.current.generateMatches();
      });

      const worldCupPlayoffs = result.current.state.matches.filter(
        (m) => m.isPlayoff
      );
      expect(worldCupPlayoffs).toHaveLength(3); // 2 semi-finals + 1 final

      // Reset and test League format
      act(() => {
        result.current.resetTournament();
      });

      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.addTeam("Team D");
        result.current.setPlayoffFormat("league");
      });

      act(() => {
        result.current.generateMatches();
      });

      const leaguePlayoffs = result.current.state.matches.filter(
        (m) => m.isPlayoff
      );
      expect(leaguePlayoffs).toHaveLength(4); // Q1 + Eliminator + Q2 + Final
    });

    it("should fail to generate with insufficient teams", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.addTeam("Only Team");
      });

      act(() => {
        const generateResult = result.current.generateMatches();
        expect(generateResult.success).toBe(false);
        expect(generateResult.errors?.length).toBeGreaterThan(0);
      });

      expect(result.current.state.isGenerated).toBe(false);
    });
  });

  describe("Match Management", () => {
    let renderResult: RenderHookResult<
      ReturnType<typeof useTournament>,
      { children: React.ReactNode }
    >;

    beforeEach(() => {
      renderResult = renderHook(() => useTournament(), { wrapper });

      act(() => {
        renderResult.result.current.addTeam("Team A");
        renderResult.result.current.addTeam("Team B");
        renderResult.result.current.addTeam("Team C");
      });

      act(() => {
        renderResult.result.current.generateMatches();
      });
    });

    it("should start a match", () => {
      const matches = renderResult.result.current.state.matches;
      const firstMatch = matches.find((m: Match) => !m.isPlayoff);

      expect(firstMatch).toBeDefined();
      expect(firstMatch?.id).toBeDefined();

      act(() => {
        renderResult.result.current.startMatch(firstMatch!.id);
      });

      const updatedMatches = renderResult.result.current.state.matches;
      const updatedMatch = updatedMatches.find(
        (m: Match) => m.id === firstMatch!.id
      );
      expect(updatedMatch?.status).toBe("in-progress");
    });

    it("should simulate match results", () => {
      const matches = renderResult.result.current.state.matches;
      const firstMatch = matches.find((m: Match) => !m.isPlayoff);

      expect(firstMatch).toBeDefined();
      expect(firstMatch?.id).toBeDefined();

      act(() => {
        renderResult.result.current.simulateMatchResult(
          firstMatch!.id,
          { runs: 150, wickets: 5, overs: 20 },
          { runs: 140, wickets: 8, overs: 20 }
        );
      });

      const updatedMatches = renderResult.result.current.state.matches;
      const updatedMatch = updatedMatches.find(
        (m: Match) => m.id === firstMatch!.id
      );
      expect(updatedMatch?.result).toBeDefined();
      expect(updatedMatch?.result?.team1Innings?.runs).toBe(150);
      expect(updatedMatch?.result?.team2Innings?.runs).toBe(140);
    });

    it("should complete a match and update team stats", () => {
      const matches = renderResult.result.current.state.matches;
      const firstMatch = matches.find((m: Match) => !m.isPlayoff);

      expect(firstMatch).toBeDefined();
      expect(firstMatch?.id).toBeDefined();

      act(() => {
        renderResult.result.current.simulateMatchResult(
          firstMatch!.id,
          { runs: 150, wickets: 5, overs: 20 },
          { runs: 140, wickets: 8, overs: 20 }
        );
      });

      act(() => {
        const result = renderResult.result.current.completeMatch(
          firstMatch!.id
        );
        expect(result.nextMatchId).toBeDefined();
      });

      const updatedMatches = renderResult.result.current.state.matches;
      const updatedMatch = updatedMatches.find(
        (m: Match) => m.id === firstMatch!.id
      );
      expect(updatedMatch?.status).toBe("completed");
      expect(updatedMatch?.result?.winner).toBe(firstMatch!.team1); // Team with higher score
      expect(updatedMatch?.result?.loser).toBe(firstMatch!.team2);
    });

    it("should generate toss for matches", () => {
      const matches = renderResult.result.current.state.matches;
      const firstMatch = matches.find((m: Match) => !m.isPlayoff);

      expect(firstMatch).toBeDefined();
      expect(firstMatch?.id).toBeDefined();

      act(() => {
        renderResult.result.current.generateRandomToss(firstMatch!.id);
      });

      const updatedMatches = renderResult.result.current.state.matches;
      const updatedMatch = updatedMatches.find(
        (m: Match) => m.id === firstMatch!.id
      );
      expect(updatedMatch?.toss).toBeDefined();
      expect(updatedMatch?.toss?.tossWinner).toMatch(/Team A|Team B|Team C/);
      expect(updatedMatch?.toss?.decision).toMatch(/bat|bowl/);
    });
  });

  describe("Utility Functions", () => {
    it("should validate teams correctly", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Test valid teams
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
      });

      let validation = result.current.validateTeams();
      expect(validation.valid).toBe(true);

      // Test invalid (too few teams)
      act(() => {
        result.current.resetTournament();
        result.current.addTeam("Only Team");
      });

      validation = result.current.validateTeams();
      expect(validation.valid).toBe(false);
    });

    it("should calculate tournament stats", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.addTeam("Team D");
      });

      const stats = result.current.getStats();
      expect(stats).toBeDefined();
      expect(stats?.teamCount).toBe(4);
      expect(stats?.totalMatches).toBe(6); // 4 teams = 6 matches
      expect(stats?.matchesPerTeam).toBe(3); // Each team plays 3 matches
    });

    it("should check tournament completion status", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Initially not complete
      expect(result.current.isTournamentComplete()).toBe(false);
      expect(result.current.getTournamentWinner()).toBeNull();

      // Set up and generate tournament
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
      });

      act(() => {
        result.current.generateMatches();
      });

      // Complete all round robin matches first
      const roundRobinMatches = result.current.state.matches.filter(
        (m) => !m.isPlayoff
      );

      // Complete each match individually with separate act blocks to ensure proper state updates
      roundRobinMatches.forEach((match) => {
        act(() => {
          result.current.simulateMatchResult(
            match.id,
            { runs: 150, wickets: 5, overs: 20 },
            { runs: 140, wickets: 8, overs: 20 }
          );
        });

        act(() => {
          result.current.completeMatch(match.id);
        });
      });

      // Still not complete
      expect(result.current.isTournamentComplete()).toBe(false);

      // Complete the final match
      const matches = result.current.state.matches;
      const finalMatch = matches.find(
        (m: Match) => m.isPlayoff && m.playoffType === "final"
      );

      expect(finalMatch).toBeDefined();
      expect(finalMatch?.id).toBeDefined();

      // Complete final match with separate act blocks to ensure proper state updates
      act(() => {
        result.current.simulateMatchResult(
          finalMatch!.id,
          { runs: 150, wickets: 5, overs: 20 },
          { runs: 140, wickets: 8, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(finalMatch!.id);
      });

      // Now should be complete
      expect(result.current.isTournamentComplete()).toBe(true);
      expect(result.current.getTournamentWinner()).toBeDefined();
    });

    it("should reset tournament correctly", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Set up tournament
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.setMaxOvers(50);
        result.current.setPlayoffFormat("league");
      });

      act(() => {
        result.current.generateMatches();
      });

      expect(result.current.state.teams.length).toBe(3);
      expect(result.current.state.matches.length).toBeGreaterThan(0);
      expect(result.current.state.maxOvers).toBe(50);

      // Reset
      act(() => {
        result.current.resetTournament();
      });

      // Should be back to initial state
      expect(result.current.state.teams).toEqual([]);
      expect(result.current.state.matches).toEqual([]);
      expect(result.current.state.maxOvers).toBe(20);
      expect(result.current.state.playoffFormat).toBe("world-cup");
      expect(result.current.state.isGenerated).toBe(false);
    });
  });
});
