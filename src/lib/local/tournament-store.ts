// Local-first tournament store.
//
// A framework-free external store (usable with React's `useSyncExternalStore`) that
// keeps a live copy of `TournamentState` in memory, mirrors it to `localStorage`, and
// runs the SAME pure engine the server actions use — so gameplay actions are instant
// and never hit the database.
//
// Two hard invariants make this data-safe:
//
//   1. Every storage operation is scoped to a single tournament id (`keyFor(id)`).
//      There is no enumeration and no bulk clear — opening tournament B can never
//      touch tournament A's key.
//   2. A completed tournament is a pure DB read: the constructor serves the server
//      state read-only and returns before any storage call exists. Opening a finished
//      tournament touches localStorage zero times.

import type {
  TournamentState,
  PlayoffFormat,
  TossDecision,
} from "@/contexts/tournament-context/types";
import * as engine from "@/contexts/tournament-context/engine";
import type { CompleteMatchResult } from "@/contexts/tournament-context/engine";

/** DB lifecycle status, as produced by the tournament repository. */
export type TournamentStatus = "setup" | "in_progress" | "completed";

/** Everything the store needs from the server to bootstrap. */
export interface StoreInit {
  id: string;
  status: TournamentStatus;
  state: TournamentState;
}

/** Reactive value exposed to React via `useSyncExternalStore`. */
export interface LocalSnapshot {
  state: TournamentState;
  /** True for completed tournaments — mutations are inert, storage untouched. */
  readOnly: boolean;
  /** True when there are local changes not yet synced to the DB. */
  isDirty: boolean;
  /** ISO timestamp of the last successful sync, or null. */
  lastSyncedAt: string | null;
  /**
   * True only for the server/hydration snapshot of an IN-PROGRESS tournament.
   * The server can't read localStorage, so it renders a skeleton rather than
   * flashing stale DB state; the client snapshot is always `false`, so the real
   * localStorage state is revealed right after hydration. Completed tournaments
   * render straight from the DB (never `true`).
   */
  hydrating: boolean;
}

const STORAGE_VERSION = 1;

/** The ONLY key shape this store ever reads or writes. Always per-id. */
export const keyFor = (id: string): string =>
  `cricket-planner:tournament:${id}`;

interface PersistedShape {
  __v: number;
  state: TournamentState;
  isDirty: boolean;
  lastSyncedAt: string | null;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export class TournamentStore {
  readonly id: string;

  /** In-memory cache — a stable reference between mutations. */
  private snapshot: LocalSnapshot;
  /** DB-derived snapshot returned during SSR/hydration; never mutated. */
  private readonly serverSnapshot: LocalSnapshot;

  private readonly listeners = new Set<() => void>();
  private windowBound = false;

  constructor(init: StoreInit) {
    this.id = init.id;
    const readOnly = init.status === "completed";

    // Server + hydration snapshot: the DB state. For an in-progress tournament
    // it is marked `hydrating` so the server renders a skeleton instead of stale
    // DB data; completed tournaments render straight from it.
    this.serverSnapshot = {
      state: init.state,
      readOnly,
      isDirty: false,
      lastSyncedAt: null,
      hydrating: !readOnly,
    };

    // INVARIANT 2: completed tournaments never touch localStorage.
    if (readOnly) {
      this.snapshot = this.serverSnapshot; // hydrating: false — renders immediately
      return;
    }

    // In-progress: our own localStorage copy wins (it may be ahead of the DB);
    // otherwise start from the DB state. Either way the client snapshot is not
    // hydrating, so real content replaces the skeleton right after hydration. No
    // write happens during construction — persistence is only on change/sync/clear.
    this.snapshot = this.readLocal() ?? {
      state: init.state,
      readOnly: false,
      isDirty: false,
      lastSyncedAt: null,
      hydrating: false,
    };
  }

  // ── useSyncExternalStore wiring ────────────────────────────────────────────

  getSnapshot = (): LocalSnapshot => this.snapshot;
  getServerSnapshot = (): LocalSnapshot => this.serverSnapshot;

  subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    if (this.listeners.size === 1) this.bindWindow();
    return () => {
      this.listeners.delete(onChange);
      if (this.listeners.size === 0) this.unbindWindow();
    };
  };

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  // ── Engine-backed mutations (inert while read-only) ────────────────────────

  startMatch(matchId: string): void {
    this.commit(engine.startMatch(this.snapshot.state, matchId));
  }

  setToss(matchId: string, tossWinner: string, decision: TossDecision): void {
    this.commit(
      engine.setMatchToss(this.snapshot.state, matchId, tossWinner, decision),
    );
  }

  updateInnings(
    matchId: string,
    isTeam1: boolean,
    score: { runs: number; wickets: number; overs: number },
  ): void {
    this.commit(
      engine.updateSingleInnings(this.snapshot.state, matchId, isTeam1, score),
    );
  }

