// Local-first store for the club and its saved players. One club per device
// for now; the shape leaves room for several later without a data migration.
//
// Mirrors the Hold the Belt store's conventions — a versioned JSON blob in
// localStorage plus subscribe/getSnapshot for useSyncExternalStore — so there
// is one persistence idiom in the codebase rather than two.

import type { Club, ClubPlayer } from "./types";

const STORAGE_VERSION = 1;
const STORAGE_KEY = "cricket-planner:club";

/**
 * Generate an id. `crypto.randomUUID()` is only available in secure contexts —
 * and this app is often opened at the ground over a plain-http LAN IP, where
 * it's undefined — so fall back to a timestamp + random string.
 */
function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface PersistedShape {
  __v: number;
  club: Club;
}

export interface ClubSnapshot {
  club: Club | null;
  /** False until localStorage has been read, so the UI can hold off on the
   *  empty state instead of flashing "no club" then swapping in the real one. */
  hydrated: boolean;
}

/** Stable reference — useSyncExternalStore requires getServerSnapshot to be
 *  referentially consistent across calls. */
const SERVER_SNAPSHOT: ClubSnapshot = { club: null, hydrated: false };

class ClubStore {
  private snapshot: ClubSnapshot = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();

  // ── useSyncExternalStore wiring ──────────────────────────────────────────
  // The server has no localStorage, so it always renders the unhydrated
  // snapshot; hydrate() runs in an effect on the client and re-renders.
  getSnapshot = (): ClubSnapshot => this.snapshot;
  getServerSnapshot = (): ClubSnapshot => SERVER_SNAPSHOT;

  subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => {
      this.listeners.delete(onChange);
    };
  };

  private get club(): Club | null {
    return this.snapshot.club;
  }

  /** Read localStorage once on the client. Safe to call repeatedly. */
  hydrate(): void {
    if (this.snapshot.hydrated || typeof window === "undefined") return;
    let club: Club | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedShape;
        if (parsed.__v === STORAGE_VERSION && parsed.club) club = parsed.club;
      }
    } catch {
      // Unreadable blob — treat as "no club" rather than crashing at the ground.
    }
    this.snapshot = { club, hydrated: true };
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private commit(next: Club): void {
    this.snapshot = { club: next, hydrated: true };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ __v: STORAGE_VERSION, club: next } satisfies PersistedShape),
      );
    }
    this.emit();
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Create the club. No-op if one already exists. */
  create(name: string): Club {
    if (this.club) return this.club;
    const club: Club = {
      id: generateId(),
      name: name.trim() || "My Club",
      players: [],
      createdAt: new Date().toISOString(),
    };
    this.commit(club);
    return club;
  }

  /**
   * Return the existing club, creating one silently if there is none. This is
   * what keeps club creation from ever becoming a wall in front of the ground
   * flow — you discover you have a club, you never sign up for one.
   */
  ensure(name = "My Club"): Club {
    this.hydrate();
    return this.club ?? this.create(name);
  }

  rename(name: string): void {
    if (!this.club) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    this.commit({ ...this.club, name: trimmed });
  }

  /** Case-insensitive; returns false if the name is taken or blank. */
  addPlayer(name: string): boolean {
    const club = this.club;
    const trimmed = name.trim();
    if (!club || !trimmed) return false;
    if (club.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const player: ClubPlayer = {
      id: generateId(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      lastPlayedAt: null,
      userId: null,
    };
    this.commit({ ...club, players: [...club.players, player] });
    return true;
  }

  renamePlayer(id: string, name: string): boolean {
    const club = this.club;
    const trimmed = name.trim();
    if (!club || !trimmed) return false;
    if (
      club.players.some(
        (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return false;
    }
    this.commit({
      ...club,
      players: club.players.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
    });
    return true;
  }

  removePlayer(id: string): void {
    const club = this.club;
    if (!club) return;
    this.commit({ ...club, players: club.players.filter((p) => p.id !== id) });
  }

  /**
   * Stamp the players picked for a tournament. Names are matched
   * case-insensitively because the wizard hands back team-name strings, which
   * may have been edited after being picked.
   */
  markPlayed(names: string[]): void {
    const club = this.club;
    if (!club || names.length === 0) return;
    const picked = new Set(names.map((n) => n.trim().toLowerCase()));
    const now = new Date().toISOString();
    this.commit({
      ...club,
      players: club.players.map((p) =>
        picked.has(p.name.toLowerCase()) ? { ...p, lastPlayedAt: now } : p,
      ),
    });
  }

  /** Most recently played first, then never-played, then alphabetical. */
  static byRecency(players: ClubPlayer[]): ClubPlayer[] {
    return [...players].sort((a, b) => {
      if (a.lastPlayedAt && b.lastPlayedAt) {
        return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
      }
      if (a.lastPlayedAt) return -1;
      if (b.lastPlayedAt) return 1;
      return a.name.localeCompare(b.name);
    });
  }
}

export const clubStore = new ClubStore();
export { ClubStore };
