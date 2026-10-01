/**
 * The reel's arithmetic: easing, springs, colour.
 *
 * Everything in the reel is a pure function of one clock, in seconds, so the
 * easing has to be analytic rather than a physics simulation stepped frame
 * by frame. These are that: closed-form curves that overshoot and settle the
 * way a spring does, so any frame of the loop can be drawn on its own — which
 * is also what lets it loop without drift.
 */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 0 before a, 1 after b, linear between. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/**
 * A damped spring from 0 to 1.
 *
 * `bounce` from 0 to 1 is how far past the target it swings: about 13% at a
 * quarter, 21% at a half, 37% at one. Position moves use a little; things
 * popping into place use a lot. It lands exactly on 1 at u = 1 — the decay
 * leaves under a percent of the swing by then, and it is clamped so a frame
 * sampled after the end is at rest rather than still wobbling.
 */
export function spring(u: number, bounce = 0.4) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const w = 8 + 8 * bounce;
  const d = 7 - 2 * bounce;
  return 1 - Math.exp(-d * u) * Math.cos(w * u);
}

export const easeIn = (u: number) => u * u;
export const easeOut = (u: number) => 1 - (1 - u) * (1 - u);
export const easeInOut = (u: number) =>
  u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);

/**
 * Smoother than easeInOut at both ends: it leaves and arrives at no speed at
 * all, so whatever it moves sets down rather than lands.
 */
export const glide = (u: number) => {
  const c = clamp01(u);
  return c * c * c * (c * (6 * c - 15) + 10);
};

/**
 * Something let go of: falls with gravity, turns as it goes, fades out.
 * `u` is time since release over the fall's length.
 */
export function fall(u: number, spin: number) {
  const c = clamp01(u);
  return { dy: 900 * c * c, rot: spin * c, opacity: 1 - clamp01((c - 0.35) / 0.45) };
}

/**
 * A gravity bounce, for the people on the website: up, and dropping back
 * faster than it rose, the way something tossed does. `u` loops 0 to 1.
 */
export function hop(u: number) {
  const f = u - Math.floor(u);
  return Math.sin(Math.PI * f);
}

/** Two hex colours mixed, `u` of the way from a to b. */
export function mix(a: string, b: string, u: number) {
  const k = clamp01(u);
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((x, i) => Math.round(x + (pb[i] - x) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** A box on the stage, in px, and how many px one of its design units is. */
export type Box = { x: number; y: number; s: number };

/** Somewhere in a box, in stage px. */
export const at = (b: Box, x: number, y: number) => ({ x: b.x + x * b.s, y: b.y + y * b.s });

/** A box scaled `z` times about a point on the stage: the camera leaning in. */
export function zoom(b: Box, fx: number, fy: number, z: number): Box {
  return { x: fx + (b.x - fx) * z, y: fy + (b.y - fy) * z, s: b.s * z };
}

/** Two boxes blended; `u` may overshoot 1, which is the spring. */
export const between = (a: Box, b: Box, u: number): Box => ({
  x: lerp(a.x, b.x, u),
  y: lerp(a.y, b.y, u),
  s: lerp(a.s, b.s, u),
});

/** The transform that puts design unit (0, 0) of a box at its place. */
export const place = (b: Box, rot = 0) =>
  `translate(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px) scale(${b.s.toFixed(5)})${
    rot ? ` rotate(${rot.toFixed(2)}deg)` : ""
  }`;