  /** Complete a match and return the engine result (winner / next match). */
  finishMatch(matchId: string): CompleteMatchResult {
    if (this.snapshot.readOnly) {
      return {
        state: this.snapshot.state,
        complete: false,
        winner: engine.getTournamentWinner(this.snapshot.state),
      };
    }
    const result = engine.completeMatch(this.snapshot.state, matchId);
    this.commit(result.state);
    return result;
  }

  /** Finish an unplayed group match as a no result (both teams get 1 point). */
  completeAsNoResult(matchId: string): CompleteMatchResult {
    if (this.snapshot.readOnly) {
      return {
        state: this.snapshot.state,
        complete: false,
        winner: engine.getTournamentWinner(this.snapshot.state),
      };
    }
    const result = engine.completeMatchAsNoResult(this.snapshot.state, matchId);
    this.commit(result.state);
    return result;
  }

  /** Build teams + settings + schedule locally (mirrors the old generate action). */
  generate(setup: {
    teams: string[];
    maxOvers: number;
    maxWickets: number;
    playoffFormat: PlayoffFormat;
  }): { success: boolean; errors?: string[] } {
    if (this.snapshot.readOnly) return { success: false };

    let next: TournamentState = {
      ...this.snapshot.state,
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
    if (gen.success) this.commit(gen.state);
    return { success: gen.success, errors: gen.errors };
  }

  /** Dev-only: fill scheduled non-TBD matches with random in-progress scores. */
  sampleResults(): void {
    this.commit(engine.generateSampleResults(this.snapshot.state));
  }

  // ── Sync lifecycle ─────────────────────────────────────────────────────────

  /** Mark the current local state as persisted to the DB (keeps localStorage). */
  markSynced(lastSyncedAt: string): void {
    if (this.snapshot.readOnly) return;
    this.snapshot = { ...this.snapshot, isDirty: false, lastSyncedAt };
    this.writeLocal();
    this.emit();
  }

  /** Remove THIS tournament's local copy (used after Finish). Never any other id. */
  clear(): void {
    if (canUseStorage()) window.localStorage.removeItem(keyFor(this.id));
    this.snapshot = { ...this.snapshot, isDirty: false };
    this.emit();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private commit(state: TournamentState): void {
    if (this.snapshot.readOnly) return;
    // `completeMatch` etc. return a new object; engine no-ops return the same ref.
    if (state === this.snapshot.state) return;
    this.snapshot = { ...this.snapshot, state, isDirty: true };
    this.writeLocal();
    this.emit();
  }

  private readLocal(): LocalSnapshot | null {
    if (!canUseStorage()) return null;
    try {
      const raw = window.localStorage.getItem(keyFor(this.id));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersistedShape>;
      if (parsed?.__v !== STORAGE_VERSION || !parsed.state) return null;
      return {
        state: parsed.state,
        readOnly: false,
        isDirty: parsed.isDirty ?? false,
        lastSyncedAt: parsed.lastSyncedAt ?? null,
        hydrating: false,
      };
    } catch {
      return null; // corrupt payload → fall back to the DB state
    }
  }

  private writeLocal(): void {
    if (!canUseStorage() || this.snapshot.readOnly) return;
    try {
      const payload: PersistedShape = {
        __v: STORAGE_VERSION,
        state: this.snapshot.state,
        isDirty: this.snapshot.isDirty,
        lastSyncedAt: this.snapshot.lastSyncedAt,
      };
      window.localStorage.setItem(keyFor(this.id), JSON.stringify(payload));
    } catch {
      // Quota exceeded / storage disabled — non-fatal; state survives in memory.
    }
  }

  // Window listeners live here (not in a component effect) and are ref-counted by
  // `subscribe`. Read-only stores never need them.
  private bindWindow(): void {
    if (this.windowBound || this.snapshot.readOnly) return;
    if (typeof window === "undefined") return;
    this.windowBound = true;
    window.addEventListener("storage", this.onStorage);
    window.addEventListener("beforeunload", this.onBeforeUnload);
  }

  private unbindWindow(): void {
    if (!this.windowBound || typeof window === "undefined") return;
    this.windowBound = false;
    window.removeEventListener("storage", this.onStorage);
    window.removeEventListener("beforeunload", this.onBeforeUnload);
  }

  /** Cross-tab sync — only reacts to OUR key, never another tournament's. */
  private onStorage = (event: StorageEvent): void => {
    if (event.key !== keyFor(this.id)) return;
    const local = this.readLocal();
    if (local) {
      this.snapshot = local;
      this.emit();
    }
  };

  /** Warn before leaving with unsynced changes (does not write the DB). */
  private onBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!this.snapshot.isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  };
}
