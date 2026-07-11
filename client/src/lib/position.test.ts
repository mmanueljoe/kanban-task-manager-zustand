import { describe, it, expect } from "vitest";
import { positionBetween } from "@/lib/position";

describe("positionBetween", () => {
  it("returns the gap for the first item in an empty list", () => {
    expect(positionBetween(null, null)).toBe(1000);
  });

  it("halves toward the start when dropping before the first item", () => {
    expect(positionBetween(null, 1000)).toBe(500);
  });

  it("steps a full gap past the end when dropping last", () => {
    expect(positionBetween(1000, null)).toBe(2000);
  });

  it("takes the midpoint between two neighbours", () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
  });

  it("still finds room between very close neighbours", () => {
    const p = positionBetween(1000, 1001);
    expect(p).toBeGreaterThan(1000);
    expect(p).toBeLessThan(1001);
  });
});
