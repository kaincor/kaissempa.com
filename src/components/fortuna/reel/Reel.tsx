"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AppChrome, BigCard, CREAM, FOREST, GREEN, JOBS, MiniCard, ORANGE } from "./cards";
import { SPLASH_DOTS } from "./dots";
import { at, between, clamp01, easeIn, easeOut, fall, glide, hop, lerp, mix, place, seg, spring, zoom, type Box } from "./motion";
import { PHONE_BODY } from "./phone-shape";
import { DOT, DOT_BESIDE_F, GLYPHS } from "./wordmark";

/**
 * The first time Fortuna is shown: a looping reel of the website, the app's
 * three steps, and the splash screen, and round again.
 *
 *   0.0   The splash's phone moves into the website and the page opens out
 *         of its screen; everything on the page bounces into place.
 *   1.5   "Swipe right to find your next job in" types four kinds of work,
 *         one after another, and the job cards step along with each.
 *   9.35  The page falls away and closes into the orange flow promo, the
 *         wordmark dropping "ortuna" and walking its full stop over to sit
 *         beside the f in the corner.
 *  10.3   Job search made easy: create your bio, swipe through jobs, get hired.
 *  14.7   The promo's panel closes, with everything on it, into the phone's screen,
 *         on green: the splash. The f. comes to the middle, hops, and the
 *         full stop rolls right; each letter jumps up as it makes room, the
 *         way the logo's own reel does it.
 *  18.6   Round again, from the splash into the website.
 *
 * The thread is the wordmark, and it is one element the whole way round,
 * as the phone is and as the page behind it is: a card that is the phone's
 * screen, then the website's page, then the flow promo's panel, then the
 * phone's screen again. Nothing is swapped for a lookalike.
 *
 * Bouncy throughout. Every arrival is a spring that overshoots and settles;
 * the only things that are not are the things falling away.
 *
 * All of it is drawn from a single clock by one function, writing styles
 * straight to the elements rather than through React state, because there
 * are well over a hundred moving parts and a render per frame for each
 * would be the whole budget. Any moment of the loop can be drawn on its
 * own, which is what makes it loop cleanly.
 */

/** One time round, in seconds. */
const LOOP = 18.6;

/** The stage's colour for each scene. */
const STAGE = { splash: GREEN, flow: ORANGE, web: "#6f8b81" };

/** The flow promo's panel, and the website's page. */
const FLOW_PAPER = "#f2f0eb";
const WEB_PAPER = CREAM;
/** The website's logo is the dark cut of the mark. */
const MARK_DARK = "#32443e";

/**
 * How far a dashed ring turns in one loop: about `deg`, rounded to a whole
 * number of dash periods. A dashed circle looks the same after turning one
 * period, so a whole number of them leaves the loop with no seam.
 */
function turn(deg: number, dash: number, r: number) {
  const p = ((dash * 2) / r) * (180 / Math.PI);
  return Math.max(1, Math.round(deg / p)) * p;
}

/**
 * The splash's dashed rings. Radii and opacities are the frame's own; each
 * turns at its own pace, the inner ones fastest, so they visibly slide
 * against one another.
 */
const SPLASH_RINGS = [
  { r: 250.754, o: 1, deg: 210 },
  { r: 331.316, o: 0.8, deg: 175 },
  { r: 411.877, o: 0.6, deg: 145 },
  { r: 492.439, o: 0.5, deg: 120 },
  { r: 573, o: 0.3, deg: 95 },
].map((ring) => ({ ...ring, deg: turn(ring.deg, 8, ring.r) }));

