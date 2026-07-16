import { BeltStore } from "../belt-store";
import { deriveView } from "../engine";

describe("BeltStore (localStorage persistence)", () => {
  beforeEach(() => window.localStorage.clear());

  it("creates + persists a session that can be loaded back", () => {
    const s = BeltStore.create({
      name: "Friday Belt",
      players: ["Asad", "Ali", "Salman"],
      targetStreak: 3,
      gameCap: 12,
    });
    const loaded = BeltStore.load(s.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.players).toEqual(["Asad", "Ali", "Salman"]);
    expect(BeltStore.load("no-such-id")).toBeNull();
  });

  it("plays through to a champion and persists each result", () => {
    const created = BeltStore.create({
      name: "X",
      players: ["Asad", "Ali", "Salman"],
      targetStreak: 3,
      gameCap: 12,
    });
    const store = new BeltStore(BeltStore.load(created.id)!);

    store.recordWinner("Asad"); // beats Ali
    store.recordWinner("Asad"); // beats Salman
    store.recordWinner("Asad"); // beats Ali → 3 straight

    expect(deriveView(store.getSnapshot()).champion).toBe("Asad");
    // persisted to localStorage, not just in memory
    expect(deriveView(BeltStore.load(created.id)!).champion).toBe("Asad");
  });

  it("undo reverts the last result and notifies subscribers", () => {
    const created = BeltStore.create({
      name: "X",
      players: ["Asad", "Ali", "Salman"],
      targetStreak: 3,
      gameCap: 12,
    });
    const store = new BeltStore(BeltStore.load(created.id)!);
    let notifications = 0;
    store.subscribe(() => notifications++);

    store.recordWinner("Asad");
    store.recordWinner("Asad");
    store.recordWinner("Asad");
    expect(deriveView(store.getSnapshot()).champion).toBe("Asad");

    store.undo();
    expect(deriveView(store.getSnapshot()).champion).toBeNull();
    expect(notifications).toBe(4); // 3 wins + 1 undo
  });

  it("reset clears results back to the opening matchup", () => {
    const created = BeltStore.create({
      name: "X",
      players: ["Asad", "Ali", "Salman"],
      targetStreak: 3,
      gameCap: 12,
    });
    const store = new BeltStore(BeltStore.load(created.id)!);
    store.recordWinner("Asad");
    store.reset();
    expect(store.getSnapshot().results).toHaveLength(0);
    expect(deriveView(store.getSnapshot()).holder).toBe("Asad");
  });
});
