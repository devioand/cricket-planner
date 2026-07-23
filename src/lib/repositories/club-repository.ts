// Clubs + saved players, persisted per user account in Neon. Every function is
// scoped to a userId so a user can only ever touch their own clubs/players.

import { pool, withTransaction } from "@/lib/db";

export interface ClubPlayer {
  /** Membership id (a club_players row) — used to remove them from THIS club. */
  id: string;
  /** The shared person identity (a people row) — used to rename them
   *  everywhere, since one person can belong to several clubs. */
  personId: string;
  name: string;
  lastPlayedAt: string | null;
  createdAt: string;
}

/** One human in the account's roster, with the clubs they belong to. */
export interface RosterPerson {
  /** people.id */
  id: string;
  name: string;
  /** Names of the clubs this person is currently in (may be empty). */
  clubs: string[];
  lastPlayedAt: string | null;
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
    `select cp.id, cp.person_id, pe.name, cp.last_played_at, cp.created_at
       from public.club_players cp
       join public.people pe on pe.id = cp.person_id
      where cp.club_id = $1
      order by cp.last_played_at desc nulls last, lower(pe.name) asc`,
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
      personId: String(p.person_id),
      name: String(p.name),
      lastPlayedAt: iso(p.last_played_at),
      createdAt: iso(p.created_at) as string,
    })),
  };
}

/**
 * The account's whole roster — one row per person (already de-duplicated, since
 * a person is a single identity), with the clubs they belong to and when they
 * last played. Most-recently-played first. Powers the club-agnostic setup picker
 * and the "you already have them" suggestions when adding to a club.
 */
export async function listRoster(userId: string): Promise<RosterPerson[]> {
  const { rows } = await pool.query(
    `select pe.id, pe.name,
            coalesce(
              array_agg(c.name order by c.name) filter (where c.id is not null),
              '{}'
            ) as clubs,
            max(cp.last_played_at) as last_played_at
       from public.people pe
       left join public.club_players cp on cp.person_id = pe.id
       left join public.clubs c on c.id = cp.club_id
      where pe.user_id = $1
      group by pe.id, pe.name
      order by max(cp.last_played_at) desc nulls last, lower(pe.name) asc`,
    [userId],
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    clubs: (r.clubs as string[]) ?? [],
    lastPlayedAt: iso(r.last_played_at),
  }));
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

/**
 * Add a person to a club the user owns, by name. The person is a shared identity
 * across the account: if someone with this name already exists they are REUSED
 * (linked to this club) rather than duplicated; otherwise a new person is
 * created. Fails with "duplicate" only when that person is already in THIS club.
 */
export async function addPlayer(
  userId: string,
  clubId: string,
  name: string,
): Promise<AddResult> {
  const trimmed = name.trim();
  const owns = await pool.query(
    `select 1 from public.clubs where id = $1 and user_id = $2`,
    [clubId, userId],
  );
  if (owns.rowCount === 0) return { ok: false, error: "not_found" };

  return withTransaction(async (client) => {
    // Find-or-create the person (one identity per name per account).
    await client.query(
      `insert into public.people (user_id, name) values ($1, $2)
         on conflict (user_id, lower(name)) do nothing`,
      [userId, trimmed],
    );
    const { rows: pRows } = await client.query(
      `select id from public.people where user_id = $1 and lower(name) = lower($2)`,
      [userId, trimmed],
    );
    const personId = String(pRows[0].id);
    // Link them to the club. Already a member → duplicate.
    const { rows: mRows } = await client.query(
      `insert into public.club_players (club_id, person_id) values ($1, $2)
         on conflict (club_id, person_id) do nothing
         returning id`,
      [clubId, personId],
    );
    if (mRows.length === 0) return { ok: false, error: "duplicate" as const };
    return { ok: true as const, id: String(mRows[0].id) };
  });
}

/**
 * Rename a person the user owns. Because a person is one shared identity, this
 * renames them in EVERY club they belong to. `personId` is a people.id.
 */
export async function renamePlayer(
  userId: string,
  personId: string,
  name: string,
): Promise<{ ok: boolean; error?: "duplicate" }> {
  try {
    const res = await pool.query(
      `update public.people set name = $1 where id = $2 and user_id = $3`,
      [name.trim(), personId, userId],
    );
    return { ok: (res.rowCount ?? 0) > 0 };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "duplicate" };
    throw e;
  }
}

/**
 * Remove a person from a club — deletes the membership only. The person stays in
 * your roster and in any other clubs they belong to. `membershipId` is a
 * club_players.id.
 */
export async function removePlayer(userId: string, membershipId: string): Promise<void> {
  await pool.query(
    `delete from public.club_players cp
       using public.clubs c
      where cp.id = $1 and cp.club_id = c.id and c.user_id = $2`,
    [membershipId, userId],
  );
}

/** Stamp last_played_at on the club's memberships whose people turned out. */
export async function markPlayed(
  userId: string,
  clubId: string,
  names: string[],
): Promise<void> {
  if (names.length === 0) return;
  await pool.query(
    `update public.club_players cp set last_played_at = now()
       from public.clubs c, public.people pe
      where cp.club_id = c.id and c.user_id = $1 and c.id = $2
        and cp.person_id = pe.id
        and lower(pe.name) = any($3::text[])`,
    [userId, clubId, names.map((n) => n.trim().toLowerCase())],
  );
}
