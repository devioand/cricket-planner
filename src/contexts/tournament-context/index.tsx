"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  TournamentAction,
  initialTournamentState,
  tournamentReducer,
} from "./state";
import type { TournamentState } from "./types";
import {
  generateRoundRobinMatches,
  validateRoundRobinTeams,
  calculateRoundRobinStats,
} from "./algorithms/round-robin";
import {
  updateTeamStatsAfterMatch,
  getTournamentStandings,
  createSampleMatchResult,
} from "./algorithms/cricket-stats";

// Context interface
interface TournamentContextType {
  state: TournamentState;
  dispatch: React.Dispatch<TournamentAction>;
  // Action methods
  addTeam: (teamName: string) => boolean;
  removeTeam: (teamName: string) => void;
  setMaxOvers: (overs: number) => void;
  setMaxWickets: (wickets: number) => void;
  setAlgorithm: (algorithm: TournamentState["algorithm"]) => void;
  generateMatches: () => { success: boolean; errors?: string[] };
  resetTournament: () => void;
  // Utility methods
  validateTeams: () => { valid: boolean; errors: string[] };
  getStats: () => {
    teamCount: number;
    totalMatches: number;
    matchesPerTeam: number;
    minRounds: number;
  } | null;
  // Statistics methods
  getTeamStandings: () => import("./types").CricketTeamStats[];
  simulateMatchResult: (
    matchId: string,
    team1Score: { runs: number; wickets: number; overs: number },
    team2Score: { runs: number; wickets: number; overs: number }
  ) => void;
  generateSampleResults: () => void;
}

// Create context
const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

// Provider component
interface TournamentProviderProps {
  children: ReactNode;
}

