// Pure tournament state engine.
//
// These are framework-free transitions on `TournamentState` — the exact logic
// that used to live inside the React context, extracted so it can run inside
// server actions (and be unit-tested directly). No React, no browser APIs.

import type {
  TournamentState,
  Match,
  InningsScore,
  CricketTeamStats,
  PlayoffFormat,
  TossDecision,
} from "./types";
import {
  initializeTeamStats,
  updateTeamStatsAfterMatch,
  getTournamentStandings,
  oversToBalls,
  calculateRunRate,
  createSampleMatchResult,
} from "./algorithms/cricket-stats";
import {
  generateRoundRobinMatches,
  validateRoundRobinTeams,
} from "./algorithms/round-robin";
import {
  generateWorldCupPlayoffMatchesWithTBD,
  isRoundRobinComplete,
} from "./algorithms/playoffs";
import { generateLeaguePlayoffMatchesWithTBD } from "./algorithms/playoffs-league";
import {
  updateLeaguePlayoffTeams,
  updateWorldCupPlayoffTeams,
  updateInitialPlayoffTeamsFromStandings,
} from "./algorithms/update-playoff-teams";

export const initialState: TournamentState = {
  algorithm: "round-robin",
  teams: [],
  maxOvers: 20,
  maxWickets: 10,
  matches: [],
  isGenerated: false,
  teamStats: {},
  phase: "setup",
  playoffFormat: "world-cup",
};

// ── Internal helpers (mirror the old reducer) ────────────────────────────────

function setMatches(state: TournamentState, matches: Match[]): TournamentState {
  return {
    ...state,
    matches,
    isGenerated: true,
    phase: matches.length > 0 ? "round-robin" : "setup",
  };
}

// ── Team + settings ──────────────────────────────────────────────────────────

export function addTeam(
  state: TournamentState,
  teamName: string,
): TournamentState {
  const name = teamName.trim();
  if (!name || state.teams.includes(name)) return state;

  return {
    ...state,
    teams: [...state.teams, name],
    teamStats: { ...state.teamStats, [name]: initializeTeamStats(name) },
    matches: [],
    isGenerated: false,
  };
}

export function removeTeam(
  state: TournamentState,
  teamName: string,
): TournamentState {
  if (!state.teams.includes(teamName)) return state;
  const teamStats = { ...state.teamStats };
  delete teamStats[teamName];

  return {
    ...state,
    teams: state.teams.filter((t) => t !== teamName),
    teamStats,
    matches: [],
    isGenerated: false,
  };
}

export function setMaxOvers(
  state: TournamentState,
  overs: number,
): TournamentState {
  if (overs < 1 || overs > 50) return state;
  return { ...state, maxOvers: overs };
}

export function setMaxWickets(
  state: TournamentState,
  wickets: number,
): TournamentState {
  if (wickets < 1 || wickets > 11) return state;
  return { ...state, maxWickets: wickets };
}

export function setPlayoffFormat(
  state: TournamentState,
  format: PlayoffFormat,
): TournamentState {
  return { ...state, playoffFormat: format };
}

// ── Match generation ─────────────────────────────────────────────────────────

export function generateMatches(state: TournamentState): {
  state: TournamentState;
  success: boolean;
  errors?: string[];
} {
  const validation = validateRoundRobinTeams(state.teams);
  if (!validation.valid) {
    return { state, success: false, errors: validation.errors };
  }

  try {
    switch (state.algorithm) {
      case "round-robin": {
        // Special case: with exactly 2 teams there is no group stage — a
        // single final between the two teams decides the champion.
        if (state.teams.length === 2) {
          const finalMatch: Match = {
            id: "F-001",
            team1: state.teams[0],
            team2: state.teams[1],
            round: 1,
            status: "scheduled",
            overs: state.maxOvers,
            maxWickets: state.maxWickets,
            isPlayoff: true,
            playoffType: "final",
            phase: "playoffs",
          };
          return { state: setMatches(state, [finalMatch]), success: true };
        }

        const roundRobinResult = generateRoundRobinMatches({
          teams: state.teams,
          maxOvers: state.maxOvers,
          maxWickets: state.maxWickets,
        });
        let allMatches: Match[] = [...roundRobinResult.matches];

        const playoffResult =
          state.playoffFormat === "world-cup"
            ? generateWorldCupPlayoffMatchesWithTBD(state)
            : generateLeaguePlayoffMatchesWithTBD(state);

        if (playoffResult.success) {
          allMatches = [...allMatches, ...playoffResult.playoffMatches];
        }

        return { state: setMatches(state, allMatches), success: true };
      }
      case "single-elimination":
      case "double-elimination":
      case "triple-elimination":
        return {
          state,
          success: false,
          errors: [`${state.algorithm} algorithm not yet implemented`],
        };
      default:
        return {
          state,
          success: false,
          errors: ["Unknown algorithm selected"],
        };
    }
  } catch {
    return {
      state,
      success: false,
      errors: ["Failed to generate matches. Please try again."],
    };
  }
}

