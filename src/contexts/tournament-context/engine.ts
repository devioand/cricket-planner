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
  CricketMatchResult,
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

  // Idempotent: never re-process an already-completed match (would otherwise
  // double-count team stats if the action is triggered twice).
  if (match.status === "completed") return noop;

  const { team1Innings, team2Innings } = match.result;
  if (!team1Innings || !team2Innings) return noop;

  // Who batted first — decided by the toss, falling back to team1 when unset
  // (e.g. dev sample results). The team batting first wins by runs; the chasing
  // team wins by wickets in hand.
  const team1BatsFirst = match.toss
    ? match.toss.decision === "bat"
      ? match.toss.tossWinner === match.team1
      : match.toss.tossWinner !== match.team1
    : true;
  const firstTeam = team1BatsFirst ? match.team1 : match.team2;
  const secondTeam = team1BatsFirst ? match.team2 : match.team1;
  const firstInnings = team1BatsFirst ? team1Innings : team2Innings;
  const secondInnings = team1BatsFirst ? team2Innings : team1Innings;
  const maxWickets = match.maxWickets || 10;

  let winner: string;
  let loser: string;
  let marginType: "runs" | "wickets";
  let margin: number;
  let isDraw = false;

  if (firstInnings.runs === secondInnings.runs) {
    isDraw = true;
    winner = "";
    loser = "";
    marginType = "runs";
    margin = 0;
  } else if (firstInnings.runs > secondInnings.runs) {
    winner = firstTeam;
    loser = secondTeam;
    marginType = "runs";
    margin = firstInnings.runs - secondInnings.runs;
  } else {
    winner = secondTeam;
    loser = firstTeam;
    marginType = "wickets";
    margin = maxWickets - secondInnings.wickets;
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

/**
 * Finish a match that wasn't played as a **no result** (abandoned / both teams
 * skipped). Both teams get 1 point, no runs/NRR impact. Group-stage only — a
 * playoff needs a winner to advance, so this is a no-op for playoff matches.
 */
export function completeMatchAsNoResult(
  state: TournamentState,
  matchId: string,
): CompleteMatchResult {
  const noop: CompleteMatchResult = {
    state,
    complete: false,
    winner: getTournamentWinner(state),
  };

  const match = state.matches.find((m) => m.id === matchId);
  if (!match || match.status === "completed" || match.isPlayoff) return noop;

  const result: CricketMatchResult = {
    winner: "",
    loser: "",
    isNoResult: true,
    isDraw: false,
    team1Innings: match.result?.team1Innings ?? null,
    team2Innings: match.result?.team2Innings ?? null,
    marginType: "runs",
    margin: 0,
    matchType: "no-result",
  };

  const updatedMatches = state.matches.map((m) =>
    m.id === matchId ? { ...m, status: "completed" as const, result } : m,
  );

  const updatedTeamStats: Record<string, CricketTeamStats> = {
    ...state.teamStats,
  };
  updatedTeamStats[match.team1] = updateTeamStatsAfterMatch(
    updatedTeamStats[match.team1],
    match,
    result,
  );
  updatedTeamStats[match.team2] = updateTeamStatsAfterMatch(
    updatedTeamStats[match.team2],
    match,
    result,
  );

  // Seed playoffs if this was the last group-stage match.
  let matchesToSet = updatedMatches;
  const stateForCheck = {
    ...state,
    matches: updatedMatches,
    teamStats: updatedTeamStats,
  };
  if (isRoundRobinComplete(stateForCheck)) {
    const standings = getTournamentStandings(updatedTeamStats);
    const standingsUpdate = updateInitialPlayoffTeamsFromStandings(
      stateForCheck,
      standings,
    );
    if (standingsUpdate.success) {
      matchesToSet = standingsUpdate.updatedMatches;
    }
  }

  const newState: TournamentState = {
    ...state,
    matches: matchesToSet,
    teamStats: updatedTeamStats,
  };

  const finalWinner = getTournamentWinner(newState);
  return {
    state: newState,
    nextMatchId: matchesToSet.find((m) => m.status === "scheduled")?.id,
    complete: finalWinner !== null,
    winner: finalWinner,
  };
}

/**
 * Set both innings of a match at once (keeps status "in-progress"). Used by the
 * dev sample-results helper and by tests.
 */
export function simulateMatchResult(
  state: TournamentState,
  matchId: string,
  team1Score: { runs: number; wickets: number; overs: number },
  team2Score: { runs: number; wickets: number; overs: number },
): TournamentState {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return state;

  const matchResult = createSampleMatchResult(
    match.team1,
    match.team2,
    team1Score.runs,
    team1Score.wickets,
    team1Score.overs,
    team2Score.runs,
    team2Score.wickets,
    team2Score.overs,
    match.overs,
  );

  return {
    ...state,
    matches: state.matches.map((m) =>
      m.id === matchId
        ? { ...m, status: "in-progress" as const, result: matchResult }
        : m,
    ),
  };
}

/** Dev-only: fill scheduled, non-TBD matches with random in-progress scores. */
export function generateSampleResults(state: TournamentState): TournamentState {
  let next = state;
  const scheduled = state.matches.filter(
    (m) => m.status === "scheduled" && m.team1 !== "TBD" && m.team2 !== "TBD",
  );

  for (const match of scheduled) {
    const team1Runs = Math.floor(Math.random() * 100) + 100;
    const team1Wickets = Math.floor(Math.random() * 10) + 1;
    const team1Overs = match.overs - Math.random() * 10;
    const difference = Math.floor(Math.random() * 40) - 20;
    const team2Runs = Math.max(50, team1Runs + difference);
    const team2Wickets = Math.floor(Math.random() * 10) + 1;
    const team2Overs = match.overs - Math.random() * 15;

    next = simulateMatchResult(
      next,
      match.id,
      { runs: team1Runs, wickets: team1Wickets, overs: team1Overs },
      { runs: team2Runs, wickets: team2Wickets, overs: team2Overs },
    );
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
