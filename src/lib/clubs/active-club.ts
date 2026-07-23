// Server-only helper: resolve the user's clubs + the "active" one. Which club is
// active is a per-user preference kept in a cookie; it falls back to the most
// recently updated club, so it always resolves to something sensible.

import { cookies } from "next/headers";
import { requireUser } from "@/lib/session";
import {
  listClubs,
  resolveActiveClub,
  type ClubSummary,
  type ClubWithPlayers,
} from "@/lib/repositories/club-repository";

export const ACTIVE_CLUB_COOKIE = "active_club";

export interface ActiveClubData {
  userId: string;
  active: ClubWithPlayers | null;
  clubs: ClubSummary[];
}

export async function getActiveClub(): Promise<ActiveClubData> {
  const user = await requireUser();
  const preferred = (await cookies()).get(ACTIVE_CLUB_COOKIE)?.value ?? null;
  const [active, clubs] = await Promise.all([
    resolveActiveClub(user.id, preferred),
    listClubs(user.id),
  ]);
  return { userId: user.id, active, clubs };
}
