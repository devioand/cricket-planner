# Streamlined match flow — plan

## Problem
Playing a match takes too many steps: Start Match → toss → enter 1st innings →
"Start Second Innings" → enter 2nd innings → Finish. The innings sequencing is
slow and fiddly, and there is no way to finish a match nobody played.

## Goals
1. **Fewer steps.** After the toss, both teams' scores are editable at any time
   and there is a single **Finish Match** button. Remove the "First Innings" /
   "Start Second Innings" phases.
2. **Handle unplayed matches.** Finish must ensure both scores are entered, OR
   let the user finish a match that wasn't played.
3. **Keep the descriptions** ("Match in progress - Toss required", "X won the
   toss and elected to bat first", "X scored…, Y needs…"). Only remove the
   redundant standalone **"Toss Required"** heading above the coin-flip button.
4. **Faster score entry.** The score dialog pre-fills **Overs** with the
   tournament's configured overs (e.g. 20 for a T20) and **Wickets** with **0**
   (both editable). Runs stays empty.

## Decisions
- **Unplayed match → No Result, 1 point each** (my recommendation, per your
  ask). This is the standard cricket rule for abandoned/washed-out matches and
  cleanly covers both "one team didn't show" and "both teams skipped." It avoids
  awarding a win with no runs (undefined NRR / no clear winner). No Result is
  offered for **group-stage matches only** — a playoff needs a winner to advance,
  so playoff matches still require both scores. (If you'd rather a no-show give
  the present team a walkover win, say so and I'll add it.)
- **Toss-aware results.** With both scores freely editable and the toss deciding
  who bats first, `completeMatch` now uses the toss to decide the margin: the
  team batting first wins **by runs**, the chasing team wins **by wickets**
  (using `maxWickets`, not a hard-coded 10). Falls back to "team1 bats first"
  when no toss is set, so existing tests stay valid.

## New match state machine
`scheduled` → **Start Match** → `in-progress` (toss required) → **Flip Coin** →
`in-progress` (playing: both scores editable + **Finish Match**) → `completed`.

Gone: `first-innings-ready`, `first-innings-complete`, `second-innings-ready`,
`ready-to-finish`, the "Start Second Innings" button, and `secondInningsStarted`
usage.

## Finish Match behaviour
- Both innings present → complete with a result (toss-aware winner, or tie = 1pt
  each). Champion celebration if it was the final.
- Not both present, group stage → open a small dialog: *"Finish as No Result?
  Both teams get 1 point."* → confirm runs `completeMatchAsNoResult`.
- Not both present, playoff → toast: enter both scores.

## Files
**Engine / stats (pure, tested):**
- `engine.ts` — `completeMatch` toss-aware; new `completeMatchAsNoResult`; remove
  `startSecondInnings`.
- `algorithms/cricket-stats.ts` — `updateTeamStatsAfterMatch`: no-result counts as
  played, awards **1 point each**, no runs/NRR, and tolerates missing innings.

**Store:**
- `tournament-store.ts` — drop `startSecondInnings`, add `completeAsNoResult`.

**UI:**
- `match-card.tsx` — simplified `getMatchState`; both edit icons after toss;
  finish handler + finish dialog.
- `match-actions.tsx` — Start Match / Toss / Finish Match only.
- `match-status.tsx` — descriptions for the new states (toss line → "needs runs"
  → ready-to-finish; plus a "No result" line).
- `toss-manager.tsx` — remove the "Toss Required" heading.
- `team-score-input-dialog.tsx` — default Overs = match overs, Wickets = 0,
  pre-fill an existing innings when editing; remount per open (no `useEffect`).
- new `finish-match-dialog.tsx` — the No Result confirmation.

## Phases
1. Engine + stats + tests.
2. Store method changes.
3. Match-card / match-actions / match-status / toss-manager flow.
4. Score dialog defaults + editable, + finish dialog.
5. Verify (tsc/lint/test/build) + dogfood.

## Tests to add
- `completeMatch` toss-aware: chasing team wins **by wickets**; batting-first team
  wins **by runs**; tie.
- `completeMatchAsNoResult`: match completed as no-result; both teams +1 point,
  noResults+1, no runs; round-robin completion still seeds playoffs.
- `updateTeamStatsAfterMatch` no-result branch.
