import { describe, it, expect } from "vitest";
import { placeByLocator, POSITION_GAP } from "@/utils/positioning.js";

// A tiny stand-in for a column: an ordered list of { id, position }. Applying a
// placement mutates it exactly as the service + repository would.
type Item = { id: string; position: number };

function apply(list: Item[], id: string, locator: number): Item[] {
  const placement = placeByLocator(
    list.map((i) => i.position),
    locator
  );
  if (placement.type === "single") {
    const next = [...list, { id, position: placement.position }];
    return next.sort((a, b) => a.position - b.position);
  }
  const order = [...list];
  order.splice(placement.movedIndex, 0, { id, position: 0 });
  return order.map((item, i) => ({
    ...item,
    position: placement.positions[i]!,
  }));
}

// The client's midpoint math — the source of the fractional locators.
const midpoint = (before: number | null, after: number | null) =>
  before === null
    ? after! / 2
    : after === null
      ? before + POSITION_GAP
      : (before + after) / 2;

function assertHealthy(list: Item[]) {
  const positions = list.map((i) => i.position);
  for (const p of positions) {
    expect(Number.isInteger(p)).toBe(true);
  }
  expect(new Set(positions).size).toBe(positions.length); // no collisions
  const sorted = [...positions].sort((a, b) => a - b);
  expect(positions).toEqual(sorted); // list stays in position order
}

describe("placeByLocator", () => {
  it("keeps positions integer and unique across many inserts between the same two items", () => {
    // Start with two neighbours a full gap apart.
    let list: Item[] = [
      { id: "a", position: 1000 },
      { id: "b", position: 2000 },
    ];

    // Repeatedly drop a fresh card between the first two items — the exact
    // pattern that drives the naive midpoint scheme fractional (1500, 1250,
    // 1125 … 1000.5). After enough inserts the neighbours become integer-
    // adjacent and the server must re-sequence to make room.
    for (let n = 0; n < 200; n++) {
      const before = list[0]!.position;
      const after = list[1]!.position;
      list = apply(list, `x${n}`, midpoint(before, after));
      assertHealthy(list);
    }

    expect(list.length).toBe(202);
    // The most-recent insert is still wedged between the original first item
    // and its old neighbour — order preserved throughout.
    expect(list[0]!.id).toBe("a");
  });

  it("uses the gap without re-sequencing when there is room", () => {
    const placement = placeByLocator([1000, 2000], 1500);
    expect(placement).toEqual({ type: "single", position: 1500 });
  });

  it("re-sequences when neighbours are integer-adjacent", () => {
    const placement = placeByLocator([1000, 1001], 1000.5);
    expect(placement.type).toBe("resequence");
    if (placement.type === "resequence") {
      expect(placement.positions).toEqual([1000, 2000, 3000]);
      expect(placement.movedIndex).toBe(1);
    }
  });

  it("places the first item of an empty list at the gap", () => {
    expect(placeByLocator([], 12345)).toEqual({
      type: "single",
      position: POSITION_GAP,
    });
  });

  it("appends past the end", () => {
    expect(placeByLocator([1000, 2000], 3000)).toEqual({
      type: "single",
      position: 3000,
    });
  });

  it("finds room before the first item", () => {
    expect(placeByLocator([1000, 2000], 500)).toEqual({
      type: "single",
      position: 500,
    });
  });
});
