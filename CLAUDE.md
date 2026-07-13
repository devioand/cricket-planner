# Cricket Planner — project conventions

A local-first cricket tournament planner used **on phones at the ground** to
run matches (round-robin + playoffs). Next.js 15 (App Router), React 19,
TypeScript, Chakra UI v3. State lives in a framework-free engine
(`src/contexts/tournament-context/engine.ts`) mirrored to `localStorage` and
persisted to Postgres only on explicit Sync/Finish.

## Mobile-first is mandatory

This app is operated from a phone, never a desktop. Every UI change **must** be
designed and verified at a phone viewport first (~375–430px wide). Desktop is a
progressive enhancement, not the baseline.

When building or changing any UI:

- **Design at phone width first.** Verify the screen works at ~375px before
  looking at it wider. If it only works on a laptop, it's not done.
- **Fluid, not fixed.** Use Chakra responsive tokens (`base:` first, then `md:`)
  and narrow centered max-widths (the tournament routes use `maxW="600px"`).
  Never hardcode layout widths in pixels; `maxW` is fine (it shrinks on small
  screens), rigid `w="640px"` layout containers are not.
- **Thumb-reachable controls.** Primary actions are full-width and at the bottom
  of the screen (sticky footers for multi-step flows). Tap targets ≥ 44px.
- **One column by default.** Stack vertically; only split into columns at `md+`.
- **Wide content scrolls locally.** Tables/brackets go in their own
  `overflow-x: auto` container — the page body must never scroll sideways.

Verify mobile behavior with the `run` skill at a mobile viewport (or DevTools
device emulation) before considering UI work complete.

## Playoffs are config-driven

Playoff formats (`none`, `final-only`, `world-cup`, `league`, `custom`) are all
expressed as a single `PlayoffConfig` (`algorithms/playoff-engine.ts`). Presets
are built from the team count and emit the legacy match ids
(`SF-001`/`Q1-001`/`F-001`…) for backward compatibility. Custom brackets are
authored in the setup wizard and validated by `playoff-config-validation.ts`.
The champion is the winner of the match flagged `isFinal` (or the table topper
for `none`).
