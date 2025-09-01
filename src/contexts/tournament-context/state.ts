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
  phase: "setup", // Tournament phase tracking
  playoffFormat: "world-cup", // Default playoff format
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
  | { type: "HYDRATE_STATE"; payload: TournamentState };

// State reducer
export function tournamentReducer(
  state: TournamentState,
  action: TournamentAction
): TournamentState {
  switch (action.type) {
    case "SET_ALGORITHM":
      return {
        ...state,
        algorithm: action.payload,
        matches: [], // Clear matches when algorithm changes
        isGenerated: false,
      };

    case "ADD_TEAM":
      if (state.teams.includes(action.payload)) {
        return state;
      }

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
      return {
        ...state,
        maxOvers: action.payload,
      };

    case "SET_MAX_WICKETS":
      return {
        ...state,
        maxWickets: action.payload,
      };

    case "SET_MATCHES":
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
      return {
        ...state,
        teamStats: action.payload,
      };

    case "INITIALIZE_TEAM_STATS":
      const initializedStats: Record<string, CricketTeamStats> = {};
      action.payload.forEach((teamName) => {
        initializedStats[teamName] = initializeTeamStats(teamName);
      });
      return {
        ...state,
        teamStats: initializedStats,
      };

    case "RESET_TOURNAMENT":
      return initialTournamentState;

    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "SET_PLAYOFF_FORMAT":
      return { ...state, playoffFormat: action.payload };

    // Note: Removed SET_QUALIFIED_TEAMS, SET_PLAYOFF_MATCHES, ADD_PLAYOFF_MATCH
    // Playoff matches are now created directly in main matches array via generateMatches()

    case "HYDRATE_STATE":
      return action.payload;

    default:
      return state;
  }
}

// Helper functions for logging
export const logTournamentState = () => {
  // Logging removed for production
};
