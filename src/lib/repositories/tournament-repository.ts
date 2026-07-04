import type { Pool, PoolClient } from "pg";
import { cache } from "react";
import { pool, withTransaction } from "@/lib/db";
import type {
  TournamentState,
  Match,
  CricketTeamStats,
  CricketMatchResult,
  InningsScore,
  TossResult,
  TournamentType,
  TournamentPhase,
  PlayoffFormat,
  PlayoffType,
  TossDecision,
} from "@/contexts/tournament-context/types";

/**
 * Tournament repository — the ONLY place that knows how the in-memory
 * `TournamentState` maps to normalized Postgres rows.
 *
 * The rest of the app (algorithms, reducer, UI) keeps working purely with
 * `TournamentState`. Loading rebuilds that object from rows; saving spreads it
 * back across tables inside a single transaction (full replace of children —
 * simple and always consistent for the small row counts a tournament has).
 */

// ── Public shapes ────────────────────────────────────────────────────────────

export type TournamentStatus = "setup" | "in_progress" | "completed";

export interface TournamentSummary {
  id: string;
  name: string;
  algorithm: TournamentType;
  status: TournamentStatus;
  playoffFormat: PlayoffFormat;
  winner: string | null;
  teamCount: number;
  maxOvers: number;
  maxWickets: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentRecord {
  id: string;
  name: string;
  status: TournamentStatus;
  state: TournamentState;
}

export interface CreateTournamentInput {
  name: string;
  algorithm: TournamentType;
  playoffFormat: PlayoffFormat;
  maxOvers: number;
  maxWickets: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const num = (v: unknown): number =>
  v === null || v === undefined ? 0 : Number(v);
const numOrUndef = (v: unknown): number | undefined =>
  v === null || v === undefined ? undefined : Number(v);
const strOrUndef = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

/** High-level lifecycle derived from the tournament state. */
function deriveStatus(state: TournamentState): TournamentStatus {
  if (!state.isGenerated) return "setup";
  return getFinalWinner(state) ? "completed" : "in_progress";
}

/** The champion's name, or null if the final hasn't been decided. */
function getFinalWinner(state: TournamentState): string | null {
  const finalMatch = state.matches.find(
    (m) => m.isPlayoff && m.playoffType === "final" && m.status === "completed",
  );
  return finalMatch?.result?.winner || null;
}

// ── Row → state reconstruction ───────────────────────────────────────────────

type Row = Record<string, unknown>;

function rowToTeamStats(r: Row): CricketTeamStats {
  const stats: CricketTeamStats = {
    teamName: String(r.team_name),
    matchesPlayed: num(r.matches_played),
    wins: num(r.wins),
    losses: num(r.losses),
    draws: num(r.draws),
    noResults: num(r.no_results),
    points: num(r.points),
    totalRunsScored: num(r.total_runs_scored),
    totalBallsFaced: num(r.total_balls_faced),
    totalOversPlayed: num(r.total_overs_played),
    totalRunsConceded: num(r.total_runs_conceded),
    totalBallsBowled: num(r.total_balls_bowled),
    totalOversBowled: num(r.total_overs_bowled),
    battingRunRate: num(r.batting_run_rate),
    bowlingRunRate: num(r.bowling_run_rate),
    netRunRate: num(r.net_run_rate),
    highestScore: numOrUndef(r.highest_score),
    lowestScore: numOrUndef(r.lowest_score),
  };
  if (r.biggest_win_opponent) {
    stats.biggestWin = {
      opponent: String(r.biggest_win_opponent),
      margin: num(r.biggest_win_margin),
      marginType: r.biggest_win_margin_type as "runs" | "wickets",
    };
  }
  return stats;
}

function rowToInnings(r: Row): InningsScore {
  return {
    teamName: String(r.team_name),
    runs: num(r.runs),
    wickets: num(r.wickets),
    overs: num(r.overs),
    ballsFaced: num(r.balls_faced),
    isAllOut: Boolean(r.is_all_out),
    runRate: num(r.run_rate),
  };
}

function rowToMatch(r: Row, innings: Row[]): Match {
  const team1Innings = innings.find((i) => i.team_slot === "team1") ?? null;
  const team2Innings = innings.find((i) => i.team_slot === "team2") ?? null;

  const toss: TossResult | undefined = r.toss_winner
    ? {
        tossWinner: String(r.toss_winner),
        decision: r.toss_decision as TossDecision,
        tossLoser: String(r.toss_loser),
      }
    : undefined;

  const hasResult =
    !!team1Innings || !!team2Innings || r.result_match_type != null;

  const result: CricketMatchResult | undefined = hasResult
    ? {
        winner: (r.result_winner as string) ?? "",
        loser: (r.result_loser as string) ?? "",
        isDraw:
          r.result_is_draw == null ? undefined : Boolean(r.result_is_draw),
        isNoResult:
          r.result_is_no_result == null
            ? undefined
            : Boolean(r.result_is_no_result),
        team1Innings: team1Innings ? rowToInnings(team1Innings) : null,
        team2Innings: team2Innings ? rowToInnings(team2Innings) : null,
        marginType: r.result_margin_type as "runs" | "wickets" | undefined,
        margin: numOrUndef(r.result_margin),
        matchType:
          (r.result_match_type as "completed" | "abandoned" | "no-result") ??
          "completed",
      }
    : undefined;

  const match: Match = {
    id: String(r.match_key),
    team1: String(r.team1),
    team2: String(r.team2),
    round: num(r.round),
    status: r.status as Match["status"],
    venue: strOrUndef(r.venue),
    overs: num(r.overs),
    maxWickets: num(r.max_wickets),
    isPlayoff: Boolean(r.is_playoff),
    playoffType: (r.playoff_type as PlayoffType) ?? undefined,
    phase: (r.phase as TournamentPhase) ?? undefined,
    secondInningsStarted: Boolean(r.second_innings_started),
    toss,
    result,
  };
  return match;
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listTournaments(
  userId: string,
): Promise<TournamentSummary[]> {
  const { rows } = await pool.query(
    `select t.id, t.name, t.algorithm, t.status, t.playoff_format,
            t.winner, t.max_overs, t.max_wickets, t.created_at, t.updated_at,
            (select count(*) from public.teams te where te.tournament_id = t.id) as team_count
       from public.tournaments t
      where t.user_id = $1
      order by t.updated_at desc`,
    [userId],
  );

  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    algorithm: r.algorithm as TournamentType,
    status: r.status as TournamentStatus,
    playoffFormat: r.playoff_format as PlayoffFormat,
    winner: (r.winner as string) ?? null,
    teamCount: num(r.team_count),
    maxOvers: num(r.max_overs),
    maxWickets: num(r.max_wickets),
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  }));
}

