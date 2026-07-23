import { predictWin, type FormData } from "@/lib/predictions";

describe("predictWin", () => {
  it("returns null when either side has no played history", () => {
    const data: FormData = {
      form: { asad: { played: 4, wins: 2, nrr: 0.6 } },
      h2h: {},
    };
    // b ("newbie") is absent from form.
    expect(predictWin("Asad", "Newbie", data)).toBeNull();
    // a absent too.
    expect(predictWin("Ghost", "Asad", data)).toBeNull();
  });

  it("returns null when a side has played zero matches", () => {
    const data: FormData = {
      form: {
        asad: { played: 4, wins: 2, nrr: 0.6 },
        rookie: { played: 0, wins: 0, nrr: 0 },
      },
      h2h: {},
    };
    expect(predictWin("Asad", "Rookie", data)).toBeNull();
  });

  it("favours the stronger record on form alone", () => {
    const data: FormData = {
      form: {
        ali: { played: 4, wins: 3, nrr: 2 },
        usman: { played: 4, wins: 1, nrr: -6 },
      },
      h2h: {},
    };
    const p = predictWin("Ali", "Usman", data)!;
    expect(p).not.toBeNull();
    expect(p).toBeGreaterThan(0.5);
  });

  it("is symmetric — the two sides' probabilities sum to 1", () => {
    const data: FormData = {
      form: {
        ali: { played: 4, wins: 3, nrr: 2 },
        usman: { played: 4, wins: 1, nrr: -6 },
      },
      h2h: {},
    };
    const ab = predictWin("Ali", "Usman", data)!;
    const ba = predictWin("Usman", "Ali", data)!;
    expect(ab + ba).toBeCloseTo(1, 5);
  });

  it("pulls toward the head-to-head record when they've met", () => {
    // Equal overall form, but A has beaten B in both meetings.
    const data: FormData = {
      form: {
        a: { played: 4, wins: 2, nrr: 0 },
        b: { played: 4, wins: 2, nrr: 0 },
      },
      h2h: { a: { b: 2 } },
    };
    const p = predictWin("A", "B", data)!;
    expect(p).toBeGreaterThan(0.5);
  });

  it("never claims near-certainty (clamped to [0.15, 0.85])", () => {
    const data: FormData = {
      form: {
        god: { played: 10, wins: 10, nrr: 20 },
        minnow: { played: 10, wins: 0, nrr: -20 },
      },
      h2h: { god: { minnow: 10 } },
    };
    const p = predictWin("God", "Minnow", data)!;
    expect(p).toBeLessThanOrEqual(0.85);
    expect(p).toBeGreaterThanOrEqual(0.15);
  });
});
