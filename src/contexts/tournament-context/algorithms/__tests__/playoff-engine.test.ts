import {
  buildPlayoffConfig,
  buildFinalOnlyConfig,
  buildEliminatorFinalConfig,
  buildWorldCupConfig,
  buildLeagueConfig,
  generatePlayoffMatches,
  resolveSeedSlots,
  resolvePlayoffDependencies,
} from "../playoff-engine";
import type { CricketMatchResult, Match, PlayoffConfig } from "../../types";

const OPTS = { maxOvers: 20, maxWickets: 10 };

/** Mark a match completed with the given winner/loser (enough for resolution). */
function complete(matches: Match[], id: string, winner: string): Match[] {
  return matches.map((m) => {
    if (m.id !== id) return m;
    const loser = m.team1 === winner ? m.team2 : m.team1;
    const result = { winner, loser } as CricketMatchResult;
    return { ...m, status: "completed" as const, result };
  });
}

const standings = (names: string[]) => names.map((teamName) => ({ teamName }));

describe("buildPlayoffConfig / presets", () => {
  it("returns null for 'none'", () => {
    expect(buildPlayoffConfig("none", 6, null)).toBeNull();
  });

  it("returns the supplied config for 'custom'", () => {
    const custom: PlayoffConfig = { qualifiers: 2, matches: [] };
    expect(buildPlayoffConfig("custom", 6, custom)).toBe(custom);
  });

  it("world-cup (4+) is SF-001, SF-002, F-001 with legacy shape", () => {
    const config = buildWorldCupConfig(4);
    expect(config.qualifiers).toBe(4);
    expect(config.matches.map((m) => m.id)).toEqual([
      "SF-001",
      "SF-002",
      "F-001",
    ]);
    const [sf1, sf2, final] = config.matches;
    expect(sf1.slot1).toEqual({ kind: "seed", seed: 1 });
    expect(sf1.slot2).toEqual({ kind: "seed", seed: 4 });
    expect(sf2.slot1).toEqual({ kind: "seed", seed: 2 });
    expect(sf2.slot2).toEqual({ kind: "seed", seed: 3 });
    expect(final.slot1).toEqual({ kind: "winnerOf", matchId: "SF-001" });
    expect(final.slot2).toEqual({ kind: "winnerOf", matchId: "SF-002" });
    expect(final.isFinal).toBe(true);
    expect(final.round).toBe(2);
  });

  it("league (4+) is Q1-001, E-001, Q2-001, F-001 with legacy shape", () => {
    const config = buildLeagueConfig(4);
    expect(config.matches.map((m) => m.id)).toEqual([
      "Q1-001",
      "E-001",
      "Q2-001",
      "F-001",
    ]);
    const q2 = config.matches.find((m) => m.id === "Q2-001")!;
    expect(q2.slot1).toEqual({ kind: "loserOf", matchId: "Q1-001" });
    expect(q2.slot2).toEqual({ kind: "winnerOf", matchId: "E-001" });
    const final = config.matches.find((m) => m.isFinal)!;
    expect(final.id).toBe("F-001");
  });

  it("world-cup and league degrade to a single final at 3 teams", () => {
    for (const config of [buildWorldCupConfig(3), buildLeagueConfig(3)]) {
      expect(config.matches).toHaveLength(1);
      expect(config.matches[0].id).toBe("F-001");
      expect(config.matches[0].isFinal).toBe(true);
    }
  });
});

describe("generatePlayoffMatches", () => {
  it("creates TBD scheduled matches carrying label/isFinal/round", () => {
    const matches = generatePlayoffMatches(buildWorldCupConfig(4), OPTS);
    expect(matches).toHaveLength(3);
    for (const m of matches) {
      expect(m.team1).toBe("TBD");
      expect(m.team2).toBe("TBD");
      expect(m.status).toBe("scheduled");
      expect(m.isPlayoff).toBe(true);
      expect(m.phase).toBe("playoffs");
      expect(m.overs).toBe(20);
    }
    const final = matches.find((m) => m.id === "F-001")!;
    expect(final.isFinal).toBe(true);
    expect(final.label).toBe("Final");
    expect(final.playoffType).toBe("final");
  });
});

