// Generic, config-driven playoff engine.
//
// A single set of pure functions drives every playoff format. Each format is
// just a `PlayoffConfig` — an ordered list of match specs whose two slots each
// resolve to a concrete team, either from the round-robin standings (`seed`) or
// from the outcome of an earlier playoff match (`winnerOf` / `loserOf`).
//
// The "world-cup", "league" and "final-only" presets are expressed as configs
// built from the team count (see the builders below), so they share this one
// generator + resolver instead of each maintaining its own bracket logic.
//
// Backward compatibility: the preset builders emit the SAME match ids as the
// old hardcoded generators (SF-001, SF-002, F-001, Q1-001, E-001, Q2-001) so
// in-progress tournaments and snapshot tests stay byte-identical.

import type {
  Match,
  PlayoffConfig,
  PlayoffFormat,
  PlayoffMatchSpec,
  PlayoffSlot,
  TournamentState,
} from "../types";
import { getTournamentStandings } from "./cricket-stats";

const TBD = "TBD";

// ── Round-robin / gating helpers (moved from the old playoffs.ts) ─────────────

/** True once every non-playoff match has been played (and at least one exists). */
export function isRoundRobinComplete(state: TournamentState): boolean {
  const roundRobinMatches = state.matches.filter((match) => !match.isPlayoff);
  const incomplete = roundRobinMatches.filter((m) => m.status === "scheduled");
  return incomplete.length === 0 && roundRobinMatches.length > 0;
}

/** Whether playoffs can be generated (round robin complete + enough teams + not already generated). */
export function canGeneratePlayoffs(state: TournamentState): {
  canGenerate: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!isRoundRobinComplete(state)) {
    reasons.push("Round robin phase must be completed first");
  }
  if (getTournamentStandings(state.teamStats).length < 3) {
    reasons.push("Minimum 3 teams required for playoffs");
  }
  if (state.matches.some((m) => m.isPlayoff)) {
    reasons.push("Playoffs already generated");
  }

  return { canGenerate: reasons.length === 0, reasons };
}

// ── Preset config builders ────────────────────────────────────────────────────

/**
 * Resolve a `PlayoffFormat` (+ team count) into a concrete `PlayoffConfig`.
 * Returns `null` for "none" (no playoff matches — champion is the table topper).
 * For "custom", returns the caller-supplied config unchanged.
 */
export function buildPlayoffConfig(
  format: PlayoffFormat,
  teamCount: number,
  custom: PlayoffConfig | null,
): PlayoffConfig | null {
  switch (format) {
    case "none":
      return null;
    case "final-only":
      return buildFinalOnlyConfig();
    case "world-cup":
      return buildWorldCupConfig(teamCount);
    case "league":
      return buildLeagueConfig(teamCount);
    case "custom":
      return custom;
    default:
      return null;
  }
}

/** Top 2 → a single final. */
export function buildFinalOnlyConfig(): PlayoffConfig {
  return {
    qualifiers: 2,
    matches: [
      {
        id: "F-001",
        label: "Final",
        round: 1,
        slot1: { kind: "seed", seed: 1 },
        slot2: { kind: "seed", seed: 2 },
        isFinal: true,
        playoffType: "final",
      },
    ],
  };
}

/** Top 3: a 2-v-3 eliminator whose winner faces the top seed in the final. */
export function buildEliminatorFinalConfig(): PlayoffConfig {
  return {
    qualifiers: 3,
    matches: [
      {
        id: "E-001",
        label: "Eliminator",
        round: 1,
        slot1: { kind: "seed", seed: 2 },
        slot2: { kind: "seed", seed: 3 },
        playoffType: "eliminator",
      },
      {
        id: "F-001",
        label: "Final",
        round: 2,
        slot1: { kind: "seed", seed: 1 },
        slot2: { kind: "winnerOf", matchId: "E-001" },
        isFinal: true,
        playoffType: "final",
      },
    ],
  };
}

/** World Cup style: SF1 (1v4), SF2 (2v3), Final. Degrades to a direct final at 3 teams. */
export function buildWorldCupConfig(teamCount: number): PlayoffConfig {
  if (teamCount < 4) return buildFinalOnlyConfig();
  return {
    qualifiers: 4,
    matches: [
      {
        id: "SF-001",
        label: "Semi-Final 1",
        round: 1,
        slot1: { kind: "seed", seed: 1 },
        slot2: { kind: "seed", seed: 4 },
        playoffType: "semi-final-1",
      },
      {
        id: "SF-002",
        label: "Semi-Final 2",
        round: 1,
        slot1: { kind: "seed", seed: 2 },
        slot2: { kind: "seed", seed: 3 },
        playoffType: "semi-final-2",
      },
      {
        id: "F-001",
        label: "Final",
        round: 2,
        slot1: { kind: "winnerOf", matchId: "SF-001" },
        slot2: { kind: "winnerOf", matchId: "SF-002" },
        isFinal: true,
        playoffType: "final",
      },
    ],
  };
}

