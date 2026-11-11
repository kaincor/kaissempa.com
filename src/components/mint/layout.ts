import { LEAVES } from "./pages";

/**
 * The magazine's measurements and the camera's framing, shared by the 3D
 * scene and the page around it (which needs to know how tall the cover comes
 * out on screen without loading three.js). Plain numbers only.
 */

/** 8.5 x 11 in, in metres; the width follows Kai's spreads, 3036 x 4116. */
export const PAGE_H = 0.279;
export const PAGE_W = (PAGE_H * 3036) / 4116;
/** Paper thickness, exaggerated a touch so the stacks read. */
export const LEAF_T = 0.0014;
/** The back cover board under the right-hand stack. */
export const BASE_T = 0.0022;
/** Height of the closed cover above the back cover, in the book's frame. */
export const COVER_Y = BASE_T + LEAVES.length * LEAF_T + 0.0004;
export const FOV = 35;

const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

/** How far back the camera sits so the open spread fits with room round it. */
export function fitDistance(aspect: number) {
  const wide = 2 * PAGE_W * (aspect < 0.8 ? 1.05 : 1.4);
  const tall = PAGE_H * (aspect < 0.8 ? 1.4 : 1.42);
  return Math.max(wide / (2 * TAN * aspect), tall / (2 * TAN));
}

/** The closed cover's height on screen, square on, as a share of the screen's height. */
export function coverShare(aspect: number) {
  return PAGE_H / (2 * TAN * (fitDistance(aspect) - COVER_Y));
}
