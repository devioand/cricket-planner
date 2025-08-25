"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
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
  generateWorldCupPlayoffMatches,
  canGeneratePlayoffs,
  getPlayoffStatus,
  isRoundRobinComplete,
} from "./algorithms/playoffs";
import {
  generateLeaguePlayoffMatches,
  getLeaguePlayoffStatus,
} from "./algorithms/playoffs-league";
import {
  updateTeamStatsAfterMatch,
  getTournamentStandings,
  createSampleMatchResult,
} from "./algorithms/cricket-stats";
import {
  updateLeaguePlayoffTeams,
  updateWorldCupPlayoffTeams,
  hasResolvableTBDTeams,
} from "./algorithms/update-playoff-teams";
import {
  saveTournamentState,
  loadTournamentState,
  clearTournamentState,
} from "./utils/localStorage";

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
  // Playoff methods
  setPlayoffFormat: (format: import("./types").PlayoffFormat) => void;
  generatePlayoffs: () => { success: boolean; errors?: string[] };
  generateFinals: () => { success: boolean; errors?: string[] };
  canGeneratePlayoffs: () => { canGenerate: boolean; reasons: string[] };
  canGenerateFinals: () => { canGenerate: boolean; reasons: string[] };
  // Persistence methods
  clearAllData: () => void;
  // Tournament completion
  getTournamentWinner: () => string | null;
  isTournamentComplete: () => boolean;
  getPlayoffStatus: () => {
    phase:
      | "not-started"
      | "semi-finals"
      | "finals"
      | "completed"
      | "qualification"
      | "qualifier-2"
      | "final-ready";
    description: string;
    nextAction?: string;
  };
  isRoundRobinComplete: () => boolean;
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
    initialTournamentState,
    loadTournamentState // Load from localStorage on initialization
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveTournamentState(state);
  }, [state]);

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

  const clearAllData = (): void => {
    clearTournamentState();
    dispatch({ type: "RESET_TOURNAMENT" });
    console.log("🗑️ All tournament data cleared");
  };

  const getTournamentWinner = (): string | null => {
    // Check if there's a completed final match
    const finalMatch = state.matches.find(
      (match) =>
        match.isPlayoff &&
        match.playoffType === "final" &&
        match.status === "completed"
    );

    return finalMatch?.result?.winner || null;
  };

  const isTournamentComplete = (): boolean => {
    return getTournamentWinner() !== null;
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

    // Auto-update playoff teams if this was a playoff match
    if (match.isPlayoff) {
      console.log("🔄 Checking for playoff team updates...");
      const playoffUpdate =
        state.playoffFormat === "league"
          ? updateLeaguePlayoffTeams({
              ...state,
              matches: updatedMatches,
              teamStats: updatedTeamStats,
            })
          : updateWorldCupPlayoffTeams({
              ...state,
              matches: updatedMatches,
              teamStats: updatedTeamStats,
            });

      if (playoffUpdate.success) {
        console.log("📋 Playoff team updates:", playoffUpdate.updates);
        dispatch({
          type: "SET_MATCHES",
          payload: playoffUpdate.updatedMatches,
        });
      }
    }
  };

  const generateSampleResults = () => {
    console.log("🎲 Generating sample match results...");

    const scheduledMatches = state.matches.filter(
      (m) => m.status === "scheduled" && m.team1 !== "TBD" && m.team2 !== "TBD"
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

  // Playoff methods
  const setPlayoffFormat = (format: import("./types").PlayoffFormat) => {
    dispatch({ type: "SET_PLAYOFF_FORMAT", payload: format });
  };

  const generatePlayoffs = () => {
    console.log("🏆 Generating playoff matches...");

    const result =
      state.playoffFormat === "world-cup"
        ? generateWorldCupPlayoffMatches(state)
        : generateLeaguePlayoffMatches(state);

    if (result.success) {
      // Update state with playoff matches and qualified teams
      dispatch({ type: "SET_QUALIFIED_TEAMS", payload: result.qualifiedTeams });
      dispatch({ type: "SET_PLAYOFF_MATCHES", payload: result.playoffMatches });
      dispatch({ type: "SET_PHASE", payload: "playoffs" });

      // Add playoff matches to main matches array
      const updatedMatches = [...state.matches, ...result.playoffMatches];
      dispatch({ type: "SET_MATCHES", payload: updatedMatches });

      console.log("✅ Playoffs generated successfully!");
    } else {
      console.error("❌ Failed to generate playoffs:", result.errors);
    }

    return { success: result.success, errors: result.errors };
  };

  const generateFinals = () => {
    console.log("🏆 Updating final teams...");

    // For both formats, all matches are already generated, just need to update teams
    if (hasResolvableTBDTeams(state)) {
      const playoffUpdate =
        state.playoffFormat === "league"
          ? updateLeaguePlayoffTeams(state)
          : updateWorldCupPlayoffTeams(state);

      if (playoffUpdate.success) {
        console.log("📋 Playoff team updates:", playoffUpdate.updates);
        dispatch({
          type: "SET_MATCHES",
          payload: playoffUpdate.updatedMatches,
        });
        return { success: true };
      }
    }
    return {
      success: false,
      errors: ["No playoff teams can be resolved yet"],
    };
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
    setPlayoffFormat,
    generatePlayoffs,
    generateFinals,
    canGeneratePlayoffs: () => canGeneratePlayoffs(state),
    canGenerateFinals: () => ({
      canGenerate: hasResolvableTBDTeams(state),
      reasons: hasResolvableTBDTeams(state)
        ? []
        : ["No playoff teams can be resolved yet"],
    }),
    getPlayoffStatus: () =>
      state.playoffFormat === "world-cup"
        ? getPlayoffStatus(state)
        : getLeaguePlayoffStatus(state),
    isRoundRobinComplete: () => isRoundRobinComplete(state),
    clearAllData,
    getTournamentWinner,
    isTournamentComplete,
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
  TournamentPhase,
  PlayoffFormat,
  PlayoffType,
  Match,
  CricketTeamStats,
  CricketMatchResult,
} from "./types";
export { logTournamentState } from "./state";
export { formatNRR } from "./algorithms/cricket-stats";
