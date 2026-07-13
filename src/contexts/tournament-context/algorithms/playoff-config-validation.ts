// Validation for user-authored custom playoff configs.
//
// A config is a small dependency graph: each match's two slots point at either a
// seed (a standings position) or the winner/loser of another match. A config is
// valid when it forms a single knockout that terminates in exactly one final and
// every declared qualifier and every match actually feeds that final.

import type { PlayoffConfig, PlayoffMatchSpec, PlayoffSlot } from "../types";

export interface PlayoffConfigValidation {
  valid: boolean;
  errors: string[];
}

/** Slots that reference another match (as opposed to a standings seed). */
function matchRef(slot: PlayoffSlot): string | null {
  return slot.kind === "winnerOf" || slot.kind === "loserOf"
    ? slot.matchId
    : null;
}

export function validatePlayoffConfig(
  config: PlayoffConfig,
  teamCount: number,
): PlayoffConfigValidation {
  const errors: string[] = [];
  const { qualifiers, matches } = config;

  // 1. Qualifier count within bounds.
  if (!Number.isInteger(qualifiers) || qualifiers < 2) {
    errors.push("At least 2 teams must qualify for the playoffs");
  }
  if (qualifiers > teamCount) {
    errors.push(
      `Qualifiers (${qualifiers}) cannot exceed the number of teams (${teamCount})`,
    );
  }

  // 2. At least one match, unique ids, both slots present.
  if (matches.length === 0) {
    errors.push("Add at least one playoff match");
    return { valid: false, errors };
  }

  const ids = matches.map((m) => m.id);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    errors.push("Playoff matches must have unique ids");
  }

  for (const m of matches) {
    const label = m.label || m.id;
    for (const [pos, slot] of [
      ["1", m.slot1],
      ["2", m.slot2],
    ] as const) {
      // 3. Seeds within [1, qualifiers].
      if (slot.kind === "seed") {
        if (
          !Number.isInteger(slot.seed) ||
          slot.seed < 1 ||
          slot.seed > qualifiers
        ) {
          errors.push(
            `"${label}" side ${pos}: seed ${slot.seed} is outside 1–${qualifiers}`,
          );
        }
      }
      // 4. Match references exist and are not self-references.
      const ref = matchRef(slot);
      if (ref !== null) {
        if (ref === m.id) {
          errors.push(`"${label}" side ${pos}: a match cannot reference itself`);
        } else if (!idSet.has(ref)) {
          errors.push(
            `"${label}" side ${pos}: references unknown match "${ref}"`,
          );
        }
      }
    }
  }

  // 5. Exactly one final.
  const finals = matches.filter((m) => m.isFinal);
  if (finals.length === 0) {
    errors.push("Mark exactly one match as the final");
  } else if (finals.length > 1) {
    errors.push("Only one match can be the final");
  }

  // Bail before graph checks if references are already broken — cycle/reachability
  // analysis assumes every ref resolves to a real match.
  const refsResolve = matches.every((m) =>
    [m.slot1, m.slot2].every((s) => {
      const ref = matchRef(s);
      return ref === null || (ref !== m.id && idSet.has(ref));
    }),
  );

  if (refsResolve) {
    // 6. No cycles (a match cannot transitively depend on itself).
    if (hasCycle(matches)) {
      errors.push("Playoff matches form a cycle — they can never be played");
    } else if (finals.length === 1) {
      // 7. Reachability — every match feeds the final, and seeds 1..qualifiers
      //    all appear somewhere in the bracket.
      const final = finals[0];
      const feeders = matchesFeeding(final.id, matches);
      const orphans = matches.filter((m) => !feeders.has(m.id));
      if (orphans.length > 0) {
        const names = orphans.map((m) => `"${m.label || m.id}"`).join(", ");
        errors.push(`These matches don't lead to the final: ${names}`);
      }

      const usedSeeds = new Set<number>();
      for (const m of matches) {
        for (const s of [m.slot1, m.slot2]) {
          if (s.kind === "seed") usedSeeds.add(s.seed);
        }
      }
      const missing: number[] = [];
      for (let seed = 1; seed <= qualifiers; seed++) {
        if (!usedSeeds.has(seed)) missing.push(seed);
      }
      if (missing.length > 0) {
        errors.push(
          `Qualifier seed(s) ${missing.join(", ")} are never used — every qualifier must play`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** DFS over the "depends on" graph (match → matches its slots reference). */
function hasCycle(matches: PlayoffMatchSpec[]): boolean {
  const deps = new Map<string, string[]>();
  for (const m of matches) {
    const refs: string[] = [];
    for (const s of [m.slot1, m.slot2]) {
      const ref = matchRef(s);
      if (ref !== null) refs.push(ref);
    }
    deps.set(m.id, refs);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const id of deps.keys()) color.set(id, WHITE);

  const visit = (id: string): boolean => {
    color.set(id, GRAY);
    for (const next of deps.get(id) ?? []) {
      const c = color.get(next);
      if (c === GRAY) return true; // back-edge → cycle
      if (c === WHITE && visit(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  };

  for (const id of deps.keys()) {
    if (color.get(id) === WHITE && visit(id)) return true;
  }
  return false;
}

/** All match ids that transitively feed into `targetId` (including itself). */
function matchesFeeding(
  targetId: string,
  matches: PlayoffMatchSpec[],
): Set<string> {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const seen = new Set<string>();

  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const m = byId.get(id);
    if (!m) return;
    for (const s of [m.slot1, m.slot2]) {
      const ref = matchRef(s);
      if (ref !== null) walk(ref);
    }
  };

  walk(targetId);
  return seen;
}
