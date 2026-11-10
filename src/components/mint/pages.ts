/**
 * The Mint issue, page by page: [front, back] of each leaf, top of the
 * closed stack first. Each leaf is the right page of one spread on its front
 * and the left page of the next on its back. LAST_RIGHT is glued down onto
 * the back cover, so the issue ends open on its final spread.
 *
 * Spreads 108 to 112 are the published story. 113 to 118 are behind the
 * scenes shots that didn't make it in: each landscape one across a whole
 * spread (113, 115, 117, 118), the portrait ones a page each (114, 116).
 *
 * Images in public/mint/pages (desktop) and public/mint/pages-sm (phones).
 */
export const LEAVES: [string, string][] = [
  ["cover", "108l"],
  ["108r", "109l"],
  ["109r", "110l"],
  ["110r", "111l"],
  ["111r", "112l"],
  ["112r", "113l"],
  ["113r", "114l"],
  ["114r", "115l"],
  ["115r", "116l"],
  ["116r", "117l"],
  ["117r", "118l"],
];
export const LAST_RIGHT = "118r";
