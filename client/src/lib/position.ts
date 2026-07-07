// Gapped-integer positioning. When a card is dropped between two others, its new
// position is the midpoint of the neighbours' positions; dropped at an edge, it
// steps a full gap past the end (or halfway to the start). The frontend computes
// this from the drop target and sends it; the server just stores it.
const GAP = 1000;

export function positionBetween(
  before: number | null,
  after: number | null
): number {
  if (before === null && after === null) return GAP;
  if (before === null) return after! / 2;
  if (after === null) return before + GAP;
  return (before + after) / 2;
}
