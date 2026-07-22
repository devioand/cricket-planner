// Clubs + saved players, persisted per user account in Neon. Every function is
// scoped to a userId so a user can only ever touch their own clubs/players.

import { pool } from "@/lib/db";

export interface ClubPlayer {
  id: string;
  name: string;
  /** Set when a real account claims this player; null otherwise. */
  userId: string | null;
  lastPlayedAt: string | null;
  createdAt: string;
}

export interface ClubSummary {
  id: string;
  name: string;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClubWithPlayers extends ClubSummary {
  players: ClubPlayer[];
}

const iso = (v: unknown): string | null =>
  v == null ? null : new Date(v as string).toISOString();

/** All of a user's clubs, most-recently-updated first. */
export async function listClubs(userId: string): Promise<ClubSummary[]> {
  const { rows } = await pool.query(
    `select c.id, c.name, c.created_at, c.updated_at,
            (select count(*) from public.club_players p where p.club_id = c.id) as player_count
       from public.clubs c
      where c.user_id = $1
      order by c.updated_at desc`,
    [userId],
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    playerCount: Number(r.player_count),
    createdAt: iso(r.created_at) as string,
    updatedAt: iso(r.updated_at) as string,
  }));
}

/** A single club the user owns, with its players (recent players first). */
export async function getClubWithPlayers(
  userId: string,
  clubId: string,
): Promise<ClubWithPlayers | null> {
  const { rows } = await pool.query(
    `select id, name, created_at, updated_at from public.clubs
      where id = $1 and user_id = $2`,
    [clubId, userId],
  );
  if (rows.length === 0) return null;
  const c = rows[0];
  const { rows: pRows } = await pool.query(
    `select id, name, user_id, last_played_at, created_at
       from public.club_players
      where club_id = $1
      order by last_played_at desc nulls last, lower(name) asc`,
    [clubId],
  );
  return {
    id: String(c.id),
    name: String(c.name),
    playerCount: pRows.length,
    createdAt: iso(c.created_at) as string,
    updatedAt: iso(c.updated_at) as string,
    players: pRows.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      userId: p.user_id ? String(p.user_id) : null,
      lastPlayedAt: iso(p.last_played_at),
      createdAt: iso(p.created_at) as string,
    })),
  };
}

/**
 * The club to treat as "active": the preferred one if the user owns it, else
 * the most recently updated, else null (user has no clubs yet).
 */
export async function resolveActiveClub(
  userId: string,
  preferredId?: string | null,
): Promise<ClubWithPlayers | null> {
  if (preferredId) {
    const club = await getClubWithPlayers(userId, preferredId);
    if (club) return club;
  }
  const clubs = await listClubs(userId);
  if (clubs.length === 0) return null;
  return getClubWithPlayers(userId, clubs[0].id);
}

export async function createClub(userId: string, name: string): Promise<string> {
  const { rows } = await pool.query(
    `insert into public.clubs (user_id, name) values ($1, $2) returning id`,
    [userId, name.trim() || "My Club"],
  );
  return String(rows[0].id);
}

export async function renameClub(userId: string, id: string, name: string): Promise<void> {
  await pool.query(
    `update public.clubs set name = $1, updated_at = now() where id = $2 and user_id = $3`,
    [name.trim(), id, userId],
  );
}

export async function deleteClub(userId: string, id: string): Promise<void> {
  await pool.query(`delete from public.clubs where id = $1 and user_id = $2`, [id, userId]);
}

/** Bump updated_at so this club sorts first / becomes the default active one. */
export async function touchClub(userId: string, id: string): Promise<void> {
  await pool.query(
    `update public.clubs set updated_at = now() where id = $1 and user_id = $2`,
    [id, userId],
  );
}

type AddResult = { ok: true; id: string } | { ok: false; error: "duplicate" | "not_found" };

/** Add a player to a club the user owns. Names are unique per club. */
export async function addPlayer(
  userId: string,
  clubId: string,
  name: string,
): Promise<AddResult> {
  const owns = await pool.query(
    `select 1 from public.clubs where id = $1 and user_id = $2`,
    [clubId, userId],
  );
  if (owns.rowCount === 0) return { ok: false, error: "not_found" };
  try {
    const { rows } = await pool.query(
      `insert into public.club_players (club_id, name) values ($1, $2) returning id`,
      [clubId, name.trim()],
    );
    return { ok: true, id: String(rows[0].id) };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "duplicate" };
    throw e;
  }
}

export async function renamePlayer(
  userId: string,
  playerId: string,
  name: string,
): Promise<{ ok: boolean; error?: "duplicate" }> {
  try {
    const res = await pool.query(
      `update public.club_players p set name = $1
         from public.clubs c
        where p.id = $2 and p.club_id = c.id and c.user_id = $3`,
      [name.trim(), playerId, userId],
    );
    return { ok: (res.rowCount ?? 0) > 0 };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "duplicate" };
    throw e;
  }
}

export async function removePlayer(userId: string, playerId: string): Promise<void> {
  await pool.query(
    `delete from public.club_players p
       using public.clubs c
      where p.id = $1 and p.club_id = c.id and c.user_id = $2`,
    [playerId, userId],
  );
}

/** Stamp last_played_at on the club players whose names turned out. */
export async function markPlayed(
  userId: string,
  clubId: string,
  names: string[],
): Promise<void> {
  if (names.length === 0) return;
  await pool.query(
    `update public.club_players p set last_played_at = now()
       from public.clubs c
      where p.club_id = c.id and c.user_id = $1 and c.id = $2
        and lower(p.name) = any($3::text[])`,
    [userId, clubId, names.map((n) => n.trim().toLowerCase())],
  );
}
