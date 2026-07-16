import type { BeltSession, BeltView } from "./types";

/**
 * Fold the append-only result log into the live view. Start: the first two
 * players are holder + challenger, the rest wait. Each result: winner holds the
 * belt (streak grows, or resets to 1 if the challenger took it), loser goes to
 * the back of the queue, the next challenger steps up. The session ends when the
 * holder reaches `targetStreak`, or when `gameCap` games have been played (then
 * the longest reign wins).
 */
export function deriveView(s: BeltSession): BeltView {
  let holder: string | null = s.players[0] ?? null;
  let challenger: string | null = s.players[1] ?? null;
  const queue: string[] = s.players.slice(2);
  let streak = 0;
  let played = 0;
  let champion: string | null = null;
  let champReason: "streak" | "cap" | null = null;
  let longest: { player: string; streak: number } | null = null;

  for (const r of s.results) {
    played++;
    if (r.winner === holder) {
      streak += 1;
    } else {
      holder = r.winner;
      streak = 1;
    }
    if (holder && (!longest || streak > longest.streak)) {
      longest = { player: holder, streak };
    }
    queue.push(r.loser);

    if (streak >= s.targetStreak) {
      champion = holder;
      champReason = "streak";
      break;
    }
    if (played >= s.gameCap) {
      champion = longest?.player ?? holder;
      champReason = "cap";
      break;
    }
    challenger = queue.shift() ?? null;
  }

  return {
    holder,
    challenger,
    streak,
    onDeck: queue[0] ?? null,
    queue,
    gamesPlayed: played,
    gamesLeft: Math.max(0, s.gameCap - played),
    champion,
    champReason,
    longestReign: longest,
  };
}

/** The player who loses if `winner` wins the current game (or null if invalid). */
export function loserOf(view: BeltView, winner: string): string | null {
  if (winner === view.holder) return view.challenger;
  if (winner === view.challenger) return view.holder;
  return null;
}

/** Record the current game's winner (no-op if already decided or winner invalid). */
export function applyResult(
  s: BeltSession,
  winner: string,
  note?: string,
): BeltSession {
  const view = deriveView(s);
  if (view.champion) return s;
  const loser = loserOf(view, winner);
  if (!loser) return s;
  return { ...s, results: [...s.results, { winner, loser, note }] };
}

/** Undo the most recent result. */
export function undoResult(s: BeltSession): BeltSession {
  if (s.results.length === 0) return s;
  return { ...s, results: s.results.slice(0, -1) };
}
