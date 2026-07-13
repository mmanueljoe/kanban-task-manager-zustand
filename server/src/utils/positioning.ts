// Gapped-integer ordering, decided server-side.
//
// The client sends a *locator* — a number it computed as "somewhere between the
// two neighbours I dropped this card between" (it uses plain midpoints, so the
// locator is frequently fractional). The server never stores that number. It
// uses it only to work out which slot the item landed in, then assigns a real
// integer position from the gap between the neighbours actually in the list.
//
// Most drops land in a gap, so only the moved row changes ("single"). When the
// neighbours are integer-adjacent there's no room left between them, so we
// re-sequence the whole list with fresh gaps ("resequence"). Positions can
// therefore never collide or go fractional, no matter how many times cards are
// dropped between the same two neighbours.
export const POSITION_GAP = 1000;

export type Placement =
  | { type: "single"; position: number }
  | { type: "resequence"; positions: number[]; movedIndex: number };

// `siblings` are the positions already in the list (ascending), excluding the
// item being placed. `locator` is the client's where-between hint.
export function placeByLocator(siblings: number[], locator: number): Placement {
  const index = siblings.filter((p) => p < locator).length;
  const before = index > 0 ? siblings[index - 1]! : null;
  const after = index < siblings.length ? siblings[index]! : null;

  const slot = integerBetween(before, after);
  if (slot !== null) return { type: "single", position: slot };

  // No integer room between the neighbours — rebuild the whole list, spacing
  // everything a full gap apart, with the moved item spliced in at `index`.
  const total = siblings.length + 1;
  const positions = Array.from(
    { length: total },
    (_, i) => (i + 1) * POSITION_GAP
  );
  return { type: "resequence", positions, movedIndex: index };
}

// The integer to drop between two neighbours, or null when there's no room.
function integerBetween(
  before: number | null,
  after: number | null
): number | null {
  if (before === null && after === null) return POSITION_GAP;
  if (before === null) {
    // Insert at the front: any positive integer strictly below `after`.
    const slot = Math.floor(after! / 2);
    return slot > 0 && slot < after! ? slot : null;
  }
  if (after === null) return before + POSITION_GAP; // append past the end
  if (after - before >= 2) return before + Math.floor((after - before) / 2);
  return null; // neighbours are adjacent (or equal) — no gap
}
