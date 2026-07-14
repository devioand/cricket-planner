import { TournamentStore, keyFor } from "@/lib/local/tournament-store";
import { initialState } from "@/contexts/tournament-context/engine";
import type { Match, TournamentState } from "@/contexts/tournament-context/types";

// jest.setup.js stubs localStorage with no-op mocks; the store needs a real store to
// exercise roundtrip + isolation, so install an in-memory implementation per test.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
});

/** A minimal in-progress state with one scheduled match "M1". */
function scheduledMatchState(): TournamentState {
  const match: Match = {
    id: "M1",
    team1: "AAA",
    team2: "BBB",
    round: 1,
    status: "scheduled",
    overs: 20,
    maxWickets: 10,
  };
  return {
    ...initialState,
    teams: ["AAA", "BBB"],
    isGenerated: true,
    matches: [match],
  };
}

const inProgress = (id: string) =>
  new TournamentStore({
    id,
    name: "Test Cup",
    status: "in_progress",
    state: scheduledMatchState(),
  });

describe("TournamentStore — hydration", () => {
  it("serves the DB state when no local copy exists, and does not write on construction", () => {
    const store = inProgress("T1");
    expect(store.getSnapshot().state.matches[0].status).toBe("scheduled");
    expect(store.getSnapshot().readOnly).toBe(false);
    expect(store.getSnapshot().isDirty).toBe(false);
    // Merely opening a tournament persists nothing.
    expect(window.localStorage.getItem(keyFor("T1"))).toBeNull();
  });

  it("migrates a v1 local payload (no playoffConfig) on read", () => {
    // Simulate a payload written before flexible playoffs shipped: __v 1 and a
    // state with no `playoffConfig`.
    const legacyState = scheduledMatchState() as Partial<TournamentState>;
    delete legacyState.playoffConfig;
    window.localStorage.setItem(
      keyFor("LEG"),
      JSON.stringify({
        __v: 1,
        state: legacyState,
        isDirty: true,
        lastSyncedAt: null,
      }),
    );

    const store = inProgress("LEG");
    // Read succeeds (not discarded) and the config is rebuilt from the format.
    expect(store.getSnapshot().isDirty).toBe(true);
    expect(store.getSnapshot().state.playoffConfig).not.toBeUndefined();
  });

  it("resumes from the local copy on reconstruction (survives reload)", () => {
    const first = inProgress("T2");
    first.startMatch("M1");

    const second = inProgress("T2");
    expect(second.getSnapshot().state.matches[0].status).toBe("in-progress");
    expect(second.getSnapshot().isDirty).toBe(true);
  });

  it("local snapshot wins over DB, but getServerSnapshot always returns DB state", () => {
    inProgress("T3").startMatch("M1"); // local copy now in-progress

    const store = inProgress("T3"); // DB still says scheduled
    expect(store.getSnapshot().state.matches[0].status).toBe("in-progress");
    expect(store.getServerSnapshot().state.matches[0].status).toBe("scheduled");
  });

  it("falls back to DB state on a corrupt or stale-version local copy", () => {
    window.localStorage.setItem(keyFor("T4"), "}{ not json");
    expect(inProgress("T4").getSnapshot().state.matches[0].status).toBe(
      "scheduled",
    );

    window.localStorage.setItem(
      keyFor("T5"),
      JSON.stringify({ __v: 999, state: scheduledMatchState() }),
    );
    expect(inProgress("T5").getSnapshot().state.matches[0].status).toBe(
      "scheduled",
    );
  });

  it("marks the in-progress server snapshot as hydrating, but never the client snapshot", () => {
    const store = inProgress("HY");
    expect(store.getServerSnapshot().hydrating).toBe(true); // server → skeleton
    expect(store.getSnapshot().hydrating).toBe(false); // client → real content
  });

  it("never hydrates a completed tournament (renders straight from the DB)", () => {
    const store = new TournamentStore({
      id: "HY2",
      name: "Test Cup",
      status: "completed",
      state: scheduledMatchState(),
    });
    expect(store.getServerSnapshot().hydrating).toBe(false);
    expect(store.getSnapshot().hydrating).toBe(false);
  });
});

