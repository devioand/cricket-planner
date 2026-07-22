// Real, data-backed pre-match predictions. Pure + framework-free so it can be
// unit-tested and reused. Given two sides' actual history (from completed
// tournaments) it returns a win probability — or NULL when there genuinely
// isn't enough played history to say anything. It never guesses: no history,
// no number.

export interface PlayerForm {
  /** Matches played across completed tournaments (includes draws/no-results). */
  played: number;
  /** Matches won. */
  wins: number;
  /** Average net run rate across those tournaments. */
  nrr: number;
}

export interface FormData {
  /** Per side, keyed by lowercased team/player name. */
  form: Record<string, PlayerForm>;
  /** Head-to-head: h2h[a][b] = number of times `a` beat `b` (lowercased). */
  h2h: Record<string, Record<string, number>>;
}

export const EMPTY_FORM: FormData = { form: {}, h2h: {} };

/**
 * Predicted win probability for `teamA` (0..1), blending overall form with the
 * head-to-head record — or `null` when either side has no played history, so
 * the UI can say "not enough form yet" instead of inventing a number.
 */
export function predictWin(
  teamA: string,
  teamB: string,
  data: FormData,
): number | null {
  const a = data.form[teamA.trim().toLowerCase()];
  const b = data.form[teamB.trim().toLowerCase()];
  if (!a || !b || a.played === 0 || b.played === 0) return null;

  // Form rating = win rate, nudged (a little) by net run rate. The NRR nudge is
  // capped so one blowout can't swamp a small sample.
  const nrrAdj = (p: PlayerForm) => Math.max(-0.1, Math.min(0.1, p.nrr * 0.02));
  const ratingA = Math.max(0.05, a.wins / a.played + nrrAdj(a));
  const ratingB = Math.max(0.05, b.wins / b.played + nrrAdj(b));
  const formProb = ratingA / (ratingA + ratingB);

  // Head-to-head, Laplace-smoothed; weighted more the more often they've met.
  const ab = data.h2h[teamA.trim().toLowerCase()]?.[teamB.trim().toLowerCase()] ?? 0;
  const ba = data.h2h[teamB.trim().toLowerCase()]?.[teamA.trim().toLowerCase()] ?? 0;
  const meetings = ab + ba;

  let prob = formProb;
  if (meetings > 0) {
    const h2hProb = (ab + 0.5) / (meetings + 1);
    const weight = Math.min(0.6, 0.2 + meetings * 0.1);
    prob = weight * h2hProb + (1 - weight) * formProb;
  }

  // Stay honest: a handful of games never justifies near-certainty.
  return Math.max(0.15, Math.min(0.85, prob));
}
