# Local-first play flow — implementation plan

## Problem

The tournament play flow (`/tournament/round-robin/[id]`) currently persists **every**
user action to Postgres synchronously:

`click → server action → mutateTournament()` which does `SELECT … FOR UPDATE`, loads
all child rows, **deletes and re-inserts every team/stat/match/innings row one-by-one**
against remote Supabase, then `revalidatePath(layout)` re-renders and re-fetches the
whole subtree.

That is dozens of sequential round-trips per click, with **no optimistic update** —
hence the multi-second, no-loading-state feel when starting a match, entering a score,
or finishing a match.

## Root-cause insight

`src/contexts/tournament-context/engine.ts` is already a **pure, framework-free
reducer** — `(state, args) => state`. Today it runs *inside a DB transaction*. The fix
is to run the **same engine on the client** against a local copy of `TournamentState`,
so every action is an instant in-memory reducer step + a synchronous `localStorage`
write. The database leaves the hot path entirely. **No game logic is duplicated** — the
client imports the exact functions the server actions call today.

## Decisions (locked with the user)

| Decision | Choice |
| --- | --- |
| Final DB save + localStorage clear | **Explicit "Finish & Save Tournament" button** (appears once the final is decided) |
| Sync strategy | **Strictly manual** — DB is written only on the Sync button and on Finish |
| Server-state library | **React Query (TanStack Query)** for the sync/finish mutation lifecycle |

## Source-of-truth rules

| Tournament lifecycle | Reads from | Writes to | DB touched |
| --- | --- | --- | --- |
| In-progress (setup → playing) | localStorage (live engine) | localStorage, instantly | Only on **Sync** (manual) |
| **Sync** pressed | — | DB (full replace) **+ keeps** localStorage | Yes — one transaction |
| **Finish** pressed (final decided) | — | DB (final save) **then clears** localStorage | Yes — one transaction |
| Completed | DB (read-only) | nothing | Read-only |

## Two hard invariants (data-safety guarantees)

1. **Every localStorage operation is scoped to a single tournament id.**
   Key is always `` `cricket-planner:tournament:${id}` ``. There is no enumeration, no
   bulk clear, no `localStorage.clear()`. Opening tournament **B** can only read/write
   `…:B`; tournament **A**'s key is never referenced. The cross-tab `storage` listener
   also filters on our own key.

2. **A completed tournament touches localStorage zero times — it is a pure DB read.**
   The store constructor decides mode once: `status === "completed"` → serve the DB
   state read-only and `return` before any storage call exists. Opening a finished
   tournament has no code path that can read, write, or delete localStorage. The only
   place a key is ever removed is the Finish flow, scoped to its own id.

> Consequence: opening a completed tournament while another is mid-play **cannot**
> disturb the in-progress tournament's saved state.

## Architecture

Three layers, each with a single responsibility.

### Layer A — external store (`src/lib/local/tournament-store.ts`)

A plain, unit-testable class — **not** a `useReducer`. It is a proper *external store*
so we can use React's `useSyncExternalStore`, which is the idiomatic primitive for
"state that lives in a browser store, survives reloads, and syncs across tabs." This
deliberately avoids the `useEffect`-hydration anti-pattern.

- Holds an in-memory `snapshot` with a **stable reference** between mutations
  (required by `useSyncExternalStore`).
- `getSnapshot()` / `getServerSnapshot()` — the latter always returns the DB-derived
  snapshot so SSR + hydration never mismatch (client localStorage may legitimately
  differ post-hydration; `useSyncExternalStore` is built for exactly this).
- Mutations (`startMatch`, `setToss`, `updateInnings`, `startSecondInnings`,
  `finishMatch`, `generate`, `sampleResults`) each call the pure engine, update the
  cache, persist to localStorage synchronously, and notify listeners.
- `subscribe()` ref-counts window listeners (`storage` for cross-tab, `beforeunload`
  for an unsaved-changes guard) — so those live in the store, **not** in component
  `useEffect`s.
- Versioned + `try/catch` persistence: corrupt/absent → fall back to DB state.

### Layer B — provider + hook (`src/contexts/tournament-context/live-provider.tsx`)

- `LiveTournamentProvider` creates the store once via `useRef` lazy init (recreates
  only if the tournament id changes) and passes the **stable store handle** through
  context — so context never causes re-renders.
- `useLiveTournament()` = `useContext(store)` + `useSyncExternalStore`. Reactive reads
  come only from the store snapshot.

### Layer C — server sync (React Query + server actions)

- `useSyncTournament` / `useFinishTournament` → `useMutation` wrapping two server
  actions built on the existing `saveTournamentState` (already an atomic, `user_id`-
  scoped full replace).