export function TournamentProvider({ children }: TournamentProviderProps) {
  const [state, dispatch] = useReducer(
    tournamentReducer,
    initialTournamentState
  );

  // Action methods
  const addTeam = (teamName: string): boolean => {
    if (!teamName.trim()) {
      console.warn("⚠️ Team name cannot be empty");
      return false;
    }

    if (state.teams.includes(teamName.trim())) {
      console.warn(`⚠️ Team "${teamName}" already exists`);
      return false;
    }

    dispatch({ type: "ADD_TEAM", payload: teamName.trim() });
    return true;
  };

  const removeTeam = (teamName: string): void => {
    dispatch({ type: "REMOVE_TEAM", payload: teamName });
  };

  const setMaxOvers = (overs: number): void => {
    if (overs < 1 || overs > 50) {
      console.warn("⚠️ Overs must be between 1 and 50");
      return;
    }
    dispatch({ type: "SET_MAX_OVERS", payload: overs });
  };

  const setMaxWickets = (wickets: number): void => {
    if (wickets < 1 || wickets > 11) {
      console.warn("⚠️ Wickets must be between 1 and 11");
      return;
    }
    dispatch({ type: "SET_MAX_WICKETS", payload: wickets });
  };

  const setAlgorithm = (algorithm: TournamentState["algorithm"]): void => {
    dispatch({ type: "SET_ALGORITHM", payload: algorithm });
  };

  const generateMatches = (): { success: boolean; errors?: string[] } => {
    console.log("\n🚀 Starting tournament generation from context...");

    // Validate teams first
    const validation = validateRoundRobinTeams(state.teams);
    if (!validation.valid) {
      console.error("❌ Validation failed:", validation.errors);
      return { success: false, errors: validation.errors };
    }

    // Calculate and log stats
    calculateRoundRobinStats(state.teams);

    try {
      // Generate matches based on selected algorithm
      switch (state.algorithm) {
        case "round-robin": {
          const result = generateRoundRobinMatches({
            teams: state.teams,
            maxOvers: state.maxOvers,
            maxWickets: state.maxWickets,
          });
          dispatch({ type: "SET_MATCHES", payload: result.matches });
          break;
        }
        case "single-elimination":
        case "double-elimination":
        case "triple-elimination":
          // Placeholder for future algorithms
          console.warn(`⚠️ ${state.algorithm} algorithm not yet implemented`);
          return {
            success: false,
            errors: [`${state.algorithm} algorithm not yet implemented`],
          };
        default:
          return {
            success: false,
            errors: ["Unknown algorithm selected"],
          };
      }

      console.log("\n🎉 Tournament generation complete!");
      return { success: true };
    } catch (error) {
      console.error("❌ Error generating matches:", error);
      return {
        success: false,
        errors: ["Failed to generate matches. Please try again."],
      };
    }
  };

  const resetTournament = (): void => {
    dispatch({ type: "RESET_TOURNAMENT" });
  };

  // Utility methods
  const validateTeams = () => {
    return validateRoundRobinTeams(state.teams);
  };

  const getStats = () => {
    if (state.teams.length < 2) return null;

    switch (state.algorithm) {
      case "round-robin":
        return calculateRoundRobinStats(state.teams);
      default:
        return null;
    }
  };

  // Statistics methods
  const getTeamStandings = () => {
    return getTournamentStandings(state.teamStats);
  };

  const simulateMatchResult = (
    matchId: string,
    team1Score: { runs: number; wickets: number; overs: number },
    team2Score: { runs: number; wickets: number; overs: number }
  ) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) {
      console.error(`Match ${matchId} not found`);
      return;
    }

    console.log(
      `🏏 Simulating result for match ${matchId}: ${match.team1} vs ${match.team2}`
    );

    // Create match result
    const matchResult = createSampleMatchResult(
      match.team1,
      match.team2,
      team1Score.runs,
      team1Score.wickets,
      team1Score.overs,
      team2Score.runs,
      team2Score.wickets,
      team2Score.overs,
      match.overs
    );

    // Update match with result
    const updatedMatches = state.matches.map((m) =>
      m.id === matchId
        ? { ...m, status: "completed" as const, result: matchResult }
        : m
    );

    // Update team stats
    const updatedTeamStats = { ...state.teamStats };
    updatedTeamStats[match.team1] = updateTeamStatsAfterMatch(
      updatedTeamStats[match.team1],
      match,
      matchResult
    );
    updatedTeamStats[match.team2] = updateTeamStatsAfterMatch(
      updatedTeamStats[match.team2],
      match,
      matchResult
    );

    // Dispatch updates
    dispatch({ type: "SET_MATCHES", payload: updatedMatches });
    dispatch({ type: "UPDATE_TEAM_STATS", payload: updatedTeamStats });

    console.log(`✅ Match ${matchId} completed with result`);
  };

  const generateSampleResults = () => {
    console.log("🎲 Generating sample match results...");

    const scheduledMatches = state.matches.filter(
      (m) => m.status === "scheduled"
    );

    scheduledMatches.forEach((match, index) => {
      // Generate random but realistic cricket scores
      const team1Runs = Math.floor(Math.random() * 100) + 100; // 100-200 runs
      const team1Wickets = Math.floor(Math.random() * 10) + 1; // 1-10 wickets
      const team1Overs = match.overs - Math.random() * 10; // Some variation in overs

      // Team 2 chasing - make it competitive
      const difference = Math.floor(Math.random() * 40) - 20; // -20 to +20 runs difference
      const team2Runs = Math.max(50, team1Runs + difference);
      const team2Wickets = Math.floor(Math.random() * 10) + 1;
      const team2Overs = match.overs - Math.random() * 15;

      setTimeout(() => {
        simulateMatchResult(
          match.id,
          { runs: team1Runs, wickets: team1Wickets, overs: team1Overs },
          { runs: team2Runs, wickets: team2Wickets, overs: team2Overs }
        );
      }, index * 100); // Stagger the updates
    });
  };

  const contextValue: TournamentContextType = {
    state,
    dispatch,
    addTeam,
    removeTeam,
    setMaxOvers,
    setMaxWickets,
    setAlgorithm,
    generateMatches,
    resetTournament,
    validateTeams,
    getStats,
    getTeamStandings,
    simulateMatchResult,
    generateSampleResults,
  };

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
}

// Custom hook to use the context
export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}

// Export context for testing purposes
export { TournamentContext };

// Re-export types and utilities for easy access
export type {
  TournamentState,
  TournamentType,
  Match,
  CricketTeamStats,
  CricketMatchResult,
} from "./types";
export { logTournamentState } from "./state";
export { formatNRR } from "./algorithms/cricket-stats";
