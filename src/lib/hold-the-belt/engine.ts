import type { BeltSession, BeltStanding, BeltView } from "./types";

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

  // Per-player running totals. `achievedAt` = the game index at which a player
  // first reached their longest reign, used to break cap ties (earliest wins).
  const stats = new Map<
    string,
    { longest: number; wins: number; achievedAt: number }
  >();
  for (const p of s.players) {
    if (!stats.has(p)) stats.set(p, { longest: 0, wins: 0, achievedAt: Infinity });
  }

  for (const r of s.results) {
    played++;
    if (r.winner === holder) {
      streak += 1;
    } else {
      holder = r.winner;
      streak = 1;
    }

    const st = stats.get(holder) ?? { longest: 0, wins: 0, achievedAt: Infinity };
    st.wins += 1;
    if (streak > st.longest) {
      st.longest = streak;
      st.achievedAt = played;
    }
    stats.set(holder, st);

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

  // Leader-first: longest reign desc, then earliest-achieved, then wins desc.
  const standings: BeltStanding[] = [...stats.entries()]
    .map(([player, st]) => ({
      player,
      longestReign: st.longest,
      totalWins: st.wins,
      isHolder: !champion && player === holder,
      currentStreak: player === holder ? streak : 0,
      isLeader: false,
    }))
    .sort((a, b) => {
      if (b.longestReign !== a.longestReign) return b.longestReign - a.longestReign;
      const at = stats.get(a.player)!.achievedAt - stats.get(b.player)!.achievedAt;
      if (at !== 0) return at;
      return b.totalWins - a.totalWins;
    });
  if (standings.length > 0 && standings[0].longestReign > 0) {
    standings[0].isLeader = true;
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
    standings,
  };
}

/**
 * Who would be champion if `winner` wins the current game? Returns null if the
 * game wouldn't decide the session (or the winner isn't on the pitch). Used for
 * the "on the line" projection on decisive games.
 */
export function projectChampion(s: BeltSession, winner: string): string | null {
  return deriveView(applyResult(s, winner)).champion;
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