- React Query owns the **mutation lifecycle** (`isPending`, `isError`, `retry`) only.
  Server-Component data (home list, read-only finished view) is invalidated by
  `revalidatePath` inside the server action + `router.refresh()` — **not**
  `invalidateQueries` (RQ's cache does not refresh RSC data).

## `useEffect` / `useState` posture

- **Component `useEffect` count: 0.** Hydration → `useSyncExternalStore`. Cross-tab +
  `beforeunload` → owned by the store, driven by the hook's subscribe lifecycle.
- `useReducer` for game state → removed (the store replaces it and adds persistence +
  cross-tab for free).
- Local-first **removes** `useState`: `isStarting`, `isSubmitting`, and every
  `useTransition` in the play components disappear because actions are now synchronous.
- Remaining `useState` is genuinely-local UI state only: dialog open/closed, form
  inputs, celebration-open flag. Sync/Finish "pending" comes from RQ's `isPending`.

## Next.js posture

- `layout.tsx` stays a Server Component: `requireUser()` + `getTournament()` once, and
  it is the **only** place that fetches (removing the duplicate fetch currently in the
  pages). It renders `<LiveTournamentProvider init={…}>{children}</…>`.
- Pages stay Server Components rendering thin client views; `'use client'` stays at the
  leaves. Completed tournaments render read-only from the store's server snapshot (no
  refetch, no localStorage).

## File changes

**New**
- `src/lib/local/tournament-store.ts` — external store (Layer A).
- `src/contexts/tournament-context/live-provider.tsx` — provider + hook (Layer B).
- `src/lib/query/query-provider.tsx` — `QueryClientProvider` (mounted inside
  `src/components/ui/provider.tsx`).
- `src/lib/query/use-tournament-sync.ts` — `useSyncTournament` / `useFinishTournament`.
- `src/components/tournaments/sync-bar.tsx` — Sync button + dirty/last-synced indicator
  + "Finish & Save Tournament" button.

**Changed**
- `src/app/tournament/round-robin/[id]/layout.tsx` — host the provider + SyncBar; keep
  the single server fetch.
- `matches/page.tsx`, `standings/page.tsx` — read from `useLiveTournament()` instead of
  a second server fetch (standings computes `getStandings(state)` client-side).
- `match-card.tsx`, `match-actions.tsx`, `toss-manager.tsx`,
  `team-score-input-dialog.tsx`, `sample-results-button.tsx` — call store actions
  instead of server actions; delete `useTransition` / `isSubmitting`.
- `setup-form.tsx` — `handleStartTournament` calls the store's `generate()` locally.

**Removed (dead after migration)**
- Per-action server actions in `[id]/actions.ts` (`startMatchAction`, `setTossAction`,
  `updateInningsAction`, `startSecondInningsAction`, `finishMatchAction`,
  `generateMatchesAction`, `generateSampleResultsAction`) → replaced by
  `syncTournamentAction` + `finishTournamentAction`.
- `mutateTournament` in the repository (unused once actions go local).
- **Kept**: `saveTournamentState`, `getTournament`, `listTournaments`,
  `createTournament`, `deleteTournament`.

## Phased rollout

- **Phase A** — Layer A store + Layer B provider/hook + unit tests (incl. the
  key-isolation invariant test). No UI wired yet. *(this commit)*
- **Phase B** — Wire Matches / Setup / Standings + interactive components to the store.
  Play flow becomes instant; per-action server actions become unused.
- **Phase C** — React Query provider + `syncTournamentAction` / `finishTournamentAction`
  + SyncBar (Sync + Finish + dirty indicator).
- **Phase D** — Completed = read-only from DB; delete dead server actions +
  `mutateTournament`.
- **Phase E** — Polish: last-synced timestamp, error/retry banners; optionally batch the
  `saveTournamentState` insert loop into multi-row inserts so the sync itself is snappy.

## Testing

- Existing engine tests cover game logic — untouched, so correctness stays locked.
- New: `tournament-store` — hydrate/roundtrip/version-fallback, dispatch → dirty +
  persist, resume, completed = read-only + never writes, `markSynced`, `clear` scoped to
  own id, and **opening completed B leaves in-progress A's key intact**.
- Manual QA: every click instant; Sync shows pending → saved and keeps localStorage;
  Finish saves then flips to read-only; reload mid-tournament restores from localStorage.

## Known limitations (accepted)

- Local-first is single-device; multiple devices editing the same tournament are
  last-writer-wins on full-state replace. A future `baseUpdatedAt` vs DB `updated_at`
  check can upgrade this to warn-on-conflict without changing the core.
- Under strictly-manual sync, unsynced local changes live only on the device until Sync;
  the `beforeunload` guard + a persistent "unsaved changes" indicator mitigate accidental
  loss without writing the DB.
