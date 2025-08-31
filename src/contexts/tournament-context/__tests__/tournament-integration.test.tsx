import React from "react";
import { renderHook, act } from "@testing-library/react";
import { TournamentProvider, useTournament } from "../index";

// Mock localStorage
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

describe("Tournament Integration Tests", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TournamentProvider>{children}</TournamentProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete 3-Team Tournament Flow", () => {
    it("should complete entire tournament flow with TBD playoff resolution", async () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Step 1: Set up tournament
      act(() => {
        result.current.addTeam("Mumbai Indians");
        result.current.addTeam("Chennai Super Kings");
        result.current.addTeam("Royal Challengers");
        result.current.setPlayoffFormat("world-cup");
      });

      // Step 2: Generate tournament (should create both round robin and TBD playoffs)
      act(() => {
        const generateResult = result.current.generateMatches();
        expect(generateResult.success).toBe(true);
      });

      const allMatches = result.current.state.matches;
      const roundRobinMatches = allMatches.filter((m) => !m.isPlayoff);
      const playoffMatches = allMatches.filter((m) => m.isPlayoff);

      expect(roundRobinMatches).toHaveLength(3); // 3 teams = 3 matches
      expect(playoffMatches).toHaveLength(1); // 3 teams = 1 final
      expect(playoffMatches[0].team1).toBe("TBD");
      expect(playoffMatches[0].team2).toBe("TBD");

      // Step 3: Play all round robin matches
      for (const match of roundRobinMatches) {
        // Generate random but realistic scores
        const team1Score = Math.floor(Math.random() * 50) + 120;
        const team2Score = Math.floor(Math.random() * 50) + 110;

        act(() => {
          result.current.simulateMatchResult(
            match.id,
            { runs: team1Score, wickets: 6, overs: 20 },
            { runs: team2Score, wickets: 8, overs: 20 }
          );
        });

        act(() => {
          result.current.completeMatch(match.id);
        });
      }

      // Step 4: Check if round robin is complete
      expect(result.current.isRoundRobinComplete()).toBe(true);

      // Step 5: Get final standings and verify playoff teams are updated
      const finalStandings = result.current.getTeamStandings();
      expect(finalStandings).toHaveLength(3);

      // The playoff final should now have actual team names (not TBD)
      const updatedMatches = result.current.state.matches;
      const finalMatch = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      );

      expect(finalMatch?.team1).not.toBe("TBD");
      expect(finalMatch?.team2).not.toBe("TBD");
      expect(finalMatch?.team1).toBe(finalStandings[0].teamName); // 1st place
      expect(finalMatch?.team2).toBe(finalStandings[1].teamName); // 2nd place

      // Step 6: Play the final
      act(() => {
        result.current.simulateMatchResult(
          finalMatch!.id,
          { runs: 160, wickets: 5, overs: 20 },
          { runs: 155, wickets: 7, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(finalMatch!.id);
      });

      // Step 7: Verify tournament completion
      expect(result.current.isTournamentComplete()).toBe(true);
      const winner = result.current.getTournamentWinner();
      expect(winner).toBeDefined();
      expect(winner).toBe(finalStandings[0].teamName); // Winner should be team with higher score
    });
  });

  describe("Complete 4-Team World Cup Tournament Flow", () => {
    it("should complete 4-team World Cup format with semi-finals", async () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Step 1: Set up 4-team tournament
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.addTeam("Team D");
        result.current.setPlayoffFormat("world-cup");
      });

      // Step 2: Generate tournament
      act(() => {
        const generateResult = result.current.generateMatches();
        expect(generateResult.success).toBe(true);
      });

      const allMatches = result.current.state.matches;
      const roundRobinMatches = allMatches.filter((m) => !m.isPlayoff);
      const playoffMatches = allMatches.filter((m) => m.isPlayoff);

      expect(roundRobinMatches).toHaveLength(6); // 4 teams = 6 matches
      expect(playoffMatches).toHaveLength(3); // 2 semi-finals + 1 final

      // All playoff matches should start with TBD
      playoffMatches.forEach((match) => {
        expect(match.team1).toBe("TBD");
        expect(match.team2).toBe("TBD");
      });

      // Step 3: Complete all round robin matches
      for (const match of roundRobinMatches) {
        act(() => {
          result.current.simulateMatchResult(
            match.id,
            { runs: 150, wickets: 6, overs: 20 },
            { runs: 140, wickets: 8, overs: 20 }
          );
        });

        act(() => {
          result.current.completeMatch(match.id);
        });
      }

      // Step 4: Verify semi-finals are populated with actual teams
      const updatedMatches = result.current.state.matches;
      const semiFinals = updatedMatches.filter(
        (m) => m.isPlayoff && m.playoffType?.includes("semi-final")
      );
      const final = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      );

      expect(semiFinals).toHaveLength(2);
      semiFinals.forEach((sf) => {
        expect(sf.team1).not.toBe("TBD");
        expect(sf.team2).not.toBe("TBD");
      });
      // Final should still have TBD until semi-finals complete
      expect(final?.team1).toBe("TBD");
      expect(final?.team2).toBe("TBD");

      // Step 5: Play semi-finals
      for (const sf of semiFinals) {
        act(() => {
          result.current.simulateMatchResult(
            sf.id,
            { runs: 160, wickets: 5, overs: 20 },
            { runs: 150, wickets: 7, overs: 20 }
          );
        });

        act(() => {
          result.current.completeMatch(sf.id);
        });
      }

      // Step 6: Verify final is now populated
      const finalUpdatedMatches = result.current.state.matches;
      const updatedFinal = finalUpdatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      );

      expect(updatedFinal?.team1).not.toBe("TBD");
      expect(updatedFinal?.team2).not.toBe("TBD");

      // Step 7: Play final
      act(() => {
        result.current.simulateMatchResult(
          updatedFinal!.id,
          { runs: 170, wickets: 4, overs: 20 },
          { runs: 165, wickets: 8, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(updatedFinal!.id);
      });

      // Step 8: Verify tournament completion
      expect(result.current.isTournamentComplete()).toBe(true);
      const winner = result.current.getTournamentWinner();
      expect(winner).toBeDefined();
    });
  });

  describe("Complete 4-Team League Tournament Flow", () => {
    it("should complete 4-team League format with Q1, Eliminator, Q2, and Final", async () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Step 1: Set up 4-team league tournament
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.addTeam("Team D");
        result.current.setPlayoffFormat("league");
      });

      // Step 2: Generate tournament
      act(() => {
        const generateResult = result.current.generateMatches();
        expect(generateResult.success).toBe(true);
      });

      const allMatches = result.current.state.matches;
      const playoffMatches = allMatches.filter((m) => m.isPlayoff);

      expect(playoffMatches).toHaveLength(4); // Q1 + Eliminator + Q2 + Final

      const q1 = playoffMatches.find((m) => m.playoffType === "qualifier-1");
      const eliminator = playoffMatches.find(
        (m) => m.playoffType === "eliminator"
      );
      const q2 = playoffMatches.find((m) => m.playoffType === "qualifier-2");
      const final = playoffMatches.find((m) => m.playoffType === "final");

      expect(q1).toBeDefined();
      expect(eliminator).toBeDefined();
      expect(q2).toBeDefined();
      expect(final).toBeDefined();

      // Step 3: Complete round robin matches
      const roundRobinMatches = allMatches.filter((m) => !m.isPlayoff);
      for (const match of roundRobinMatches) {
        act(() => {
          result.current.simulateMatchResult(
            match.id,
            { runs: 150, wickets: 6, overs: 20 },
            { runs: 140, wickets: 8, overs: 20 }
          );
        });

        act(() => {
          result.current.completeMatch(match.id);
        });
      }

      // Step 4: Verify Q1 and Eliminator are populated
      const updatedMatches1 = result.current.state.matches;
      const updatedQ1 = updatedMatches1.find(
        (m) => m.playoffType === "qualifier-1"
      );
      const updatedEliminator = updatedMatches1.find(
        (m) => m.playoffType === "eliminator"
      );

      expect(updatedQ1?.team1).not.toBe("TBD");
      expect(updatedQ1?.team2).not.toBe("TBD");
      expect(updatedEliminator?.team1).not.toBe("TBD");
      expect(updatedEliminator?.team2).not.toBe("TBD");

      // Step 5: Play Q1
      act(() => {
        result.current.simulateMatchResult(
          updatedQ1!.id,
          { runs: 160, wickets: 5, overs: 20 },
          { runs: 150, wickets: 7, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(updatedQ1!.id);
      });

      // Step 6: Play Eliminator
      act(() => {
        result.current.simulateMatchResult(
          updatedEliminator!.id,
          { runs: 145, wickets: 6, overs: 20 },
          { runs: 140, wickets: 8, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(updatedEliminator!.id);
      });

      // Step 7: Verify Q2 and Final are updated
      const updatedMatches2 = result.current.state.matches;
      const updatedQ2 = updatedMatches2.find(
        (m) => m.playoffType === "qualifier-2"
      );
      const updatedFinal1 = updatedMatches2.find(
        (m) => m.playoffType === "final"
      );

      expect(updatedQ2?.team1).not.toBe("TBD"); // Q1 loser
      expect(updatedQ2?.team2).not.toBe("TBD"); // Eliminator winner
      expect(updatedFinal1?.team1).not.toBe("TBD"); // Q1 winner (direct entry)
      expect(updatedFinal1?.team2).toBe("TBD"); // Still waiting for Q2 winner

      // Step 8: Play Q2
      act(() => {
        result.current.simulateMatchResult(
          updatedQ2!.id,
          { runs: 155, wickets: 6, overs: 20 },
          { runs: 150, wickets: 8, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(updatedQ2!.id);
      });

      // Step 9: Verify Final is fully populated
      const updatedMatches3 = result.current.state.matches;
      const updatedFinal2 = updatedMatches3.find(
        (m) => m.playoffType === "final"
      );

      expect(updatedFinal2?.team1).not.toBe("TBD");
      expect(updatedFinal2?.team2).not.toBe("TBD");

      // Step 10: Play Final
      act(() => {
        result.current.simulateMatchResult(
          updatedFinal2!.id,
          { runs: 165, wickets: 5, overs: 20 },
          { runs: 160, wickets: 7, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(updatedFinal2!.id);
      });

      // Step 11: Verify tournament completion
      expect(result.current.isTournamentComplete()).toBe(true);
      const winner = result.current.getTournamentWinner();
      expect(winner).toBeDefined();
    });
  });

  describe("Tournament Status and Navigation", () => {
    it("should provide correct playoff status throughout the tournament", () => {
      const { result } = renderHook(() => useTournament(), { wrapper });

      // Set up tournament
      act(() => {
        result.current.addTeam("Team A");
        result.current.addTeam("Team B");
        result.current.addTeam("Team C");
        result.current.addTeam("Team D");
        result.current.setPlayoffFormat("world-cup");
      });

      act(() => {
        result.current.generateMatches();
      });

      // Initially: not started (round robin in progress)
      let status = result.current.getPlayoffStatus();
      expect(status.phase).toBe("not-started");

      // Complete round robin
      const roundRobinMatches = result.current.state.matches.filter(
        (m) => !m.isPlayoff
      );
      for (const match of roundRobinMatches) {
        act(() => {
          result.current.simulateMatchResult(
            match.id,
            { runs: 150, wickets: 6, overs: 20 },
            { runs: 140, wickets: 8, overs: 20 }
          );
        });

        act(() => {
          result.current.completeMatch(match.id);
        });
      }

      // Should now be ready for semi-finals since round robin is complete
      status = result.current.getPlayoffStatus();
      expect(status.phase).toBe("semi-finals");

      // Play one semi-final
      const semiFinalsMatches = result.current.state.matches.filter(
        (m) => m.isPlayoff && m.playoffType?.includes("semi-final")
      );

      act(() => {
        result.current.simulateMatchResult(
          semiFinalsMatches[0].id,
          { runs: 160, wickets: 5, overs: 20 },
          { runs: 150, wickets: 7, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(semiFinalsMatches[0].id);
      });

      // Should be in semi-finals phase
      status = result.current.getPlayoffStatus();
      expect(status.phase).toBe("semi-finals");
      expect(status.description).toContain(
        "Semi-finals in progress (1/2 completed)"
      );

      // Complete second semi-final
      act(() => {
        result.current.simulateMatchResult(
          semiFinalsMatches[1].id,
          { runs: 160, wickets: 5, overs: 20 },
          { runs: 150, wickets: 7, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(semiFinalsMatches[1].id);
      });

      // Should be finals phase
      status = result.current.getPlayoffStatus();
      expect(status.phase).toBe("finals");

      // Complete final
      const finalMatch = result.current.state.matches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      );

      act(() => {
        result.current.simulateMatchResult(
          finalMatch!.id,
          { runs: 170, wickets: 4, overs: 20 },
          { runs: 165, wickets: 8, overs: 20 }
        );
      });

      act(() => {
        result.current.completeMatch(finalMatch!.id);
      });

      // Should be completed
      status = result.current.getPlayoffStatus();
      expect(status.phase).toBe("completed");
      expect(status.description).toBe("Tournament completed!");
    });
  });
});