// ── Match play ───────────────────────────────────────────────────────────────

export function startMatch(
  state: TournamentState,
  matchId: string,
): TournamentState {
  return {
    ...state,
    matches: state.matches.map((m) =>
      m.id === matchId ? { ...m, status: "in-progress" as const } : m,
    ),
  };
}

export function startSecondInnings(
  state: TournamentState,
  matchId: string,
): TournamentState {
  return {
    ...state,
    matches: state.matches.map((m) =>
      m.id === matchId ? { ...m, secondInningsStarted: true } : m,
    ),
  };
}

export function setMatchToss(
  state: TournamentState,
  matchId: string,
  tossWinner: string,
  decision: TossDecision,
): TournamentState {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return state;

  const tossLoser = match.team1 === tossWinner ? match.team2 : match.team1;
  const toss = { tossWinner, decision, tossLoser };

  return {
    ...state,
    matches: state.matches.map((m) => (m.id === matchId ? { ...m, toss } : m)),
  };
}

export function updateSingleInnings(
  state: TournamentState,
  matchId: string,
  isTeam1: boolean,
  score: { runs: number; wickets: number; overs: number },
): TournamentState {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return state;

  const innings: InningsScore = {
    teamName: isTeam1 ? match.team1 : match.team2,
    runs: score.runs,
    wickets: score.wickets,
    overs: score.overs,
    ballsFaced: oversToBalls(score.overs),
    isAllOut: score.wickets >= 10,
    runRate: calculateRunRate(score.runs, score.overs),
  };

  const matches = state.matches.map((m) => {
    if (m.id !== matchId) return m;
    const existingResult = m.result || {
      winner: "",
      loser: "",
      team1Innings: null as InningsScore | null,
      team2Innings: null as InningsScore | null,
      marginType: "runs" as const,
      margin: 0,
      matchType: "completed" as const,
    };
    return isTeam1
      ? { ...m, result: { ...existingResult, team1Innings: innings } }
      : { ...m, result: { ...existingResult, team2Innings: innings } };
  });

  return { ...state, matches };
}

export interface CompleteMatchResult {
  state: TournamentState;
  nextMatchId?: string;
  complete: boolean;
  winner: string | null;
}

