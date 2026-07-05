"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { saveTournamentState } from "@/lib/repositories/tournament-repository";
import type { TournamentState } from "@/contexts/tournament-context/types";

/**
 * Local-first play persists to localStorage on every action; these are the only
 * two writes that reach Postgres, both driven explicitly by the user.
 */

/**
 * Sync: persist the full local state to the DB. The caller KEEPS its
 * localStorage — the tournament is still in progress. Returns the new
 * `updated_at` so the client can record when it last synced.
 */
export async function syncTournamentAction(id: string, state: TournamentState) {
  const user = await requireUser();
  const updatedAt = await saveTournamentState(user.id, id, state);
  // The tournaments list summarizes status/winner — keep it fresh.
  revalidatePath("/tournaments");
  return { updatedAt };
}

/**
 * Finish & save: persist the final state (the repository derives status
 * `completed` from the played final), after which the client clears its
 * localStorage and refreshes into the read-only DB view.
 */
export async function finishTournamentAction(
  id: string,
  state: TournamentState,
) {
  const user = await requireUser();
  const updatedAt = await saveTournamentState(user.id, id, state);
  revalidatePath("/tournaments");
  revalidatePath(`/tournament/round-robin/${id}`, "layout");
  return { updatedAt };
}
