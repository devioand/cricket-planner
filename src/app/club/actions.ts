"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import * as repo from "@/lib/repositories/club-repository";
import { ACTIVE_CLUB_COOKIE } from "@/lib/clubs/active-club";

const YEAR = 60 * 60 * 24 * 365;

async function setActiveCookie(id: string) {
  (await cookies()).set(ACTIVE_CLUB_COOKIE, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: YEAR,
  });
}

export async function createClubAction(name: string) {
  const user = await requireUser();
  const id = await repo.createClub(user.id, name);
  await setActiveCookie(id);
  revalidatePath("/club");
  revalidatePath("/");
  return { id };
}

export async function renameClubAction(id: string, name: string) {
  const user = await requireUser();
  await repo.renameClub(user.id, id, name);
  revalidatePath("/club");
  return { ok: true as const };
}

export async function deleteClubAction(id: string) {
  const user = await requireUser();
  await repo.deleteClub(user.id, id);
  const jar = await cookies();
  if (jar.get(ACTIVE_CLUB_COOKIE)?.value === id) jar.delete(ACTIVE_CLUB_COOKIE);
  revalidatePath("/club");
  revalidatePath("/");
  return { ok: true as const };
}

export async function setActiveClubAction(id: string) {
  const user = await requireUser();
  await repo.touchClub(user.id, id);
  await setActiveCookie(id);
  revalidatePath("/club");
  revalidatePath("/tournaments/new");
  revalidatePath("/");
  return { ok: true as const };
}

export async function addPlayerAction(clubId: string, name: string) {
  const user = await requireUser();
  const res = await repo.addPlayer(user.id, clubId, name);
  // Only /club — NOT /tournaments/new, so adding a player mid-wizard doesn't
  // re-render the page under the flow. (/tournaments/new is force-dynamic anyway.)
  revalidatePath("/club");
  return res;
}

export async function renamePlayerAction(playerId: string, name: string) {
  const user = await requireUser();
  const res = await repo.renamePlayer(user.id, playerId, name);
  revalidatePath("/club");
  return res;
}

export async function removePlayerAction(playerId: string) {
  const user = await requireUser();
  await repo.removePlayer(user.id, playerId);
  revalidatePath("/club");
  return { ok: true as const };
}

/** Bulk add — used to import a device's saved players into the DB club. */
export async function importPlayersAction(clubId: string, names: string[]) {
  const user = await requireUser();
  let added = 0;
  for (const name of names) {
    const r = await repo.addPlayer(user.id, clubId, name);
    if (r.ok) added += 1;
  }
  revalidatePath("/club");
  revalidatePath("/tournaments/new");
  return { added };
}

/** Called after a tournament is created, to stamp who turned out. */
export async function markPlayedAction(clubId: string, names: string[]) {
  const user = await requireUser();
  await repo.markPlayed(user.id, clubId, names);
  return { ok: true as const };
}