export function completeMatch(
  state: TournamentState,
  matchId: string,
): CompleteMatchResult {
  const noop: CompleteMatchResult = {
    state,
    complete: false,
    winner: getTournamentWinner(state),
  };

  const match = state.matches.find((m) => m.id === matchId);
  if (!match || !match.result) return noop;

  const { team1Innings, team2Innings } = match.result;
  if (!team1Innings || !team2Innings) return noop;

  let winner: string;
  let loser: string;
  let marginType: "runs" | "wickets";
  let margin: number;
  let isDraw = false;

  if (team1Innings.runs === team2Innings.runs) {
    isDraw = true;
    winner = "";
    loser = "";
    marginType = "runs";
    margin = 0;
  } else if (team1Innings.runs > team2Innings.runs) {
    winner = match.team1;
    loser = match.team2;
    marginType = "runs";
    margin = team1Innings.runs - team2Innings.runs;
  } else {
    winner = match.team2;
    loser = match.team1;
    marginType = "wickets";
    margin = 10 - team2Innings.wickets;
  }

  const completedResult = {
    ...match.result,
    winner,
    loser,
    marginType,
    margin,
    isDraw,
    matchType: "completed" as const,
  };

  const finalUpdatedMatches = state.matches.map((m) =>
    m.id === matchId
      ? { ...m, status: "completed" as const, result: completedResult }
      : m,
  );

  const finalUpdatedTeamStats: Record<string, CricketTeamStats> = {
    ...state.teamStats,
  };
  finalUpdatedTeamStats[match.team1] = updateTeamStatsAfterMatch(
    finalUpdatedTeamStats[match.team1],
    match,
    completedResult,
  );
  finalUpdatedTeamStats[match.team2] = updateTeamStatsAfterMatch(
    finalUpdatedTeamStats[match.team2],
    match,
    completedResult,
  );

  const playoffUpdate =
    state.playoffFormat === "league"
      ? updateLeaguePlayoffTeams({
          ...state,
          matches: finalUpdatedMatches,
          teamStats: finalUpdatedTeamStats,
        })
      : updateWorldCupPlayoffTeams({
          ...state,
          matches: finalUpdatedMatches,
          teamStats: finalUpdatedTeamStats,
        });

  let matchesToSet = playoffUpdate.success
    ? playoffUpdate.updatedMatches
    : finalUpdatedMatches;

  const updatedStateForStandingCheck = {
    ...state,
    matches: matchesToSet,
    teamStats: finalUpdatedTeamStats,
  };

  if (isRoundRobinComplete(updatedStateForStandingCheck)) {
    const standings = getTournamentStandings(finalUpdatedTeamStats);
    const standingsUpdate = updateInitialPlayoffTeamsFromStandings(
      updatedStateForStandingCheck,
      standings,
    );
    if (standingsUpdate.success) {
      matchesToSet = standingsUpdate.updatedMatches;
    }
  }

  const newState: TournamentState = {
    ...state,
    matches: matchesToSet,
    teamStats: finalUpdatedTeamStats,
  };

  const nextMatchId = matchesToSet.find((m) => m.status === "scheduled")?.id;
  const finalWinner = getTournamentWinner(newState);

  return {
    state: newState,
    nextMatchId,
    complete: finalWinner !== null,
    winner: finalWinner,
  };
}

/** Dev-only: fill scheduled, non-TBD matches with random in-progress scores. */
export function generateSampleResults(state: TournamentState): TournamentState {
  let next = state;
  const scheduled = state.matches.filter(
    (m) => m.status === "scheduled" && m.team1 !== "TBD" && m.team2 !== "TBD",
  );

  for (let i = 0; i < scheduled.length; i++) {
    const match = scheduled[i];
    const team1Runs = Math.floor(Math.random() * 100) + 100;
    const team1Wickets = Math.floor(Math.random() * 10) + 1;
    const team1Overs = match.overs - Math.random() * 10;
    const difference = Math.floor(Math.random() * 40) - 20;
    const team2Runs = Math.max(50, team1Runs + difference);
    const team2Wickets = Math.floor(Math.random() * 10) + 1;
    const team2Overs = match.overs - Math.random() * 15;

    const matchResult = createSampleMatchResult(
      match.team1,
      match.team2,
      team1Runs,
      team1Wickets,
      team1Overs,
      team2Runs,
      team2Wickets,
      team2Overs,
      match.overs,
    );
    next = {
      ...next,
      matches: next.matches.map((m) =>
        m.id === match.id
          ? { ...m, status: "in-progress" as const, result: matchResult }
          : m,
      ),
    };
  }

  return next;
}

// ── Derived ──────────────────────────────────────────────────────────────────

export function getTournamentWinner(state: TournamentState): string | null {
  const finalMatch = state.matches.find(
    (m) => m.isPlayoff && m.playoffType === "final" && m.status === "completed",
  );
  return finalMatch?.result?.winner || null;
}

export function isTournamentComplete(state: TournamentState): boolean {
  return getTournamentWinner(state) !== null;
}

export function getStandings(state: TournamentState) {
  return getTournamentStandings(state.teamStats);
}