describe("resolveSeedSlots", () => {
  it("fills seed slots from standings", () => {
    const config = buildWorldCupConfig(4);
    const matches = generatePlayoffMatches(config, OPTS);
    const table = standings(["A", "B", "C", "D"]);
    const { matches: seeded, changed } = resolveSeedSlots(
      matches,
      config,
      table,
    );
    expect(changed).toBe(true);
    const sf1 = seeded.find((m) => m.id === "SF-001")!;
    expect(sf1.team1).toBe("A"); // seed 1
    expect(sf1.team2).toBe("D"); // seed 4
    const final = seeded.find((m) => m.id === "F-001")!;
    expect(final.team1).toBe("TBD"); // winnerOf — not a seed
  });
});

describe("resolvePlayoffDependencies", () => {
  it("fills winner/loser slots once referenced matches complete (to a fixed point)", () => {
    const config = buildLeagueConfig(4);
    let matches = generatePlayoffMatches(config, OPTS);
    matches = resolveSeedSlots(matches, config, standings(["A", "B", "C", "D"]))
      .matches;

    // Q1 (A v B) → A wins; E (C v D) → C wins.
    matches = complete(matches, "Q1-001", "A");
    matches = complete(matches, "E-001", "C");
    matches = resolvePlayoffDependencies(matches, config).matches;

    const q2 = matches.find((m) => m.id === "Q2-001")!;
    expect(q2.team1).toBe("B"); // loser of Q1
    expect(q2.team2).toBe("C"); // winner of Eliminator
    const final = matches.find((m) => m.id === "F-001")!;
    expect(final.team1).toBe("A"); // winner of Q1
    expect(final.team2).toBe("TBD"); // waiting on Q2
  });
});

describe("custom bracket (user's 5-team example)", () => {
  // Top seed byes to the final; seeds 2 and 3 play an eliminator whose winner
  // joins the final.
  const custom: PlayoffConfig = {
    qualifiers: 3,
    matches: [
      {
        id: "PO-001",
        label: "Eliminator",
        round: 1,
        slot1: { kind: "seed", seed: 2 },
        slot2: { kind: "seed", seed: 3 },
      },
      {
        id: "F-001",
        label: "Final",
        round: 2,
        slot1: { kind: "seed", seed: 1 },
        slot2: { kind: "winnerOf", matchId: "PO-001" },
        isFinal: true,
      },
    ],
  };

  it("seeds the eliminator and final, then resolves the final from the eliminator winner", () => {
    let matches = generatePlayoffMatches(custom, OPTS);
    matches = resolveSeedSlots(
      matches,
      custom,
      standings(["A", "B", "C", "D", "E"]),
    ).matches;

    const elim = matches.find((m) => m.id === "PO-001")!;
    expect([elim.team1, elim.team2]).toEqual(["B", "C"]);
    const final0 = matches.find((m) => m.id === "F-001")!;
    expect(final0.team1).toBe("A"); // seed 1 bye
    expect(final0.team2).toBe("TBD");

    matches = complete(matches, "PO-001", "C");
    matches = resolvePlayoffDependencies(matches, custom).matches;
    const final = matches.find((m) => m.id === "F-001")!;
    expect(final.team1).toBe("A");
    expect(final.team2).toBe("C");
  });
});

describe("buildEliminatorFinalConfig (top 3)", () => {
  it("is a 2v3 eliminator whose winner meets seed 1 in the final", () => {
    const config = buildEliminatorFinalConfig();
    expect(config.qualifiers).toBe(3);
    expect(config.matches.map((m) => m.id)).toEqual(["E-001", "F-001"]);

    let matches = generatePlayoffMatches(config, OPTS);
    matches = resolveSeedSlots(matches, config, standings(["A", "B", "C"]))
      .matches;
    const elim = matches.find((m) => m.id === "E-001")!;
    expect([elim.team1, elim.team2]).toEqual(["B", "C"]); // seeds 2, 3
    const final0 = matches.find((m) => m.isFinal)!;
    expect(final0.team1).toBe("A"); // seed 1 bye
    expect(final0.team2).toBe("TBD");

    matches = complete(matches, "E-001", "C");
    matches = resolvePlayoffDependencies(matches, config).matches;
    expect(matches.find((m) => m.isFinal)!.team2).toBe("C");
  });
});

describe("buildFinalOnlyConfig", () => {
  it("is a single seed1-vs-seed2 final", () => {
    const config = buildFinalOnlyConfig();
    expect(config.qualifiers).toBe(2);
    expect(config.matches).toHaveLength(1);
    expect(config.matches[0].slot1).toEqual({ kind: "seed", seed: 1 });
    expect(config.matches[0].slot2).toEqual({ kind: "seed", seed: 2 });
    expect(config.matches[0].isFinal).toBe(true);
  });
});
