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
  let cappedOut = false;

  // Per-player running totals. `recentAt` = the most recent game index at which
  // a player stood at their longest reign — the "hot hand" cap tiebreak.
  const stats = new Map<
    string,
    { longest: number; wins: number; recentAt: number }
  >();
  for (const p of s.players) {
    if (!stats.has(p)) stats.set(p, { longest: 0, wins: 0, recentAt: 0 });
  }

  for (const r of s.results) {
    played++;
    if (r.winner === holder) {
      streak += 1;
    } else {
      holder = r.winner;
      streak = 1;
    }

    const st = stats.get(holder) ?? { longest: 0, wins: 0, recentAt: 0 };
    st.wins += 1;
    if (streak >= st.longest) {
      st.longest = streak;
      st.recentAt = played;
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
      cappedOut = true;
      champReason = "cap";
      break;
    }
    challenger = queue.shift() ?? null;
  }

  // Leader-first: longest reign desc → total wins desc → most recent (hot hand).
  const standings: BeltStanding[] = [...stats.entries()]
    .map(([player, st]) => ({
      player,
      longestReign: st.longest,
      totalWins: st.wins,
      isHolder: !champion && !cappedOut && player === holder,
      currentStreak: player === holder ? streak : 0,
      isLeader: false,
    }))
    .sort((a, b) => {
      if (b.longestReign !== a.longestReign) return b.longestReign - a.longestReign;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return stats.get(b.player)!.recentAt - stats.get(a.player)!.recentAt;
    });
  if (standings.length > 0 && standings[0].longestReign > 0) {
    standings[0].isLeader = true;
  }
  // At the cap, the belt goes to the top of the standings (best reign, then wins).
  if (cappedOut) champion = standings[0]?.player ?? holder;

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

/**
 * The champion if the outcome is already forced — i.e. every possible way the
 * remaining games could go leads to the same winner (a "dead rubber" situation,
 * or an early mathematical clinch). Returns null if the result is still live.
 * Bounded to nearby endings so it stays cheap to call on every render.
 */
export function guaranteedChampion(s: BeltSession): string | null {
  const v = deriveView(s);
  if (v.champion) return v.champion;
  if (v.gamesLeft > 8) return null; // too far out to be decided; keep playing
  return clinch(s);
}

function clinch(s: BeltSession): string | null {
  const v = deriveView(s);
  if (v.champion) return v.champion;
  if (!v.holder || !v.challenger) return null;
  // Both branches must lead to the same champion for it to be guaranteed.
  const ifHolder = clinch(applyResult(s, v.holder));
  if (ifHolder === null) return null;
  const ifChallenger = clinch(applyResult(s, v.challenger));
  return ifHolder === ifChallenger ? ifHolder : null;
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
