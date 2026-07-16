// Local-first store for a Hold the Belt session. The whole session (config +
// result log) is JSON-blobbed to localStorage under its own key namespace, so
// it never touches the tournament store. Exposes subscribe/getSnapshot for
// React's useSyncExternalStore.

import type { BeltSession } from "./types";
import { applyResult, undoResult } from "./engine";

const STORAGE_VERSION = 1;
const keyFor = (id: string) => `cricket-planner:belt:${id}`;

/**
 * Generate a session id. `crypto.randomUUID()` is only available in secure
 * contexts — and this app is often opened at the ground over a plain-http LAN
 * IP, where it's undefined — so fall back to a timestamp + random string.
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

export interface CreateBeltInput {
  name: string;
  players: string[];
  targetStreak: number;
  gameCap: number;
}

export class BeltStore {
  private session: BeltSession;
  private listeners = new Set<() => void>();

  constructor(session: BeltSession) {
    this.session = session;
  }

  /** Create + persist a new session, returning it. */
  static create(input: CreateBeltInput): BeltSession {
    const session: BeltSession = {
      id: generateId(),
      name: input.name,
      players: input.players,
      targetStreak: input.targetStreak,
      gameCap: input.gameCap,
      results: [],
      createdAt: new Date().toISOString(),
    };
    BeltStore.persist(session);
    return session;
  }

  /** Load a persisted session, or null if missing/unreadable. */
  static load(id: string): BeltSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(keyFor(id));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { __v?: number; session?: BeltSession };
      if (parsed.__v !== STORAGE_VERSION || !parsed.session) return null;
      return parsed.session;
    } catch {
      return null;
    }
  }

  private static persist(session: BeltSession): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      keyFor(session.id),
      JSON.stringify({ __v: STORAGE_VERSION, session }),
    );
  }

  // ── useSyncExternalStore wiring ────────────────────────────────────────────
  getSnapshot = (): BeltSession => this.session;
  subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  private commit(next: BeltSession): void {
    if (next === this.session) return;
    this.session = next;
    BeltStore.persist(next);
    this.listeners.forEach((l) => l());
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  recordWinner(winner: string, note?: string): void {
    this.commit(applyResult(this.session, winner, note));
  }
  undo(): void {
    this.commit(undoResult(this.session));
  }
  reset(): void {
    this.commit({ ...this.session, results: [] });
  }
}