/** Anything that can run a query — the shared pool or a transaction client. */
type Db = Pool | PoolClient;

/** Build a full TournamentRecord from an already-fetched tournament row. */
async function loadRecord(db: Db, t: Row): Promise<TournamentRecord> {
  const id = String(t.id);

  const [teamsRes, statsRes, matchesRes] = await Promise.all([
    db.query(
      `select name from public.teams where tournament_id = $1 order by position asc`,
      [id],
    ),
    db.query(`select * from public.team_stats where tournament_id = $1`, [id]),
    db.query(
      `select * from public.matches where tournament_id = $1 order by match_order asc`,
      [id],
    ),
  ]);

  const matchIds = matchesRes.rows.map((m) => m.id);
  const inningsByMatch = new Map<string, Row[]>();
  if (matchIds.length > 0) {
    const inningsRes = await db.query(
      `select * from public.innings where match_id = any($1::uuid[])`,
      [matchIds],
    );
    for (const inn of inningsRes.rows) {
      const list = inningsByMatch.get(String(inn.match_id)) ?? [];
      list.push(inn);
      inningsByMatch.set(String(inn.match_id), list);
    }
  }

  const teamStats: Record<string, CricketTeamStats> = {};
  for (const r of statsRes.rows) {
    teamStats[String(r.team_name)] = rowToTeamStats(r);
  }

  const matches: Match[] = matchesRes.rows.map((m) =>
    rowToMatch(m, inningsByMatch.get(String(m.id)) ?? []),
  );

  const state: TournamentState = {
    algorithm: t.algorithm as TournamentType,
    teams: teamsRes.rows.map((r) => String(r.name)),
    maxOvers: num(t.max_overs),
    maxWickets: num(t.max_wickets),
    matches,
    isGenerated: Boolean(t.is_generated),
    teamStats,
    phase: t.phase as TournamentPhase,
    playoffFormat: t.playoff_format as PlayoffFormat,
  };

  return {
    id,
    name: String(t.name),
    status: t.status as TournamentStatus,
    state,
  };
}