/** IPL/League style: Q1 (1v2), Eliminator (3v4), Q2 (loser Q1 v winner Elim), Final. Direct final at 3 teams. */
export function buildLeagueConfig(teamCount: number): PlayoffConfig {
  if (teamCount < 4) return buildFinalOnlyConfig();
  return {
    qualifiers: 4,
    matches: [
      {
        id: "Q1-001",
        label: "Qualifier 1",
        round: 1,
        slot1: { kind: "seed", seed: 1 },
        slot2: { kind: "seed", seed: 2 },
        playoffType: "qualifier-1",
      },
      {
        id: "E-001",
        label: "Eliminator",
        round: 1,
        slot1: { kind: "seed", seed: 3 },
        slot2: { kind: "seed", seed: 4 },
        playoffType: "eliminator",
      },
      {
        id: "Q2-001",
        label: "Qualifier 2",
        round: 2,
        slot1: { kind: "loserOf", matchId: "Q1-001" },
        slot2: { kind: "winnerOf", matchId: "E-001" },
        playoffType: "qualifier-2",
      },
      {
        id: "F-001",
        label: "Final",
        round: 3,
        slot1: { kind: "winnerOf", matchId: "Q1-001" },
        slot2: { kind: "winnerOf", matchId: "Q2-001" },
        isFinal: true,
        playoffType: "final",
      },
    ],
  };
}

// ── Match generation ──────────────────────────────────────────────────────────

/** Turn a config into TBD playoff matches (all `scheduled`), preserving spec order. */
export function generatePlayoffMatches(
  config: PlayoffConfig,
  opts: { maxOvers: number; maxWickets: number },
): Match[] {
  return config.matches.map((spec) => specToMatch(spec, opts));
}

function specToMatch(
  spec: PlayoffMatchSpec,
  opts: { maxOvers: number; maxWickets: number },
): Match {
  return {
    id: spec.id,
    team1: TBD,
    team2: TBD,
    round: spec.round,
    status: "scheduled",
    overs: opts.maxOvers,
    maxWickets: opts.maxWickets,
    isPlayoff: true,
    playoffType: spec.playoffType,
    label: spec.label,
    isFinal: spec.isFinal ?? false,
    phase: "playoffs",
  };
}

// ── Resolution ────────────────────────────────────────────────────────────────

type SlotKind = PlayoffSlot["kind"];

/**
 * Resolve a single slot to a concrete team name, or `null` if it can't be
 * resolved yet. `seed` slots need `standings`; `winnerOf`/`loserOf` need the
 * referenced match to be completed.
 */
function resolveSlot(
  slot: PlayoffSlot,
  byId: Record<string, Match>,
  standings: { teamName: string }[] | null,
): string | null {
  switch (slot.kind) {
    case "seed":
      if (!standings) return null;
      return standings[slot.seed - 1]?.teamName ?? null;
    case "winnerOf": {
      const ref = byId[slot.matchId];
      return ref?.status === "completed" ? ref.result?.winner ?? null : null;
    }
    case "loserOf": {
      const ref = byId[slot.matchId];
      return ref?.status === "completed" ? ref.result?.loser ?? null : null;
    }
    default:
      return null;
  }
}

/**
 * Core resolver: fill every TBD slot it can, restricted to the given slot kinds.
 * Iterates to a fixed point so chained dependencies settle in one call.
 */
function applyResolution(
  matches: Match[],
  config: PlayoffConfig,
  opts: { standings?: { teamName: string }[] | null; kinds: SlotKind[] },
): { matches: Match[]; changed: boolean } {
  const specById = new Map(config.matches.map((s) => [s.id, s]));
  const kinds = new Set(opts.kinds);
  const standings = opts.standings ?? null;

  let current = matches;
  let changedOverall = false;

  for (;;) {
    const byId: Record<string, Match> = {};
    for (const m of current) byId[m.id] = m;

    let changedThisPass = false;
    const next = current.map((m) => {
      const spec = specById.get(m.id);
      if (!spec) return m;

      let updated = m;
      if (updated.team1 === TBD && kinds.has(spec.slot1.kind)) {
        const team = resolveSlot(spec.slot1, byId, standings);
        if (team) {
          updated = { ...updated, team1: team };
          changedThisPass = true;
        }
      }
      if (updated.team2 === TBD && kinds.has(spec.slot2.kind)) {
        const team = resolveSlot(spec.slot2, byId, standings);
        if (team) {
          updated = { ...updated, team2: team };
          changedThisPass = true;
        }
      }
      return updated;
    });

    current = next;
    if (!changedThisPass) break;
    changedOverall = true;
  }

  return { matches: current, changed: changedOverall };
}

/**
 * Fill `seed` slots from the final round-robin standings. Call once the group
 * stage is complete.
 */
export function resolveSeedSlots(
  matches: Match[],
  config: PlayoffConfig,
  standings: { teamName: string }[],
): { matches: Match[]; changed: boolean } {
  return applyResolution(matches, config, { standings, kinds: ["seed"] });
}

/**
 * Fill `winnerOf` / `loserOf` slots from completed playoff matches. Call after
 * each playoff match completes.
 */
export function resolvePlayoffDependencies(
  matches: Match[],
  config: PlayoffConfig,
): { matches: Match[]; changed: boolean } {
  return applyResolution(matches, config, { kinds: ["winnerOf", "loserOf"] });
}
