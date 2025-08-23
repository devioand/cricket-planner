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
export type { TournamentState, TournamentType, Match } from "./types";
export { logTournamentState } from "./state";
