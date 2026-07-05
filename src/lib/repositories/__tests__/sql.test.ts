import { buildValues } from "@/lib/repositories/sql";

describe("buildValues", () => {
  it("returns empty placeholders and params for no rows", () => {
    expect(buildValues([])).toEqual({ placeholders: "", params: [] });
  });

  it("numbers placeholders sequentially across a single row", () => {
    expect(buildValues([[10, 20]])).toEqual({
      placeholders: "($1, $2)",
      params: [10, 20],
    });
  });

  it("continues numbering across multiple rows", () => {
    const { placeholders, params } = buildValues([
      ["a", 1, true],
      ["b", 2, false],
    ]);
    expect(placeholders).toBe("($1, $2, $3), ($4, $5, $6)");
    expect(params).toEqual(["a", 1, true, "b", 2, false]);
  });

  it("preserves null and mixed types in order", () => {
    const { placeholders, params } = buildValues([
      [null, "x"],
      [3, null],
    ]);
    expect(placeholders).toBe("($1, $2), ($3, $4)");
    expect(params).toEqual([null, "x", 3, null]);
  });

  it("keeps param count exactly rows × columns", () => {
    const rows = Array.from({ length: 15 }, (_, i) => [i, `t${i}`, i * 2]);
    const { params } = buildValues(rows);
    expect(params).toHaveLength(15 * 3);
  });
});