/** A number in [0, 1) that is the same every time for the same inputs. */
function rand(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Each dot's own small orbit. Two waves at different whole numbers of cycles
 * per loop trace a loop or a figure of eight that differs from dot to dot,
 * some one way round and some the other, so no two wander together. Whole
 * numbers of cycles keep the loop seamless. `start` is when, as a share of
 * its scene's window, the dot fades in.
 */
type Wander = { ax: number; ay: number; kx: number; ky: number; px: number; py: number; start: number };
function wander(i: number, salt: number, amp: number): Wander {
  const way = rand(i, salt + 1) < 0.5 ? -1 : 1;
  return {
    ax: amp * (0.5 + rand(i, salt + 2)),
    ay: amp * (0.5 + rand(i, salt + 3)),
    kx: way * (3 + Math.floor(rand(i, salt + 4) * 4)),
    ky: 3 + Math.floor(rand(i, salt + 5) * 4),
    px: rand(i, salt + 6) * 2 * Math.PI,
    py: rand(i, salt + 7) * 2 * Math.PI,
    start: rand(i, salt + 8),
  };
}
const drift = (w: Wander, t: number) => ({
  x: w.ax * Math.sin((2 * Math.PI * w.kx * t) / LOOP + w.px),
  y: w.ay * Math.cos((2 * Math.PI * w.ky * t) / LOOP + w.py),
});
const SPLASH_WANDER = SPLASH_DOTS.map((_, i) => wander(i, 1, 8));

/**
 * When everything happens, in seconds round the loop.
 *
 * All of the choreography reads off this table, so the pacing can be retuned
 * here rather than hunted through the drawing code below.
 */
const T = {
  // The splash into the website: the phone moves into the page, and the
  // page opens out of its screen.
  toWeb: [0, 1.0],
  screenSwap: [0.15, 0.55],
  markToWeb: [0.05, 0.95],
  darken: [0.1, 0.6],
  webIn: 0.25,
  // The website away, into the flow promo.
  webDrop: 9.35,
  toFlow: [9.45, 10.45],
  letterDrop: 9.4,
  dotOver: [9.6, 10.3],
  markToFlow: [9.55, 10.45],
  greenAgain: [9.6, 10.1],
  // The flow promo and its three steps in turn.
  flowTitle: 10.3,
  parts: [10.55, 11.65, 12.75],
  bioName: [10.9, 11.3],
  bioEdu: [11.35, 11.75],
  bioPills: [11.75, 12.15],
  swipeOut: [12.15, 12.6],
  swipeBack: [12.7, 13.3],
  hirePills: [13.1, 13.45],
  hired: [13.45, 13.95],
  confetti: [13.52, 14.4],
  // The flow promo closing into the phone's screen: the splash.
  toSplash: [14.7, 15.6],
  phoneIn: [15.15, 15.6],
  ringsIn: [15.3, 16.0],
  markToSplash: [14.75, 15.6],
  // The wordmark spelling itself out: the f hops, the full stop rolls.
  hop: 15.62,
  roll: [15.68, 16.04],
  dotsIn: [15.8, 17.2],
} as const;

/**
 * The website's headline types the kind of work, four of them. Each word is
 * typed and underlined; all but the last are deleted again. The job cards
 * step along with each new word. `under` is when its underline shows,
 * `del` when it goes.
 */
const SECTORS = [
  { word: "Hospitality", type: [1.5, 2.2], under: [2.25, 3.0], del: [3.15, 3.5] },
  { word: "Retail", type: [3.6, 4.0], under: [4.05, 4.8], del: [4.95, 5.2] },
  { word: "Food Service", type: [5.3, 6.0], under: [6.05, 6.8], del: [6.95, 7.35] },
  { word: "Healthcare", type: [7.45, 8.1], under: [8.15, 99], del: [99, 99] },
] as const;
const SLOTS = SECTORS.map((s) => s.under[0]);

/** Stage colour changes, each [from, to, start, end]. */
const STAGE_CHANGES: [string, string, number, number][] = [
  [STAGE.splash, STAGE.web, 0.02, 0.55],
  [STAGE.web, STAGE.flow, 9.45, 10.0],
  [STAGE.flow, STAGE.splash, 14.75, 15.3],
];

const FLOW_WORDS = ["Job", "search", "made", "easy"];
const STEPS = ["Create your bio", "Swipe through jobs", "Get hired"];
const STEP_X = [64, 496, 928];

/**
 * The flow promo's bio forms, in a column's own units (it is 368 square).
 * The attribute pills are the frame's; the bio fills them in its greens,
 * getting hired fills them all.
 */
const PILLS = [
  { x: 152, w: 36 },
  { x: 192, w: 55 },
  { x: 251, w: 66 },
];
const PILL_PALE = "#d9eed0";
const BIO_FILLS = ["#6abd46", "#8fcd73", "#b3dda1"];
const BIO_NAME = "Jessica Lambert";
const BIO_EDU = "Miami Dade College";
/** Where the Hired stamp lands, over the right column's form. */
const HIRED_AT = { x: 240, y: 228 };

/** The burst round the Hired stamp: which way each piece flies, how far. */
const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const a = -Math.PI / 2 + (rand(i, 31) - 0.5) * Math.PI * 1.7;
  return {
    dx: Math.cos(a) * (110 + rand(i, 32) * 140),
    dy: Math.sin(a) * (100 + rand(i, 32) * 110),
    spin: (rand(i, 33) < 0.5 ? -1 : 1) * (200 + rand(i, 34) * 400),
    w: rand(i, 35) < 0.4 ? 11 : 10 + rand(i, 36) * 9,
    h: rand(i, 35) < 0.4 ? 11 : 6,
    round: rand(i, 35) < 0.4,
    colour: [GREEN, ORANGE, FOREST, "#b3dda1"][i % 4],
    delay: rand(i, 37) * 0.08,
  };
});

/** The website's people: where they sit, how big, the colour of their ring. */
const PEOPLE = [
  { src: "/fortuna/reel/person-man.webp", x: 152, y: 270, d: 140, ring: GREEN, phase: 0 },
  { src: "/fortuna/reel/person-woman.webp", x: 1053, y: 612, d: 104, ring: FOREST, phase: 0.33 },
  { src: "/fortuna/reel/person-chef.webp", x: 1268, y: 166, d: 80, ring: ORANGE, phase: 0.66 },
];

/**
 * Where a card sits along the website's reel at position q. Slot 2 is behind
 * the phone, which shows that job large; -1 and 5 are just off each edge.
 */
const SLOT_X = [-303.1, 0, 303.1, 645.5, 983, 1286.1, 1589.2];
function slotX(q: number) {
  if (q >= 5) return 1589.2 + (q - 5) * 303.1;
  const i = Math.floor(q) + 1;
  const f = q - Math.floor(q);
  return lerp(SLOT_X[i], SLOT_X[Math.min(i + 1, SLOT_X.length - 1)], f);
}

/** How far the reel has stepped along at a moment: each step is a spring. */
function slotsMoved(t: number) {
  return SLOTS.reduce((n, s) => n + spring(seg(t, s, s + 0.8), 0.3), 0);
}

/**
 * The wordmark's jump, off the logo reference: [seconds since the letter
 * appeared, height below the baseline in x-heights]. It comes in low, rises
 * fast and slows, hangs a fifth of an x-height up, then drops onto the line
 * with no bounce back.
 */
const LIFT: [number, number][] = [
  [0, 0.31],
  [0.067, 0.31],
  [0.1, 0.157],
  [0.133, 0.056],
  [0.167, -0.034],
  [0.2, -0.09],
  [0.233, -0.135],
  [0.267, -0.169],
  [0.3, -0.19],
  [0.333, -0.2],
  [0.4, -0.2],
  [0.433, -0.18],
  [0.467, -0.124],
  [0.5, -0.022],
  [0.533, 0],
];
const X_HEIGHT = 28.3;
const BASE = 40.8;
/**
 * The f is already standing when it hops, so it joins the jump where the
 * curve crosses the baseline, rather than coming up from below it.
 */
const HOP_FROM = 0.15;

/** How far below the baseline, in wordmark units, `s` seconds into a jump. */
function lift(s: number) {
  if (s <= 0) return LIFT[0][1] * X_HEIGHT;
  for (let i = 1; i < LIFT.length; i++) {
    const [t1, y1] = LIFT[i];
    if (s <= t1) {
      const [t0, y0] = LIFT[i - 1];
      const u = (s - t0) / (t1 - t0);
      return lerp(y0, y1, u * u * (3 - 2 * u)) * X_HEIGHT;
    }
  }
  return 0;
}

