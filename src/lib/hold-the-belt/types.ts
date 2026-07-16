// Hold the Belt — a local-first, king-of-the-hill format.
//
// The winner stays on ("holds the belt"); the loser goes to the back of a
// queue; the next challenger steps up. First to `targetStreak` consecutive
// wins takes the belt — or, if `gameCap` games are reached first, the longest
// reign wins. State is kept as an append-only result log so the live view
// (holder / streak / queue / champion) is a pure derivation and undo is trivial.

/** One decided game between the current holder and challenger. */
export interface BeltResult {
  winner: string;
  loser: string;
  note?: string; // optional free-text score line, e.g. "42–38"
}

/** The persisted session: config + append-only results. */
export interface BeltSession {
  id: string;
  name: string;
  players: string[]; // initial order — the opening queue
  targetStreak: number; // consecutive wins to claim the belt
  gameCap: number; // max games; longest reign wins if reached
  results: BeltResult[];
  createdAt: string; // ISO
}

/** Derived, read-only view of the current state (never stored). */
export interface BeltView {
  holder: string | null; // who currently holds the belt
  challenger: string | null; // who plays the holder next
  streak: number; // the holder's current consecutive wins
  onDeck: string | null; // next in line after the challenger
  queue: string[]; // waiting line after the challenger (front = onDeck)
  gamesPlayed: number;
  gamesLeft: number; // gameCap − gamesPlayed
  champion: string | null; // set once decided
  champReason: "streak" | "cap" | null;
  longestReign: { player: string; streak: number } | null;
}
