// Tournament State Management for Context API

import {
  TournamentState,
  Match,
  CricketTeamStats,
  TournamentPhase,
  PlayoffFormat,
} from "./types";
import { initializeTeamStats } from "./algorithms/cricket-stats";

// Initial state
export const initialTournamentState: TournamentState = {
  algorithm: "round-robin",
  teams: [],
  maxOvers: 20, // T20 format by default
  maxWickets: 10,
  matches: [],
  isGenerated: false,
  teamStats: {},
  phase: "setup",
  playoffFormat: "world-cup", // Default to world cup style
  qualifiedTeams: [],
  playoffMatches: [],
};

// State actions
export type TournamentAction =
  | { type: "SET_ALGORITHM"; payload: TournamentState["algorithm"] }
  | { type: "ADD_TEAM"; payload: string }
  | { type: "REMOVE_TEAM"; payload: string }
  | { type: "SET_TEAMS"; payload: string[] }
  | { type: "SET_MAX_OVERS"; payload: number }
  | { type: "SET_MAX_WICKETS"; payload: number }
  | { type: "SET_MATCHES"; payload: Match[] }
  | { type: "SET_GENERATED"; payload: boolean }
  | { type: "UPDATE_TEAM_STATS"; payload: Record<string, CricketTeamStats> }
  | { type: "INITIALIZE_TEAM_STATS"; payload: string[] }
  | { type: "RESET_TOURNAMENT" }
  | { type: "SET_PHASE"; payload: TournamentPhase }
  | { type: "SET_PLAYOFF_FORMAT"; payload: PlayoffFormat }
  | { type: "SET_QUALIFIED_TEAMS"; payload: string[] }
  | { type: "SET_PLAYOFF_MATCHES"; payload: Match[] }
  | { type: "ADD_PLAYOFF_MATCH"; payload: Match };

// State reducer
export function tournamentReducer(
  state: TournamentState,
  action: TournamentAction
): TournamentState {
  switch (action.type) {
    case "SET_ALGORITHM":
      console.log(`🏆 Tournament algorithm changed to: ${action.payload}`);
      return {
        ...state,
        algorithm: action.payload,
        matches: [], // Clear matches when algorithm changes
        isGenerated: false,
      };

    case "ADD_TEAM":
      if (state.teams.includes(action.payload)) {
        console.log(`⚠️ Team "${action.payload}" already exists`);
        return state;
      }
      console.log(`✅ Team "${action.payload}" added`);

      // Initialize stats for new team
      const newTeamStats = { ...state.teamStats };
      newTeamStats[action.payload] = initializeTeamStats(action.payload);

      return {
        ...state,
        teams: [...state.teams, action.payload],
        teamStats: newTeamStats,
        matches: [], // Clear matches when teams change
        isGenerated: false,
      };

    case "REMOVE_TEAM":
      console.log(`🗑️ Team "${action.payload}" removed`);

      // Remove team stats
      const updatedTeamStats = { ...state.teamStats };
      delete updatedTeamStats[action.payload];

      return {
        ...state,
        teams: state.teams.filter((team) => team !== action.payload),
        teamStats: updatedTeamStats,
        matches: [], // Clear matches when teams change
        isGenerated: false,
      };

    case "SET_TEAMS":
      console.log(`👥 Teams updated:`, action.payload);

      // Initialize stats for all teams
      const teamStats: Record<string, CricketTeamStats> = {};
      action.payload.forEach((teamName) => {
        teamStats[teamName] = initializeTeamStats(teamName);
      });

      return {
        ...state,
        teams: action.payload,
        teamStats,
        matches: [], // Clear matches when teams change
        isGenerated: false,
      };

    case "SET_MAX_OVERS":
      console.log(`🏏 Max overs set to: ${action.payload}`);
      return {
        ...state,
        maxOvers: action.payload,
      };

    case "SET_MAX_WICKETS":
      console.log(`🎯 Max wickets set to: ${action.payload}`);
      return {
        ...state,
        maxWickets: action.payload,
      };

    case "SET_MATCHES":
      console.log(`📅 Matches generated:`, action.payload.length, "matches");
      return {
        ...state,
        matches: action.payload,
        isGenerated: true,
        phase: action.payload.length > 0 ? "round-robin" : "setup",
      };

    case "SET_GENERATED":
      return {
        ...state,
        isGenerated: action.payload,
      };

    case "UPDATE_TEAM_STATS":
      console.log("📊 Team stats updated");
      return {
        ...state,
        teamStats: action.payload,
      };

    case "INITIALIZE_TEAM_STATS":
      console.log("🏏 Initializing team stats for:", action.payload);
      const initializedStats: Record<string, CricketTeamStats> = {};
      action.payload.forEach((teamName) => {
        initializedStats[teamName] = initializeTeamStats(teamName);
      });
      return {
        ...state,
        teamStats: initializedStats,
      };

    case "RESET_TOURNAMENT":
      console.log("🔄 Tournament reset");
      return initialTournamentState;

    case "SET_PHASE":
      console.log(`🏆 Tournament phase changed to: ${action.payload}`);
      return { ...state, phase: action.payload };

    case "SET_PLAYOFF_FORMAT":
      console.log(`🏏 Playoff format set to: ${action.payload}`);
      return { ...state, playoffFormat: action.payload };

    case "SET_QUALIFIED_TEAMS":
      console.log("🎯 Qualified teams set:", action.payload);
      return { ...state, qualifiedTeams: action.payload };

    case "SET_PLAYOFF_MATCHES":
      console.log("🏏 Playoff matches set:", action.payload.length, "matches");
      return { ...state, playoffMatches: action.payload };

    case "ADD_PLAYOFF_MATCH":
      console.log("➕ Playoff match added:", action.payload.id);
      return {
        ...state,
        playoffMatches: [...state.playoffMatches, action.payload],
        matches: [...state.matches, action.payload],
      };

    default:
      return state;
  }
}

// Helper functions for logging
export const logTournamentState = (state: TournamentState) => {
  console.log("📊 Current Tournament State:");
  console.log("  Algorithm:", state.algorithm);
  console.log("  Teams:", state.teams);
  console.log("  Max Overs:", state.maxOvers);
  console.log("  Max Wickets:", state.maxWickets);
  console.log("  Matches:", state.matches.length);
  console.log("  Generated:", state.isGenerated);
};
