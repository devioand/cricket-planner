"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { mutateTournament } from "@/lib/repositories/tournament-repository";
import * as engine from "@/contexts/tournament-context/engine";
import type {
  TossDecision,
  PlayoffFormat,
  TournamentState,
} from "@/contexts/tournament-context/types";

/** Revalidate the whole tournament subtree (setup + matches + standings). */
function revalidateTournament(id: string) {
  revalidatePath(`/tournament/round-robin/${id}`, "layout");
}

export async function startMatchAction(id: string, matchId: string) {
  const user = await requireUser();
  await mutateTournament(user.id, id, (state) => ({
    state: engine.startMatch(state, matchId),
  }));
  revalidateTournament(id);
}

export async function setTossAction(
  id: string,
  matchId: string,
  tossWinner: string,
  decision: TossDecision
) {
  const user = await requireUser();
  await mutateTournament(user.id, id, (state) => ({
    state: engine.setMatchToss(state, matchId, tossWinner, decision),
  }));
  revalidateTournament(id);
}

export async function updateInningsAction(
  id: string,
  matchId: string,
  isTeam1: boolean,
  score: { runs: number; wickets: number; overs: number }
) {
  const user = await requireUser();
  await mutateTournament(user.id, id, (state) => ({
    state: engine.updateSingleInnings(state, matchId, isTeam1, score),
  }));
  revalidateTournament(id);
}

export async function startSecondInningsAction(id: string, matchId: string) {
  const user = await requireUser();
  await mutateTournament(user.id, id, (state) => ({
    state: engine.startSecondInnings(state, matchId),
  }));
  revalidateTournament(id);
}

export async function finishMatchAction(id: string, matchId: string) {
  const user = await requireUser();
  const result = await mutateTournament(user.id, id, (state) => {
    const r = engine.completeMatch(state, matchId);
    return {
      state: r.state,
      result: {
        complete: r.complete,
        winner: r.winner,
        nextMatchId: r.nextMatchId ?? null,
      },
    };
  });
  revalidateTournament(id);
  return result ?? { complete: false, winner: null, nextMatchId: null };
}

/**
 * Set up + generate a tournament atomically: replaces teams, applies settings,
 * and generates the match schedule in one transaction. Returns the outcome so
 * the client can route to the matches page on success.
 */
export async function generateMatchesAction(
  id: string,
  setup: {
    teams: string[];
    maxOvers: number;
    maxWickets: number;
    playoffFormat: PlayoffFormat;
  }
) {
  const user = await requireUser();
  const result = await mutateTournament(user.id, id, (state) => {
    let next: TournamentState = {
      ...state,
      teams: [],
      teamStats: {},
      matches: [],
      isGenerated: false,
    };
    for (const team of setup.teams) next = engine.addTeam(next, team);
    next = engine.setMaxOvers(next, setup.maxOvers);
    next = engine.setMaxWickets(next, setup.maxWickets);
    next = engine.setPlayoffFormat(next, setup.playoffFormat);
    const gen = engine.generateMatches(next);
    return {
      state: gen.state,
      result: { success: gen.success, errors: gen.errors },
    };
  });
  revalidateTournament(id);
  return result ?? { success: false, errors: ["Unknown error"] };
}

/** Dev-only: fill scheduled non-TBD matches with random in-progress scores. */
export async function generateSampleResultsAction(id: string) {
  const user = await requireUser();
  await mutateTournament(user.id, id, (state) => ({
    state: engine.generateSampleResults(state),
  }));
  revalidateTournament(id);
}