describe("TournamentStore — mutations persist locally", () => {
  it("dispatches through the engine, marks dirty, and persists", () => {
    const store = inProgress("M");
    store.startMatch("M1");

    expect(store.getSnapshot().state.matches[0].status).toBe("in-progress");
    expect(store.getSnapshot().isDirty).toBe(true);

    const raw = window.localStorage.getItem(keyFor("M"));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.__v).toBe(2);
    expect(parsed.isDirty).toBe(true);
    expect(parsed.state.matches[0].status).toBe("in-progress");
  });

  it("generate() builds the schedule locally and persists", () => {
    const store = new TournamentStore({
      id: "GEN",
      name: "Test Cup",
      status: "setup",
      state: initialState,
    });
    const result = store.generate({
      teams: ["AAA", "BBB", "CCC"],
      maxOvers: 10,
      maxWickets: 10,
      playoffFormat: "world-cup",
    });

    expect(result.success).toBe(true);
    expect(store.getSnapshot().state.isGenerated).toBe(true);
    expect(store.getSnapshot().isDirty).toBe(true);
    expect(window.localStorage.getItem(keyFor("GEN"))).not.toBeNull();
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const store = inProgress("SUB");
    const cb = jest.fn();
    const unsubscribe = store.subscribe(cb);

    store.startMatch("M1");
    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setToss("M1", "AAA", "bat");
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe("TournamentStore — sync lifecycle", () => {
  it("markSynced clears the dirty flag and persists it", () => {
    const store = inProgress("SY");
    store.startMatch("M1");
    expect(store.getSnapshot().isDirty).toBe(true);

    store.markSynced("2026-07-06T00:00:00.000Z");
    expect(store.getSnapshot().isDirty).toBe(false);
    expect(store.getSnapshot().lastSyncedAt).toBe("2026-07-06T00:00:00.000Z");

    const parsed = JSON.parse(window.localStorage.getItem(keyFor("SY"))!);
    expect(parsed.isDirty).toBe(false);
  });

  it("clear() removes only this tournament's key", () => {
    const store = inProgress("CL");
    store.startMatch("M1");
    expect(window.localStorage.getItem(keyFor("CL"))).not.toBeNull();

    store.clear();
    expect(window.localStorage.getItem(keyFor("CL"))).toBeNull();
  });
});

describe("TournamentStore — completed is a pure read (INVARIANT 2)", () => {
  it("serves DB state read-only and never touches localStorage", () => {
    const store = new TournamentStore({
      id: "DONE",
      name: "Test Cup",
      status: "completed",
      state: scheduledMatchState(),
    });

    expect(store.getSnapshot().readOnly).toBe(true);
    expect(window.localStorage.getItem(keyFor("DONE"))).toBeNull();

    // Mutations are inert and still write nothing.
    store.startMatch("M1");
    store.finishMatch("M1");
    expect(store.getSnapshot().state.matches[0].status).toBe("scheduled");
    expect(window.localStorage.getItem(keyFor("DONE"))).toBeNull();
  });
});

describe("TournamentStore — cross-tournament isolation (INVARIANT 1)", () => {
  it("opening a completed tournament never disturbs an in-progress tournament's saved state", () => {
    // Tournament A is mid-play with unsynced local data.
    const a = inProgress("A");
    a.startMatch("M1");
    const aSaved = window.localStorage.getItem(keyFor("A"));
    expect(aSaved).not.toBeNull();

    // Open (and even poke at) completed tournament B.
    const b = new TournamentStore({
      id: "B",
      name: "Test Cup",
      status: "completed",
      state: scheduledMatchState(),
    });
    b.startMatch("M1");
    b.finishMatch("M1");

    // A is byte-for-byte untouched; B wrote nothing.
    expect(window.localStorage.getItem(keyFor("A"))).toBe(aSaved);
    expect(window.localStorage.getItem(keyFor("B"))).toBeNull();
  });

  it("mutating and clearing one in-progress tournament leaves another intact", () => {
    const a = inProgress("A");
    a.startMatch("M1");
    const aSaved = window.localStorage.getItem(keyFor("A"));

    const b = inProgress("B");
    b.startMatch("M1");
    expect(window.localStorage.getItem(keyFor("B"))).not.toBeNull();
    expect(window.localStorage.getItem(keyFor("A"))).toBe(aSaved);

    b.clear();
    expect(window.localStorage.getItem(keyFor("B"))).toBeNull();
    expect(window.localStorage.getItem(keyFor("A"))).toBe(aSaved);
  });
});
