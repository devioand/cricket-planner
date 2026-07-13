import { validatePlayoffConfig } from "../playoff-config-validation";
import type { PlayoffConfig } from "../../types";

// The user's valid 5-team example: seed1 byes to the final; 2v3 eliminator.
const validExample: PlayoffConfig = {
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

describe("validatePlayoffConfig", () => {
  it("accepts the valid 5-team example", () => {
    const res = validatePlayoffConfig(validExample, 5);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it("rejects qualifiers below 2", () => {
    const res = validatePlayoffConfig({ ...validExample, qualifiers: 1 }, 5);
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/at least 2/i);
  });

  it("rejects qualifiers exceeding the team count", () => {
    const res = validatePlayoffConfig(validExample, 2);
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/cannot exceed/i);
  });

  it("rejects an empty match list", () => {
    const res = validatePlayoffConfig({ qualifiers: 2, matches: [] }, 4);
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/at least one/i);
  });

  it("rejects a seed outside 1..qualifiers", () => {
    const cfg: PlayoffConfig = {
      qualifiers: 2,
      matches: [
        {
          id: "F-001",
          label: "Final",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "seed", seed: 3 }, // > qualifiers
          isFinal: true,
        },
      ],
    };
    expect(validatePlayoffConfig(cfg, 4).valid).toBe(false);
  });

  it("rejects a dangling match reference", () => {
    const cfg: PlayoffConfig = {
      qualifiers: 2,
      matches: [
        {
          id: "F-001",
          label: "Final",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "winnerOf", matchId: "NOPE" },
          isFinal: true,
        },
      ],
    };
    expect(validatePlayoffConfig(cfg, 4).valid).toBe(false);
  });

  it("rejects a self-reference", () => {
    const cfg: PlayoffConfig = {
      qualifiers: 2,
      matches: [
        {
          id: "F-001",
          label: "Final",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "winnerOf", matchId: "F-001" },
          isFinal: true,
        },
      ],
    };
    expect(validatePlayoffConfig(cfg, 4).valid).toBe(false);
  });

  it("rejects zero finals and multiple finals", () => {
    const noFinal: PlayoffConfig = {
      qualifiers: 2,
      matches: [
        {
          id: "F-001",
          label: "Final",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "seed", seed: 2 },
        },
      ],
    };
    expect(validatePlayoffConfig(noFinal, 4).valid).toBe(false);

    const twoFinals: PlayoffConfig = {
      qualifiers: 4,
      matches: [
        {
          id: "F-001",
          label: "Final A",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "seed", seed: 2 },
          isFinal: true,
        },
        {
          id: "F-002",
          label: "Final B",
          round: 1,
          slot1: { kind: "seed", seed: 3 },
          slot2: { kind: "seed", seed: 4 },
          isFinal: true,
        },
      ],
    };
    expect(validatePlayoffConfig(twoFinals, 4).valid).toBe(false);
  });

  it("rejects a cycle", () => {
    const cfg: PlayoffConfig = {
      qualifiers: 2,
      matches: [
        {
          id: "A",
          label: "A",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "winnerOf", matchId: "B" },
        },
        {
          id: "B",
          label: "B",
          round: 1,
          slot1: { kind: "seed", seed: 2 },
          slot2: { kind: "winnerOf", matchId: "A" },
          isFinal: true,
        },
      ],
    };
    const res = validatePlayoffConfig(cfg, 4);
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/cycle/i);
  });

  it("rejects an orphan match that doesn't feed the final", () => {
    const cfg: PlayoffConfig = {
      qualifiers: 4,
      matches: [
        {
          id: "ORP",
          label: "Orphan",
          round: 1,
          slot1: { kind: "seed", seed: 3 },
          slot2: { kind: "seed", seed: 4 },
        },
        {
          id: "F-001",
          label: "Final",
          round: 2,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "seed", seed: 2 },
          isFinal: true,
        },
      ],
    };
    const res = validatePlayoffConfig(cfg, 4);
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/don't lead to the final/i);
  });

  it("rejects an unused qualifier seed", () => {
    // qualifiers = 3 but seed 3 never appears.
    const cfg: PlayoffConfig = {
      qualifiers: 3,
      matches: [
        {
          id: "F-001",
          label: "Final",
          round: 1,
          slot1: { kind: "seed", seed: 1 },
          slot2: { kind: "seed", seed: 2 },
          isFinal: true,
        },
      ],
    };
    const res = validatePlayoffConfig(cfg, 5);
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/never used/i);
  });
});
