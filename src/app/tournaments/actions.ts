"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { listClubs } from "@/lib/repositories/club-repository";
import {
  createTournament,
  deleteTournament,
  type CreateTournamentInput,
} from "@/lib/repositories/tournament-repository";

/** Create an empty tournament and return its id (client then routes to setup). */
export async function createTournamentAction(
  input: CreateTournamentInput,
  clubId?: string | null,
) {
  const user = await requireUser();
  // Only stamp a club the user actually owns — never trust the client id blindly.
  const clubs = await listClubs(user.id);
  const ownedClubId =
    clubId && clubs.some((c) => c.id === clubId) ? clubId : null;
  const id = await createTournament(user.id, input, ownedClubId);
  revalidatePath("/tournaments");
  revalidatePath("/");
  return { id };
}

/** Delete a tournament the user owns. */
export async function deleteTournamentAction(id: string) {
  const user = await requireUser();
  await deleteTournament(user.id, id);
  revalidatePath("/tournaments");
  return { ok: true as const };
}
