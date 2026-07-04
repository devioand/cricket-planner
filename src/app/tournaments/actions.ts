"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import {
  createTournament,
  deleteTournament,
  type CreateTournamentInput,
} from "@/lib/repositories/tournament-repository";

/** Create an empty tournament and return its id (client then routes to setup). */
export async function createTournamentAction(input: CreateTournamentInput) {
  const user = await requireUser();
  const id = await createTournament(user.id, input);
  revalidatePath("/tournaments");
  return { id };
}

/** Delete a tournament the user owns. */
export async function deleteTournamentAction(id: string) {
  const user = await requireUser();
  await deleteTournament(user.id, id);
  revalidatePath("/tournaments");
  return { ok: true as const };
}
