import {
  applyResult,
  deriveView,
  loserOf,
  projectChampion,
  undoResult,
} from "../engine";
import type { BeltSession } from "../types";

const base = (overrides: Partial<BeltSession> = {}): BeltSession => ({
  id: "t1",
  name: "Belt Night",
  players: ["Asad", "Ali", "Salman"],
  targetStreak: 3,
  gameCap: 12,
  results: [],
  createdAt: "2026-07-16T00:00:00.000Z",
  ...overrides,
});

describe("hold-the-belt engine", () => {
  it("sets up the opening matchup with the rest waiting", () => {
    const v = deriveView(base());
    expect(v.holder).toBe("Asad");
    expect(v.challenger).toBe("Ali");
    expect(v.queue).toEqual(["Salman"]);
    expect(v.onDeck).toBe("Salman");
    expect(v.streak).toBe(0);
    expect(v.champion).toBeNull();
    expect(v.gamesLeft).toBe(12);
  });

  it("crowns the holder after targetStreak straight wins", () => {
    // Asad beats Ali, then Salman, then Ali again → 3 in a row
    const s = base({
      results: [
        { winner: "Asad", loser: "Ali" },
        { winner: "Asad", loser: "Salman" },
        { winner: "Asad", loser: "Ali" },
      ],
    });
    const v = deriveView(s);
    expect(v.champion).toBe("Asad");
    expect(v.champReason).toBe("streak");
    expect(v.gamesPlayed).toBe(3);
  });

  it("passes the belt when the challenger wins (streak resets to 1)", () => {
    const s = base({
      results: [
        { winner: "Asad", loser: "Ali" }, // Asad streak 1
        { winner: "Salman", loser: "Asad" }, // Salman takes belt, streak 1
      ],
    });
    const v = deriveView(s);
    expect(v.holder).toBe("Salman");
    expect(v.streak).toBe(1);
    // loser Asad went to the back; challenger is now Ali (front of queue)
    expect(v.challenger).toBe("Ali");
  });

  it("decides by longest reign when the game cap is hit", () => {
    // No one ever gets 3 straight; cap at 4. Asad had a 2-reign (longest).
    const s = base({
      targetStreak: 3,
      gameCap: 4,
      results: [
        { winner: "Asad", loser: "Ali" }, // Asad 1
        { winner: "Asad", loser: "Salman" }, // Asad 2  ← longest reign
        { winner: "Ali", loser: "Asad" }, // Ali 1
        { winner: "Salman", loser: "Ali" }, // Salman 1 → cap reached
      ],
    });
    const v = deriveView(s);
    expect(v.champion).toBe("Asad");
    expect(v.champReason).toBe("cap");
    expect(v.longestReign).toEqual({ player: "Asad", streak: 2 });
  });

  it("applyResult appends the correct loser and is a no-op for an invalid winner", () => {
    const s = base();
    const s2 = applyResult(s, "Asad"); // Asad (holder) beats Ali (challenger)
    expect(s2.results).toEqual([{ winner: "Asad", loser: "Ali", note: undefined }]);
    // Salman isn't on the pitch → invalid → unchanged
    expect(applyResult(s, "Salman")).toBe(s);
  });

  it("loserOf resolves the other player on the pitch", () => {
    const v = deriveView(base());
    expect(loserOf(v, "Asad")).toBe("Ali");
    expect(loserOf(v, "Ali")).toBe("Asad");
    expect(loserOf(v, "Salman")).toBeNull();
  });

  it("builds a leader-first standings with per-player longest reign + wins", () => {
    // Asad reigns to 2, then Ali takes the belt.
    const s = base({
      results: [
        { winner: "Asad", loser: "Ali" }, // Asad 1
        { winner: "Asad", loser: "Salman" }, // Asad 2
        { winner: "Ali", loser: "Asad" }, // Ali 1 (belt changes)
      ],
    });
    const v = deriveView(s);
    const asad = v.standings.find((x) => x.player === "Asad")!;
    const ali = v.standings.find((x) => x.player === "Ali")!;

    expect(v.standings[0].player).toBe("Asad"); // leads on longest reign
    expect(v.standings[0].isLeader).toBe(true);
    expect(asad.longestReign).toBe(2);
    expect(asad.totalWins).toBe(2);
    expect(ali.longestReign).toBe(1);
    expect(ali.isHolder).toBe(true); // currently holds
    expect(ali.currentStreak).toBe(1);
  });

  it("projects different champions for each outcome of a decisive last game", () => {
    // target 4, cap 5. After 4 games: Ali holds on a 2-reign; Asad leads the
    // cap tiebreak (also a 2-reign, achieved earlier). The 5th game is the cap.
    const s = base({
      targetStreak: 4,
      gameCap: 5,
      results: [
        { winner: "Asad", loser: "Ali" }, // Asad 1
        { winner: "Asad", loser: "Salman" }, // Asad 2  ← leads
        { winner: "Ali", loser: "Asad" }, // Ali 1
        { winner: "Ali", loser: "Salman" }, // Ali 2
      ],
    });
    const v = deriveView(s);
    expect(v.holder).toBe("Ali");
    expect(v.challenger).toBe("Asad");
    expect(v.gamesLeft).toBe(1);
    expect(v.standings[0].player).toBe("Asad"); // current cap leader

    // If Ali (holder) wins → 3-reign beats Asad's 2 → Ali takes it.
    expect(projectChampion(s, "Ali")).toBe("Ali");
    // If Asad (challenger) wins → cap hit, Asad still has the longest reign.
    expect(projectChampion(s, "Asad")).toBe("Asad");
  });

  it("undo removes the most recent result", () => {
    const s = base({
      results: [
        { winner: "Asad", loser: "Ali" },
        { winner: "Asad", loser: "Salman" },
      ],
    });
    expect(undoResult(s).results).toHaveLength(1);
    expect(undoResult(base()).results).toHaveLength(0);
  });
});
