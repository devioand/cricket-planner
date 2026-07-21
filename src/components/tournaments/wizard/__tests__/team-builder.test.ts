import {
  BENCH,
  buildTeams,
  pruneAssignment,
  teamPlan,
  type Assignment,
} from "../team-builder";

describe("teamPlan", () => {
  it("splits an even count into equal teams", () => {
    expect(teamPlan(18, 2, "bigger")).toEqual({
      caps: Array(9).fill(2),
      benchCap: 0,
    });
    expect(teamPlan(18, 3, "bigger")).toEqual({
      caps: Array(6).fill(3),
      benchCap: 0,
    });
  });

  it("absorbs an odd leftover into the first teams in 'bigger' mode", () => {
    const plan = teamPlan(17, 2, "bigger");
    expect(plan.benchCap).toBe(0);
    expect(plan.caps[0]).toBe(3); // one bigger team
    expect(plan.caps.slice(1)).toEqual(Array(7).fill(2));
    expect(plan.caps.reduce((a, b) => a + b, 0)).toBe(17);
  });

  it("benches the leftover in 'sitout' mode", () => {
    expect(teamPlan(17, 2, "sitout")).toEqual({
      caps: Array(8).fill(2),
      benchCap: 1,
    });
  });

  it("returns no teams when there aren't enough for one", () => {
    expect(teamPlan(1, 2, "bigger")).toEqual({ caps: [], benchCap: 0 });
  });
});

describe("buildTeams", () => {
  const four = ["Asad", "Usman", "Ali", "Hamza"];

  it("resolves a full assignment into composite team names", () => {
    const assign: Assignment = { Asad: 0, Usman: 0, Ali: 1, Hamza: 1 };
    const built = buildTeams(four, 2, "bigger", assign);
    expect(built.teams).toEqual(["Asad + Usman", "Ali + Hamza"]);
    expect(built.complete).toBe(true);
    expect(built.unassigned).toEqual([]);
  });

  it("is incomplete while anyone is unplaced", () => {
    const built = buildTeams(four, 2, "bigger", { Asad: 0 });
    expect(built.complete).toBe(false);
    expect(built.unassigned).toEqual(["Usman", "Ali", "Hamza"]);
  });

  it("honours a benched player in sit-out mode", () => {
    const five = [...four, "Bilal"];
    const assign: Assignment = {
      Asad: 0,
      Usman: 0,
      Ali: 1,
      Hamza: 1,
      Bilal: BENCH,
    };
    const built = buildTeams(five, 2, "sitout", assign);
    expect(built.benched).toEqual(["Bilal"]);
    expect(built.complete).toBe(true);
  });

  it("drops assignments that overflow a team's capacity", () => {
    // Sit-out mode keeps teams at exactly two, so a third player pointed at
    // team 0 can't fit and falls back to unassigned rather than overfilling.
    const built = buildTeams(["Asad", "Usman", "Ali"], 2, "sitout", {
      Asad: 0,
      Usman: 0,
      Ali: 0,
    });
    expect(built.members[0]).toEqual(["Asad", "Usman"]);
    expect(built.unassigned).toEqual(["Ali"]);
  });
});

describe("pruneAssignment", () => {
  it("removes players who are no longer attending", () => {
    const assign: Assignment = { Asad: 0, Usman: 0, Ali: 1 };
    expect(pruneAssignment(assign, ["Asad", "Usman"])).toEqual({
      Asad: 0,
      Usman: 0,
    });
  });

  it("returns the same reference when nothing changed", () => {
    const assign: Assignment = { Asad: 0, Usman: 0 };
    expect(pruneAssignment(assign, ["Asad", "Usman"])).toBe(assign);
  });
});