/**
 * Load a tournament the user owns. Wrapped in React `cache()` so the layout and
 * page in a single request share one set of queries.
 */
export const getTournament = cache(
  async (userId: string, id: string): Promise<TournamentRecord | null> => {
    const { rows } = await pool.query(
      `select * from public.tournaments where id = $1 and user_id = $2`,
      [id, userId],
    );
    if (!rows[0]) return null;
    return loadRecord(pool, rows[0]);
  },
);

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createTournament(
  userId: string,
  input: CreateTournamentInput,
): Promise<string> {
  const { rows } = await pool.query(
    `insert into public.tournaments
       (user_id, name, algorithm, playoff_format, max_overs, max_wickets,
        is_generated, phase, status)
     values ($1, $2, $3, $4, $5, $6, false, 'setup', 'setup')
     returning id`,
    [
      userId,
      input.name,
      input.algorithm,
      input.playoffFormat,
      input.maxOvers,
      input.maxWickets,
    ],
  );
  return String(rows[0].id);
}

export async function deleteTournament(
  userId: string,
  id: string,
): Promise<void> {
  await pool.query(
    `delete from public.tournaments where id = $1 and user_id = $2`,
    [id, userId],
  );
}

/** Update the parent row + replace all child rows on an open transaction client. */
async function writeState(
  client: PoolClient,
  userId: string,
  id: string,
  state: TournamentState,
): Promise<void> {
  const upd = await client.query(
    `update public.tournaments
        set algorithm = $1, playoff_format = $2, max_overs = $3,
            max_wickets = $4, is_generated = $5, phase = $6, status = $7,
            winner = $8
      where id = $9 and user_id = $10`,
    [
      state.algorithm,
      state.playoffFormat,
      state.maxOvers,
      state.maxWickets,
      state.isGenerated,
      state.phase,
      deriveStatus(state),
      getFinalWinner(state),
      id,
      userId,
    ],
  );
  if (upd.rowCount === 0) {
    throw new Error("Tournament not found or not owned by user");
  }

  // Replace children (innings cascade-delete with matches).
  await client.query(`delete from public.teams where tournament_id = $1`, [id]);
  await client.query(`delete from public.team_stats where tournament_id = $1`, [
    id,
  ]);
  await client.query(`delete from public.matches where tournament_id = $1`, [
    id,
  ]);

  await insertTeams(client, id, state.teams);
  await insertTeamStats(client, id, state.teamStats);
  await insertMatches(client, id, state.matches);
}

/**
 * Persist the whole tournament state (verifies ownership + full child replace,
 * all inside one transaction).
 */
export async function saveTournamentState(
  userId: string,
  id: string,
  state: TournamentState,
): Promise<void> {
  await withTransaction((client) => writeState(client, userId, id, state));
}

/**
 * Atomically apply a state transition. Locks the tournament row
 * (`SELECT … FOR UPDATE`), loads the current state, runs `transition`, and
 * persists the result — all in one transaction. This serializes concurrent
 * mutations so an older write can never clobber a newer one.
 */
export async function mutateTournament<T>(
  userId: string,
  id: string,
  transition: (state: TournamentState) => {
    state: TournamentState;
    result?: T;
  },
): Promise<T | undefined> {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `select * from public.tournaments where id = $1 and user_id = $2 for update`,
      [id, userId],
    );
    if (!rows[0]) {
      throw new Error("Tournament not found or not owned by user");
    }
    const record = await loadRecord(client, rows[0]);
    const { state: nextState, result } = transition(record.state);
    await writeState(client, userId, id, nextState);
    return result;
  });
}

