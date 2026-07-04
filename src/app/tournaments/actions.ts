"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  createTournament,
  saveTournamentState,
  deleteTournament,
  type CreateTournamentInput,
} from "@/lib/repositories/tournament-repository";
import type { TournamentState } from "@/contexts/tournament-context/types";

/** Create an empty tournament and return its id (client then routes to setup). */
export async function createTournamentAction(input: CreateTournamentInput) {
  const user = await requireUser();
  const id = await createTournament(user.id, input);
  revalidatePath("/tournaments");
  return { id };
}

/** Persist the full tournament state (called on autosave). */
export async function saveTournamentStateAction(
  id: string,
  state: TournamentState
) {
  const user = await requireUser();
  await saveTournamentState(user.id, id, state);
  return { ok: true as const };
}

/** Delete a tournament the user owns. */
export async function deleteTournamentAction(id: string) {
  const user = await requireUser();
  await deleteTournament(user.id, id);
  revalidatePath("/tournaments");
  return { ok: true as const };
}