/** The full stop's roll from beside the f to after the a: 1 beside, 0 after. */
function besideF(t: number) {
  const u = seg(t, ...T.roll);
  return Math.pow(1 - u, 1.6);
}

/** The moment each of "ortuna" appears: the full stop has just made room. */
const POPS = GLYPHS.slice(1).map((g) => {
  for (let t: number = T.roll[0]; t <= T.roll[1]; t += 0.002) {
    const left = 200.645 + DOT_BESIDE_F * besideF(t) - 5.37;
    if (left > g.x1 - 6) return t;
  }
  return T.roll[1];
});

function fit(dw: number, dh: number, maxW: number, maxH: number, W: number, H: number): Box {
  const s = Math.min(maxW / dw, maxH / dh);
  return { x: (W - dw * s) / 2, y: (H - dh * s) / 2, s };
}

function stageColour(t: number) {
  for (const [a, b, s, e] of STAGE_CHANGES) {
    if (t < s) return a;
    if (t <= e) return mix(a, b, (t - s) / (e - s));
  }
  return STAGE.splash;
}

type El = HTMLElement | SVGElement;
type Reg = (key: string) => (el: El | null) => void;
type Rect = { x: number; y: number; w: number; h: number; r: number };

export default function Reel() {
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 1200, H: 800 });
  const els = useRef<Record<string, El>>({});
  const last = useRef<Record<string, string>>({});
  const clock = useRef(0);
  const onScreen = useInView(stage, { amount: 0.3 });

  const reg = useCallback<Reg>(
    (key: string) => (el: El | null) => {
      if (el) els.current[key] = el;
      else delete els.current[key];
    },
    [],
  );

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setSize({ W: el.clientWidth, H: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Writes a style only when it has changed: most parts are still on most
  // frames, and a style write is not free even when the value is the same.
  const draw = useCallback(
    (t: number) => {
      const { W, H } = size;
      const e = els.current;
      const cache = last.current;
      const css = (key: string, prop: string, value: string) => {
        const el = e[key];
        if (!el) return;
        const k = key + "|" + prop;
        if (cache[k] === value) return;
        cache[k] = value;
        (el.style as unknown as Record<string, string>)[prop] = value;
      };
      const attr = (key: string, name: string, value: string) => {
        const el = e[key];
        if (!el) return;
        const k = key + "@" + name;
        if (cache[k] === value) return;
        cache[k] = value;
        el.setAttribute(name, value);
      };
      const text = (key: string, value: string) => {
        const el = e[key];
        if (!el) return;
        const k = key + "#";
        if (cache[k] === value) return;
        cache[k] = value;
        el.textContent = value;
      };
      const show = (key: string, o: number) => css(key, "opacity", clamp01(o).toFixed(3));

      // ── The three layouts, fitted to the stage ─────────────────────────
      const splash = fit(415, 838, W * 0.86, H * 0.74, W, H);
      const flow = fit(1360, 695, W * 0.92, H * 0.72, W, H);
      const web = fit(1525, 1487, W * 0.94, H * 0.9, W, H);

      // Each new stage colour opens as a circle from the middle, rather than
      // mixing through the muddy colours between two brand colours.
      {
        const c = STAGE_CHANGES.find(([, , s0, e0]) => t >= s0 && t < e0);
        const R = Math.hypot(W, H) / 2;
        css("stage", "background", c ? c[0] : stageColour(t));
        css("wipe", "background", c ? c[1] : "transparent");
        css("wipe", "clipPath", `circle(${c ? (easeIn(seg(t, c[2], c[3])) * R).toFixed(1) : 0}px at 50% 50%)`);
      }

      // ── The phone ──────────────────────────────────────────────────────
      // From the splash into the website; it falls away with the page, and
      // comes back round the flow promo's panel as that closes into its
      // screen.
      const webPhone: Box = { ...at(web, 558, 592), s: web.s };
      let phone: Box = splash;
      let phoneRot = 0;
      let phoneO = 1;
      if (t < T.toWeb[1]) phone = between(splash, webPhone, spring(seg(t, ...T.toWeb), 0.24));
      else if (t < T.webDrop + 0.2) phone = webPhone;
      else if (t < T.toSplash[0]) {
        const f = fall((t - T.webDrop - 0.2) / 0.8, 8);
        phone = { ...webPhone, y: webPhone.y + f.dy * web.s };
        phoneRot = f.rot;
        phoneO = f.opacity;
      } else {
        const u = spring(seg(t, ...T.phoneIn), 0.35);
        const mid = at(splash, 207.5, 419);
        phone = zoom(splash, mid.x, mid.y, lerp(1.07, 1, u));
        phoneO = seg(t, T.phoneIn[0], T.phoneIn[0] + 0.2);
      }
      css("phone", "transform", place(phone, phoneRot));
      show("phone", phoneO);

      // What the phone's screen shows: the splash's rings and dots, or the
      // website's swipe card.
      const splashScreen = t < T.toWeb[1] ? 1 - seg(t, ...T.screenSwap) : t >= T.toSplash[0] ? 1 : 0;
      show("ph-rings", t >= T.toSplash[0] ? seg(t, ...T.ringsIn) : splashScreen);
      SPLASH_RINGS.forEach((ring, i) => {
        attr(`ph-ring-${i}`, "transform", `rotate(${((t / LOOP) * ring.deg).toFixed(3)} 187 364)`);
      });
      // The dots fade up where they stand, each at its own moment, and each
      // wanders its own small orbit.
      SPLASH_WANDER.forEach((w, i) => {
        const d = drift(w, t);
        attr(`ph-dot-${i}`, "transform", `translate(${d.x.toFixed(2)} ${d.y.toFixed(2)})`);
        const s0 = lerp(T.dotsIn[0], T.dotsIn[1] - 0.5, w.start);
        show(`ph-dot-${i}`, t >= T.toSplash[0] ? seg(t, s0, s0 + 0.5) : splashScreen);
      });

      // The website's screen, with the slot machine running through it.
      show("ph-web", t < T.toSplash[0] ? seg(t, ...T.screenSwap) : 0);
      const moved = slotsMoved(t);
      for (let j = 0; j < 5; j++) {
        const q = ((((j - moved + 1) % 5) + 5) % 5) - 1;
        const dx = (q - 2) * 360;
        css(`ph-big-${j}`, "transform", `translate(${(30 + dx).toFixed(2)}px, 123px)`);
        show(`ph-big-${j}`, Math.abs(q - 2) < 1.2 ? 1 : 0);
      }

      // ── The card that morphs: phone screen, web page, flow panel ───────
      let card: Rect = { x: 0, y: 0, w: 0, h: 0, r: 0 };
      {
        const screen: Rect = { x: splash.x + 20 * splash.s, y: splash.y + 18 * splash.s, w: 375 * splash.s, h: 801 * splash.s, r: 44 * splash.s };
        const flowRect: Rect = { x: flow.x, y: flow.y, w: 1360 * flow.s, h: 695 * flow.s, r: 36 * flow.s };
        const webRect: Rect = { x: web.x + 43 * web.s, y: web.y, w: 1440 * web.s, h: 1369 * web.s, r: 30 * web.s };
        const blend = (a: Rect, b: Rect, u: number): Rect => ({
          x: lerp(a.x, b.x, u),
          y: lerp(a.y, b.y, u),
          w: lerp(a.w, b.w, u),
          h: lerp(a.h, b.h, u),
          r: lerp(a.r, b.r, clamp01(u)),
        });
        let rect = screen;
        let colour = WEB_PAPER;
        if (t < T.toWeb[1]) rect = blend(screen, webRect, spring(seg(t, ...T.toWeb), 0.28));
        else if (t < T.toFlow[0]) rect = webRect;
        else if (t < T.toSplash[0]) {
          rect = blend(webRect, flowRect, spring(seg(t, ...T.toFlow), 0.28));
          colour = mix(WEB_PAPER, FLOW_PAPER, seg(t, T.toFlow[0], T.toFlow[0] + 0.5));
        } else {
          rect = blend(flowRect, screen, spring(seg(t, ...T.toSplash), 0.2));
          colour = mix(FLOW_PAPER, CREAM, seg(t, ...T.toSplash));
        }
        card = rect;
        css("card", "transform", `translate(${rect.x.toFixed(1)}px, ${rect.y.toFixed(1)}px)`);
        css("card", "width", `${Math.max(0, rect.w).toFixed(1)}px`);
        css("card", "height", `${Math.max(0, rect.h).toFixed(1)}px`);
        css("card", "borderRadius", `${Math.max(0, rect.r).toFixed(1)}px`);
        css("card", "background", colour);
      }

      // ── The flow promo ─────────────────────────────────────────────────
      {
        // It closes with its panel into the phone's screen, fading as it
        // goes, rather than leaving anything outside the phone.
        const on = t >= T.flowTitle - 0.2 && t < T.toSplash[1];
        let box = flow;
        if (t >= T.toSplash[0]) {
          const mid = { x: card.x + card.w / 2, y: card.y + card.h / 2 };
          const s = card.w / 1360;
          box = { x: mid.x - 680 * s, y: mid.y - 347.5 * s, s };
        }
        css("flow", "transform", place(box));
        show("flow", on ? 1 - seg(t, T.toSplash[0], T.toSplash[0] + 0.35) : 0);
        const out = (extra = "") => ({ tr: extra, o: 1 });
        FLOW_WORDS.forEach((_, i) => {
          const s0 = T.flowTitle + i * 0.08;
          const u = spring(seg(t, s0, s0 + 0.6), 0.55);
          const f = out();
          css(`fw-${i}`, "transform", `translateY(${((1 - u) * -70).toFixed(1)}px) ${f.tr}`);
          show(`fw-${i}`, seg(t, s0, s0 + 0.12) * f.o);
        });
        const pop = (key: string, s0: number, fromY: number) => {
          const u = spring(seg(t, s0, s0 + 0.7), 0.5);
          const f = out();
          css(key, "transform", `translateY(${((1 - u) * fromY).toFixed(1)}px) scale(${lerp(0.9, 1, u).toFixed(3)}) ${f.tr}`);
          show(key, seg(t, s0, s0 + 0.2) * f.o);
        };
        // A field typing itself in, its caret showing while it does.
        const typeInto = (key: string, words: string, [a, b]: readonly [number, number]) => {
          text(key, words.slice(0, Math.floor(seg(t, a, b) * words.length + 1e-6)));
          show(`${key}-caret`, t >= a - 0.1 && t < b + 0.3 ? 1 : 0);
        };
        const fillPills = (key: string, [a, b]: readonly [number, number]) => {
          const step = (b - a) / PILLS.length;
          PILLS.forEach((_, i) => {
            const s0 = a + i * step;
            css(`${key}-${i}`, "transform", `scaleX(${easeOut(seg(t, s0, s0 + step + 0.1)).toFixed(3)})`);
          });
        };

        // One: create your bio. The form fills itself in.
        pop("fcol-0", T.parts[0], 90);
        pop("ft-0", T.parts[0] + 0.12, 50);
        typeInto("bio-name", BIO_NAME, T.bioName);
        typeInto("bio-edu", BIO_EDU, T.bioEdu);
        fillPills("bio-pill", T.bioPills);

        // Two: swipe through jobs. The Cook card gets a tick and is swiped
        // away, and the next one is dealt into its place.
        pop("fmid-fork", T.parts[1], 90);
        {
          const s0 = T.parts[1] + 0.14;
          const f = out();
          let x = 0;
          let y = 0;
          let rot = 0;
          let sc = 1;
          let o = 1;
          if (t < T.swipeOut[0]) {
            const u = spring(seg(t, s0, s0 + 0.7), 0.5);
            y = (1 - u) * 90;
            rot = (1 - u) * -14;
            sc = lerp(0.9, 1, u);
            o = seg(t, s0, s0 + 0.2);
          } else if (t < T.swipeBack[0]) {
            const u = easeIn(seg(t, ...T.swipeOut));
            x = u * 520;
            y = -u * 40;
            rot = u * 24;
            o = 1 - seg(t, T.swipeOut[0] + 0.25, T.swipeOut[1]);
          } else {
            const u = spring(seg(t, ...T.swipeBack), 0.5);
            y = (1 - u) * 90;
            rot = (1 - u) * -14;
            sc = lerp(0.9, 1, u);
            o = seg(t, T.swipeBack[0], T.swipeBack[0] + 0.15);
          }
          css("fmid-cook", "transform", `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(2)}deg) ${f.tr}`);
          show("fmid-cook", o * f.o);
          const like = spring(seg(t, T.swipeOut[0] - 0.3, T.swipeOut[0] + 0.15), 0.6);
          css("cook-like", "transform", `scale(${like.toFixed(3)})`);
          show("cook-like", t >= T.swipeOut[0] - 0.3 && t < T.swipeBack[0] ? 1 : 0);
        }
        pop("ft-1", T.parts[1] + 0.12, 50);

        // Three: get hired. The attributes fill, the stamp comes down, and
        // the confetti goes up.
        pop("fcol-2", T.parts[2], 90);
        pop("ft-2", T.parts[2] + 0.12, 50);
        fillPills("hire-pill", T.hirePills);
        {
          const u = spring(seg(t, ...T.hired), 0.55);
          css("hired", "transform", `rotate(${lerp(-18, -6, u).toFixed(2)}deg) scale(${lerp(1.8, 1, u).toFixed(3)})`);
          show("hired", seg(t, T.hired[0], T.hired[0] + 0.1));
        }
        CONFETTI.forEach((c, i) => {
          const u = seg(t, T.confetti[0] + c.delay, T.confetti[1]);
          const p = easeOut(u);
          const x = c.dx * p;
          const y = c.dy * p + 120 * u * u;
          css(`conf-${i}`, "transform", `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(c.spin * u).toFixed(1)}deg)`);
          show(`conf-${i}`, u > 0 && u < 1 ? 1 - seg(u, 0.6, 1) : 0);
        });
      }

      // ── The website ────────────────────────────────────────────────────
      {
        const on = t < T.toFlow[1];
        css("web", "transform", place(web));
        show("web", on ? 1 : 0);
        // Everything drops in from above, bouncing, and falls away at the
        // end, one after another.
        let n = 0;
        const away = () => {
          const u = (t - (T.webDrop + n * 0.04)) / 0.8;
          n++;
          if (u <= 0) return { tr: "", o: 1 };
          const f = fall(u, (n % 2 ? 1 : -1) * 14);
          return { tr: ` translateY(${f.dy.toFixed(1)}px) rotate(${f.rot.toFixed(2)}deg)`, o: f.opacity };
        };
        const drop = (key: string, d: number, from = -520, bounce = 0.4) => {
          const s0 = T.webIn + d;
          const u = spring(seg(t, s0, s0 + 0.75), bounce);
          const f = away();
          css(key, "transform", `translateY(${((1 - u) * from).toFixed(1)}px)${f.tr}`);
          show(key, seg(t, s0, s0 + 0.12) * f.o);
        };
        drop("w-nav", 0.05);
        drop("w-dl", 0.1);
        drop("w-h1", 0.18);
        drop("w-h2", 0.26);
        drop("w-h3", 0.34);
        drop("w-sub", 0.42);
        drop("w-cta", 0.5, -520, 0.55);
        // The kind of work, typed and deleted. The caret holds solid while it
        // types and blinks while it waits, as a real one does.
        let busy = false;
        SECTORS.forEach((s, w) => {
          const L = s.word.length;
          let shown = 0;
          if (t >= s.type[0] && t < s.type[1]) {
            shown = Math.floor(seg(t, s.type[0], s.type[1]) * L + 1e-6);
            busy = true;
          } else if (t >= s.type[1] && t < s.del[0]) shown = L;
          else if (t >= s.del[0] && t < s.del[1]) {
            shown = L - Math.floor(seg(t, s.del[0], s.del[1]) * L + 1e-6);
            busy = true;
          }
          css(`w-word-${w}`, "display", shown > 0 ? "inline-block" : "none");
          for (let i = 0; i < L; i++) {
            const onCh = i < shown;
            css(`w-s-${w}-${i}`, "display", onCh ? "inline-block" : "none");
            if (onCh) {
              const s0 = s.type[0] + (i / L) * (s.type[1] - s.type[0]);
              css(`w-s-${w}-${i}`, "transform", `translateY(${((1 - spring(seg(t, s0, s0 + 0.35), 0.6)) * -30).toFixed(1)}px)`);
            }
          }
          show(`w-under-${w}`, seg(t, s.under[0], s.under[0] + 0.25) * (1 - seg(t, s.under[1], s.under[1] + 0.15)));
        });
        const caretOn = t >= SECTORS[0].type[0] - 0.3 && t < T.webDrop;
        show("w-caret", caretOn ? (busy || Math.floor(t * 2.6) % 2 === 0 ? 1 : 0.15) : 0);
        PEOPLE.forEach((p, i) => {
          const s0 = T.webIn + 0.3 + i * 0.1;
          const u = spring(seg(t, s0, s0 + 0.8), 0.5);
          const bounce = -22 * hop(t / 1.6 + p.phase) * seg(t, s0 + 0.6, s0 + 1.0);
          const f = away();
          css(`w-p-${i}`, "transform", `translateY(${((1 - u) * -560 + bounce).toFixed(1)}px)${f.tr}`);
          show(`w-p-${i}`, seg(t, s0, s0 + 0.12) * f.o);
        });
        const f = away();
        for (let j = 0; j < 10; j++) {
          const q = ((((j - moved + 1) % 10) + 10) % 10) - 1;
          const s0 = T.webIn + 0.55 + Math.max(0, Math.min(5, q + 1)) * 0.06;
          const u = spring(seg(t, s0, s0 + 0.8), 0.4);
          css(`w-c-${j}`, "transform", `translate(${slotX(q).toFixed(1)}px, ${(15 + (1 - u) * -700).toFixed(1)}px)${f.tr}`);
          show(`w-c-${j}`, q < 5.2 ? seg(t, s0, s0 + 0.12) * f.o : 0);
        }
      }

      // ── The wordmark: the thread through all three ─────────────────────
      {
        const splashMark: Box = { ...at(splash, 104, 364), s: splash.s };
        const flowMark: Box = { ...at(flow, 1280, 32), s: flow.s * 0.9768 };
        const webMark: Box = { ...at(web, 107, 49), s: (web.s * 131.22) / 206 };
        let box = splashMark;
        let colour = GREEN;
        let dot = 0;
        let dotLift = 0;
        let fLift = 0;
        const letters = GLYPHS.map(() => ({ tr: "translate(0 0)", o: 1 }));
        if (t < T.letterDrop) {
          box = between(splashMark, webMark, spring(seg(t, ...T.markToWeb), 0.3));
          colour = mix(GREEN, MARK_DARK, seg(t, ...T.darken));
        } else if (t < T.markToSplash[0]) {
          // "ortuna" falls off, and the full stop walks over to the f.
          box = between(webMark, flowMark, spring(seg(t, ...T.markToFlow), 0.3));
          colour = mix(MARK_DARK, GREEN, seg(t, ...T.greenAgain));
          const v = seg(t, ...T.dotOver);
          dot = glide(v);
          dotLift = -10 * Math.sin(Math.PI * v);
          GLYPHS.forEach((g, i) => {
            if (i === 0) return;
            const u = (t - (T.letterDrop + (i - 1) * 0.05)) / 0.9;
            if (u <= 0) return;
            const f = fall(u, (i % 2 ? 1 : -1) * (30 + i * 6));
            const cx = (g.x0 + g.x1) / 2;
            letters[i] = { tr: `translate(0 ${(f.dy / 6).toFixed(2)}) rotate(${f.rot.toFixed(2)} ${cx} 20)`, o: f.opacity };
          });
        } else {
          // The f. comes to the middle of the splash, hops, and spells the
          // rest of the word out as the full stop rolls away from it.
          box = between(flowMark, splashMark, spring(seg(t, ...T.markToSplash), 0.3));
          dot = besideF(t);
          if (t >= T.hop) fLift = lift(t - T.hop + HOP_FROM);
          dotLift = fLift;
          GLYPHS.forEach((g, i) => {
            if (i === 0) return;
            const since = t - POPS[i - 1];
            if (since < 0) {
              letters[i] = { tr: "scale(0)", o: 0 };
              return;
            }
            // It widens into being over two frames, as the reference's do.
            const w = easeOut(clamp01(since / 0.07));
            const h = lerp(0.72, 1, w);
            const cx = (g.x0 + g.x1) / 2;
            letters[i] = {
              tr: `translate(${cx.toFixed(2)} ${(BASE + lift(since)).toFixed(3)}) scale(${w.toFixed(4)} ${h.toFixed(4)}) translate(${(-cx).toFixed(2)} ${-BASE})`,
              o: 1,
            };
          });
          letters[0] = { tr: `translate(0 ${fLift.toFixed(3)})`, o: 1 };
        }
        css("mark", "transform", place(box));
        attr("mark", "fill", colour);
        attr("mk-dot", "transform", `translate(${(DOT_BESIDE_F * dot).toFixed(2)} ${dotLift.toFixed(2)})`);
        letters.forEach((l, i) => {
          attr(`mk-g-${i}`, "transform", l.tr);
          attr(`mk-g-${i}`, "opacity", clamp01(l.o).toFixed(3));
        });
      }
    },
    [size],
  );

  // The clock. Started and stopped with the section's visibility; each step
  // is capped so returning to the tab does not skip whole scenes.
  useEffect(() => {
    if (reduced) {
      draw(2.6);
      return;
    }
    draw(clock.current);
    if (!onScreen) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      clock.current = (clock.current + dt) % LOOP;
      draw(clock.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduced, draw]);

  const abs = { position: "absolute", left: 0, top: 0, transformOrigin: "0 0" } as const;

  return (
    <div
      ref={stage}
      aria-label="Fortuna's website, its three steps, and its splash screen, round and round"
      role="img"
      style={{
        position: "relative",
        // No taller than one and a half times its width. On a phone a full
        // screen height let the splash's phone fill the whole of it while
        // the wide flow promo, limited by the screen's width, shrank to a
        // strip in the middle: the scenes swung in size far more than they
        // do in the frames. A shorter stage brings the tall scenes down to
        // meet the wide ones. On a desktop the width never binds.
        height: "min(100svh, 150vw)",
        maxHeight: 980,
        minHeight: 520,
        overflow: "hidden",
        background: STAGE.splash,
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginTop: "clamp(40px, 7vh, 80px)",
      }}
    >
      <div ref={reg("stage")} style={{ position: "absolute", inset: 0 }} />
      <div ref={reg("wipe")} style={{ position: "absolute", inset: 0 }} />

      {/* ── The morphing card ── */}
      <div ref={reg("card")} style={{ ...abs, boxShadow: "0 24px 60px rgba(20, 30, 27, 0.18)" }} />

      {/* ── The flow promo, 1360 x 695 ── */}
      <div ref={reg("flow")} style={{ ...abs, width: 1360, height: 695, opacity: 0 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 66,
            textAlign: "center",
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 55.7,
            letterSpacing: "-0.02em",
            color: FOREST,
          }}
        >
          {FLOW_WORDS.map((w, i) => (
            <span key={w} ref={reg(`fw-${i}`)} style={{ display: "inline-block", marginRight: i < FLOW_WORDS.length - 1 ? "0.24em" : 0, opacity: 0 }}>
              {w}
            </span>
          ))}
        </div>
        <FlowPart k="fcol-0" reg={reg} src="/fortuna/reel/flow-left.webp" x={64} y={191} w={368} h={368}>
          <Field k="bio-name" reg={reg} y={166} />
          <Field k="bio-edu" reg={reg} y={224} />
          <Pills k="bio-pill" reg={reg} fills={BIO_FILLS} />
        </FlowPart>
        <FlowPart k="fmid-fork" reg={reg} src="/fortuna/reel/flow-forklift.webp" x={597} y={226} w={220} h={250} />
        <FlowPart k="fmid-cook" reg={reg} src="/fortuna/reel/flow-cook.webp" x={518} y={289.94} w={277.2} h={298.4}>
          <div ref={reg("cook-like")} style={{ position: "absolute", left: 182, top: 34, width: 48, height: 48, borderRadius: "50%", background: GREEN, display: "grid", placeItems: "center", boxShadow: "0 6px 16px rgba(40, 80, 30, 0.3)", opacity: 0 }}>
            <Tick size={26} />
          </div>
        </FlowPart>
        <FlowPart k="fcol-2" reg={reg} src="/fortuna/reel/flow-right.webp" x={928} y={191} w={368} h={368}>
          <Field y={166}>{BIO_NAME}</Field>
          <Field y={224}>{BIO_EDU}</Field>
          <Pills k="hire-pill" reg={reg} fills={[BIO_FILLS[0], BIO_FILLS[0], BIO_FILLS[0]]} />
          {CONFETTI.map((c, i) => (
            <div
              key={i}
              ref={reg(`conf-${i}`)}
              style={{
                position: "absolute",
                left: HIRED_AT.x - c.w / 2,
                top: HIRED_AT.y - c.h / 2,
                width: c.w,
                height: c.h,
                borderRadius: c.round ? "50%" : 1.5,
                background: c.colour,
                opacity: 0,
              }}
            />
          ))}
          <div
            ref={reg("hired")}
            style={{
              position: "absolute",
              left: HIRED_AT.x - 74,
              top: HIRED_AT.y - 26,
              width: 148,
              height: 52,
              borderRadius: 14,
              background: GREEN,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--f-body)",
              fontSize: 25,
              fontWeight: 600,
              boxShadow: "0 10px 24px rgba(40, 80, 30, 0.28)",
              opacity: 0,
            }}
          >
            <Tick size={24} />
            Hired
          </div>
        </FlowPart>
        {STEPS.map((s, i) => (
          <div
            key={s}
            ref={reg(`ft-${i}`)}
            style={{
              position: "absolute",
              left: STEP_X[i],
              top: 592,
              width: 368,
              textAlign: "center",
              fontFamily: "var(--f-body)",
              fontWeight: 600,
              fontSize: 28.5,
              letterSpacing: "-0.01em",
              color: FOREST,
              opacity: 0,
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* ── The website, 1525 x 1487 ── */}
      <div ref={reg("web")} style={{ ...abs, width: 1525, height: 1487, opacity: 0 }}>
        <div ref={reg("w-nav")} style={{ position: "absolute", left: 620, top: 34, width: 287, height: 56, borderRadius: 28, background: "#fff", boxShadow: "0 4px 14px rgba(40,40,30,0.06)", fontFamily: "var(--f-body)", fontSize: 15.5, fontWeight: 500, color: FOREST, opacity: 0 }}>
          <div style={{ position: "absolute", left: 8, top: 8, width: 141, height: 40, borderRadius: 20, border: `2px solid ${FOREST}`, display: "grid", placeItems: "center" }}>Job Seekers</div>
          <div style={{ position: "absolute", left: 149, top: 8, width: 130, height: 40, display: "grid", placeItems: "center" }}>Employers</div>
        </div>
        <div ref={reg("w-dl")} style={{ position: "absolute", left: 1293, top: 42, width: 126, height: 44, borderRadius: 22, background: FOREST, color: "#fff", fontFamily: "var(--f-body)", fontSize: 15.5, fontWeight: 500, display: "grid", placeItems: "center", opacity: 0 }}>
          Download
        </div>
        <div style={{ position: "absolute", left: 383, top: 128, width: 760, textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 63, lineHeight: "77px", letterSpacing: "-0.02em", color: FOREST }}>
          <div ref={reg("w-h1")} style={{ opacity: 0 }}>Swipe right to find</div>
          <div ref={reg("w-h2")} style={{ opacity: 0 }}>your next job in</div>
          <div ref={reg("w-h3")} style={{ color: ORANGE, height: 77, opacity: 0 }}>
            {SECTORS.map((s, w) => (
              <span key={s.word} ref={reg(`w-word-${w}`)} style={{ position: "relative", display: "none", height: 77, verticalAlign: "top" }}>
                {s.word.split("").map((c, i) => (
                  <span key={i} ref={reg(`w-s-${w}-${i}`)} style={{ display: "none", whiteSpace: "pre" }}>
                    {c}
                  </span>
                ))}
                {/* As wide as the word, whichever word it is. */}
                <span ref={reg(`w-under-${w}`)} style={{ position: "absolute", left: 0, right: 0, top: 74, height: 5, borderRadius: 3, background: GREEN, opacity: 0 }} />
              </span>
            ))}
            <span ref={reg("w-caret")} style={{ display: "inline-block", width: 5, height: 56, marginLeft: 4, background: ORANGE, verticalAlign: "-6px", opacity: 0 }} />
          </div>
        </div>
        <div ref={reg("w-sub")} style={{ position: "absolute", left: 493, top: 391, width: 540, textAlign: "center", fontFamily: "var(--f-body)", fontSize: 20, lineHeight: "32px", color: "#6b6b6b", opacity: 0 }}>
          Fortuna is the fastest and most stress free way for you to discover job opportunities in your community.
        </div>
        <div ref={reg("w-cta")} style={{ position: "absolute", left: 654, top: 495, width: 224, height: 52, borderRadius: 26, background: GREEN, color: "#fff", fontFamily: "var(--f-body)", fontSize: 17, fontWeight: 600, display: "grid", placeItems: "center", opacity: 0 }}>
          Download the App
        </div>
        {PEOPLE.map((p, i) => (
          <div
            key={p.src}
            ref={reg(`w-p-${i}`)}
            style={{ position: "absolute", left: p.x, top: p.y, width: p.d, height: p.d, borderRadius: "50%", overflow: "hidden", boxShadow: `0 0 0 4px ${p.ring}`, opacity: 0 }}
          >
            <Image src={p.src} alt="" fill sizes="140px" unoptimized draggable={false} style={{ objectFit: "cover" }} />
          </div>
        ))}
        {/* The reel's window: cards slide in at one edge of the page and out at
            the other, like a slot machine's, rather than hanging off either
            side waiting their turn. */}
        <div style={{ position: "absolute", left: 0, top: 790, width: 1525, height: 380, overflow: "hidden" }}>
          {Array.from({ length: 10 }, (_, j) => (
            <div key={j} ref={reg(`w-c-${j}`)} style={{ position: "absolute", left: 0, top: 0, opacity: 0 }}>
              <MiniCard job={JOBS[j % 5]} />
            </div>
          ))}
        </div>
      </div>

      {/* ── The phone ── */}
      <div ref={reg("phone")} style={{ ...abs, width: 415, height: 838 }}>
        <div style={{ position: "absolute", inset: "6px 4px", borderRadius: 60, boxShadow: "0 40px 80px rgba(20, 30, 27, 0.3)" }} />
        <svg width="415" height="838" viewBox="0 0 415 837.998" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <path d={PHONE_BODY} fill={FOREST} fillRule="evenodd" clipRule="evenodd" />
        </svg>
        <div style={{ position: "absolute", left: 20, top: 18, width: 375, height: 801, borderRadius: 44, overflow: "hidden", background: CREAM }}>
          <svg ref={reg("ph-rings")} width="375" height="801" viewBox="0 0 375 801" fill="none" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
            {SPLASH_RINGS.map((ring, i) => (
              <circle key={i} ref={reg(`ph-ring-${i}`)} cx="187" cy="364" r={ring.r} opacity={ring.o} stroke="#32443E" strokeOpacity="0.12" strokeWidth="2" strokeDasharray="8 8" />
            ))}
          </svg>
          <svg width="375" height="801" viewBox="0 0 375 801" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
            {SPLASH_DOTS.map(([x, y, r, fill, o], i) => (
              <circle key={i} ref={reg(`ph-dot-${i}`)} cx={x} cy={y} r={r} fill={fill} fillOpacity={o} />
            ))}
          </svg>
          <div ref={reg("ph-web")} style={{ position: "absolute", inset: 0, opacity: 0 }}>
            {JOBS.map((job, j) => (
              <div key={job.title} ref={reg(`ph-big-${j}`)} style={{ position: "absolute", left: 0, top: 0, opacity: 0 }}>
                <BigCard job={job} />
              </div>
            ))}
            <AppChrome />
          </div>
        </div>
        {/* The notch, over the screen. */}
        <div style={{ position: "absolute", left: 107, top: 18, width: 201, height: 30, borderRadius: "0 0 22px 22px", background: FOREST }}>
          <div style={{ position: "absolute", left: 77, top: 11, width: 46, height: 5, borderRadius: 3, background: "#26352f" }} />
        </div>
      </div>

      {/* ── The wordmark ── */}
      <svg ref={reg("mark")} width="206" height="41" viewBox="0 0 206 41" overflow="visible" style={{ ...abs }} fill={GREEN} aria-hidden="true">
        {GLYPHS.map((g, i) => (
          <path key={g.key} ref={reg(`mk-g-${i}`)} d={g.d} />
        ))}
        <path ref={reg("mk-dot")} d={DOT} fill={ORANGE} />
      </svg>
    </div>
  );
}

function FlowPart({
  k,
  reg,
  src,
  x,
  y,
  w,
  h,
  children,
}: {
  k: string;
  reg: Reg;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  children?: ReactNode;
}) {
  return (
    <div ref={reg(k)} style={{ position: "absolute", left: x, top: y, width: w, height: h, transformOrigin: "50% 60%", opacity: 0 }}>
      <Image src={src} alt="" width={Math.round(w * 2)} height={Math.round(h * 2)} unoptimized draggable={false} style={{ width: "100%", height: "100%" }} />
      {children}
    </div>
  );
}

/**
 * Text in one of the bio form's boxes. Given a key it types itself in, with
 * a caret; given children it is already filled.
 */
function Field({ k, reg, y, children }: { k?: string; reg?: Reg; y: number; children?: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 152,
        top: y,
        width: 176,
        height: 28,
        paddingLeft: 9,
        display: "flex",
        alignItems: "center",
        fontFamily: "var(--f-body)",
        fontSize: 11,
        fontWeight: 500,
        color: FOREST,
        whiteSpace: "pre",
      }}
    >
      {k && reg ? (
        <>
          <span ref={reg(k)} />
          <span ref={reg(`${k}-caret`)} style={{ width: 1.5, height: 13, marginLeft: 1, background: FOREST, opacity: 0 }} />
        </>
      ) : (
        children
      )}
    </div>
  );
}

/** The form's three attribute pills, each filling from the left. */
function Pills({ k, reg, fills }: { k: string; reg: Reg; fills: string[] }) {
  return (
    <>
      {PILLS.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: p.x, top: 284, width: p.w, height: 18, borderRadius: 5, overflow: "hidden", background: PILL_PALE }}>
          <div ref={reg(`${k}-${i}`)} style={{ position: "absolute", inset: 0, background: fills[i], transformOrigin: "0 50%", transform: "scaleX(0)" }} />
        </div>
      ))}
    </>
  );
}

function Tick({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