async function insertTeams(
  client: PoolClient,
  tournamentId: string,
  teams: string[],
): Promise<void> {
  for (let i = 0; i < teams.length; i++) {
    await client.query(
      `insert into public.teams (tournament_id, name, position) values ($1, $2, $3)`,
      [tournamentId, teams[i], i],
    );
  }
}

async function insertTeamStats(
  client: PoolClient,
  tournamentId: string,
  teamStats: Record<string, CricketTeamStats>,
): Promise<void> {
  for (const s of Object.values(teamStats)) {
    await client.query(
      `insert into public.team_stats
         (tournament_id, team_name, matches_played, wins, losses, draws,
          no_results, points, total_runs_scored, total_balls_faced,
          total_overs_played, total_runs_conceded, total_balls_bowled,
          total_overs_bowled, batting_run_rate, bowling_run_rate, net_run_rate,
          highest_score, lowest_score, biggest_win_opponent, biggest_win_margin,
          biggest_win_margin_type)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               $19,$20,$21,$22)`,
      [
        tournamentId,
        s.teamName,
        s.matchesPlayed,
        s.wins,
        s.losses,
        s.draws,
        s.noResults,
        s.points,
        s.totalRunsScored,
        s.totalBallsFaced,
        s.totalOversPlayed,
        s.totalRunsConceded,
        s.totalBallsBowled,
        s.totalOversBowled,
        s.battingRunRate,
        s.bowlingRunRate,
        s.netRunRate,
        s.highestScore ?? null,
        s.lowestScore ?? null,
        s.biggestWin?.opponent ?? null,
        s.biggestWin?.margin ?? null,
        s.biggestWin?.marginType ?? null,
      ],
    );
  }
}

async function insertMatches(
  client: PoolClient,
  tournamentId: string,
  matches: Match[],
): Promise<void> {
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const { rows } = await client.query(
      `insert into public.matches
         (tournament_id, match_key, match_order, team1, team2, round, status,
          venue, overs, max_wickets, is_playoff, playoff_type, phase,
          second_innings_started, toss_winner, toss_decision, toss_loser,
          result_winner, result_loser, result_is_draw, result_is_no_result,
          result_margin_type, result_margin, result_match_type)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               $19,$20,$21,$22,$23,$24)
       returning id`,
      [
        tournamentId,
        m.id,
        i,
        m.team1,
        m.team2,
        m.round,
        m.status,
        m.venue ?? null,
        m.overs,
        m.maxWickets,
        m.isPlayoff ?? false,
        m.playoffType ?? null,
        m.phase ?? null,
        m.secondInningsStarted ?? false,
        m.toss?.tossWinner ?? null,
        m.toss?.decision ?? null,
        m.toss?.tossLoser ?? null,
        m.result?.winner ?? null,
        m.result?.loser ?? null,
        m.result?.isDraw ?? null,
        m.result?.isNoResult ?? null,
        m.result?.marginType ?? null,
        m.result?.margin ?? null,
        m.result?.matchType ?? null,
      ],
    );
    const matchDbId = String(rows[0].id);

    const inningsToInsert: Array<{
      slot: "team1" | "team2";
      innings: InningsScore;
    }> = [];
    if (m.result?.team1Innings)
      inningsToInsert.push({ slot: "team1", innings: m.result.team1Innings });
    if (m.result?.team2Innings)
      inningsToInsert.push({ slot: "team2", innings: m.result.team2Innings });

    for (const { slot, innings } of inningsToInsert) {
      await client.query(
        `insert into public.innings
           (match_id, team_slot, team_name, runs, wickets, overs, balls_faced,
            is_all_out, run_rate)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          matchDbId,
          slot,
          innings.teamName,
          innings.runs,
          innings.wickets,
          innings.overs,
          innings.ballsFaced,
          innings.isAllOut,
          innings.runRate,
        ],
      );
    }
  }
}
