"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AppChrome,
  AppliedFace,
  BigCard,
  CREAM,
  DINER,
  FOREST,
  GREEN,
  JOBS,
  MiniCard,
  ORANGE,
} from "./cards";
import { PROMO_DOTS, SPLASH_DOTS } from "./dots";
import {
  at,
  between,
  clamp01,
  easeIn,
  easeInOut,
  easeOut,
  fall,
  glide,
  hop,
  lerp,
  mix,
  place,
  seg,
  spring,
  zoom,
  type Box,
} from "./motion";
import { PHONE_BODY } from "./phone-shape";
import { DOT, DOT_BESIDE_F, GLYPHS, ICON_SCALE } from "./wordmark";

/**
 * The first time Fortuna is shown: a looping reel, after the Kindred one.
 *
 * Five frames from the Motion Vectors page, one after another on a stage
 * whose colour changes with each: the splash on green, the swipe promo on
 * forest, the app icon on cream, the flow promo on orange, the website on
 * petrol, and round again. The layout changes shape between them — tall, a
 * poster, a small square, wide, large — the way the reference does.
 *
 * The thread is the wordmark, and it is one element the whole way round. It
 * slides up on the splash, lifts out of the phone to head the swipe promo,
 * sheds "ortuna" and walks its full stop over to become the app icon's f.,
 * lands in the flow promo's corner, and grows its letters back to head the
 * website. That works because the icon is the wordmark's own f and dot at
 * 7.94 times the size: nothing is swapped for a lookalike at any point.
 *
 * The other things that carry across are carried, not cut: the phone runs
 * from the splash into the promo and out of the website back into the
 * splash; the camera rushes into the applied card until its green is the
 * whole stage, and that green closes into the app icon's square; the square
 * then opens into the flow promo's panel and on into the website's page.
 *
 * Bouncy throughout. Every arrival is a spring that overshoots and settles;
 * the only things that are not are the things falling away, and the icon's
 * full stop, which is set down gently.
 *
 * All of it is drawn from a single clock by one function, writing styles
 * straight to the elements rather than through React state, because there
 * are well over a hundred moving parts and a render per frame for each
 * would be the whole budget. Any moment of the loop can be drawn on its
 * own, which is what makes it loop cleanly.
 */

/** One time round, in seconds. */
const LOOP = 22;

/** The stage's colour for each scene. */
const STAGE = { splash: GREEN, promo: FOREST, icon: CREAM, flow: ORANGE, web: "#6f8b81" };

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
 * The splash's dashed rings, and the swipe promo's. Radii and opacities are
 * the frames' own; each turns at its own pace, the inner ones fastest, so
 * they visibly slide against one another.
 */
const SPLASH_RINGS = [
  { r: 250.754, o: 1, deg: 210 },
  { r: 331.316, o: 0.8, deg: 175 },
  { r: 411.877, o: 0.6, deg: 145 },
  { r: 492.439, o: 0.5, deg: 120 },
  { r: 573, o: 0.3, deg: 95 },
].map((ring) => ({ ...ring, deg: turn(ring.deg, 8, ring.r) }));
const PROMO_RINGS = [
  { r: 771.745, o: 1, deg: 150 },
  { r: 1020.86, o: 0.8, deg: 120 },
  { r: 1269.97, o: 0.6, deg: 100 },
  { r: 1519.09, o: 0.5, deg: 80 },
  { r: 1768.2, o: 0.3, deg: 64 },
].map((ring) => ({ ...ring, deg: turn(ring.deg, 53.89, ring.r) }));

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
const PROMO_WANDER = PROMO_DOTS.map((_, i) => wander(i, 2, 54));

/**
 * When everything happens, in seconds round the loop.
 *
 * All of the choreography reads off this table, so the pacing can be retuned
 * here rather than hunted through the drawing code below.
 */
const T = {
  // The splash. Each dot fades in somewhere in `dotsIn`.
  markUp: [0.15, 1.0],
  dotsIn: [0.2, 1.5],
  // Splash into the swipe promo: the promo grows up around the phone.
  toPromo: [2.8, 3.95],
  promoOpen: [2.9, 3.9],
  promoRings: [3.3, 4.1],
  promoDots: [3.4, 4.6],
  man: [3.85, 4.75],
  cardIn: [4.2, 4.8],
  words: 3.7,
  your: 4.1,
  type: [4.5, 5.2],
  underline: [5.25, 5.65],
  swipe: [6.0, 6.9],
  face: [6.1, 6.55],
  tick: [6.35, 6.9],
  stamp: [6.5, 7.05],
  // Into the applied card's green, which closes into the app icon.
  zoomIn: [7.35, 8.2],
  toIcon: [7.45, 8.3],
  drop: 7.65,
  whiten: [7.85, 8.2],
  square: [8.4, 9.3],
  dotOver: [8.6, 9.85],
  // The icon opening into the flow promo, and its three steps in turn.
  toFlow: [10.4, 11.4],
  markToFlow: [10.45, 11.35],
  greenAgain: [10.7, 11.1],
  flowTitle: 11.2,
  parts: [11.45, 12.55, 13.65],
  bioName: [11.8, 12.2],
  bioEdu: [12.25, 12.65],
  bioPills: [12.65, 13.05],
  swipeOut: [13.05, 13.5],
  swipeBack: [13.6, 14.2],
  hirePills: [14.0, 14.35],
  hired: [14.35, 14.85],
  confetti: [14.42, 15.3],
  // The flow promo growing into the website.
  flowDrop: 15.5,
  toWeb: [15.5, 16.4],
  markToWeb: [15.9, 16.7],
  dotBack: [16.0, 16.6],
  lettersBack: 16.25,
  darken: [16.0, 16.5],
  webIn: 16.4,
  slots: [17.7, 18.9, 20.1],
  // The website's phone back into the splash.
  toSplash: [21.0, 22.0],
  webOut: [21.0, 21.55],
  ringsBack: [21.4, 22.0],
} as const;

/**
 * The website's headline types the kind of work rather than the city — the
 * live site cycles through seven. Each word is typed, underlined, and
 * deleted again: `under` is when its underline shows, `del` when it goes.
 */
const SECTORS = [
  { word: "Hospitality", type: [17.2, 17.9], under: [17.95, 18.75], del: [18.9, 19.3] },
  { word: "Retail", type: [19.4, 19.8], under: [19.85, 20.55], del: [20.7, 20.95] },
] as const;

/** Stage colour changes, each [from, to, start, end]. */
const STAGE_CHANGES: [string, string, number, number][] = [
  [STAGE.splash, STAGE.promo, 2.8, 3.3],
  // Green as the camera reaches the applied card, and cream under the green
  // before it closes, so the icon's ground is waiting round it.
  [STAGE.promo, GREEN, 7.6, 8.05],
  [GREEN, STAGE.icon, 8.3, 8.32],
  [STAGE.icon, STAGE.flow, 10.5, 11.0],
  [STAGE.flow, STAGE.web, 15.6, 16.1],
  [STAGE.web, STAGE.splash, 21.1, 21.6],
];

const PROMO_WORDS = ["Swipe", "right", "to", "find"];
const TYPED = "next job";
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
  return T.slots.reduce((n, s) => n + spring(seg(t, s, s + 0.8), 0.3), 0);
}

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

      // ── The five layouts, fitted to the stage ──────────────────────────
      const splash = fit(415, 838, W * 0.86, H * 0.74, W, H);
      const promo = fit(2526, 3006, W * 0.92, H * 0.9, W, H);
      const icon = fit(401, 401, W * 0.5, H * 0.34, W, H);
      const flow = fit(1360, 695, W * 0.92, H * 0.72, W, H);
      const web = fit(1525, 1487, W * 0.94, H * 0.9, W, H);

      css("stage", "background", stageColour(t));

      // ── The camera rushing into the applied card, and into the web's phone
      // It closes on the card's lower half, below the tick and the stamp, so
      // what fills the stage is nothing but its green; and it brings that
      // spot to the middle as it goes, so the green fills the stage evenly.
      const promoMarkBox: Box = { ...at(promo, 119, 192), s: (promo.s * 555) / 206 };
      const zu = seg(t, ...T.zoomIn);
      const greenSpot = at(promo, 1306.65, 2210);
      const closeIn = zoom(promo, greenSpot.x, greenSpot.y, Math.pow(14, easeIn(zu)));
      const pan = easeInOut(zu);
      const promoCam: Box = {
        x: closeIn.x + (W / 2 - greenSpot.x) * pan,
        y: closeIn.y + (H / 2 - greenSpot.y) * pan,
        s: closeIn.s,
      };

      const webPhone0: Box = { ...at(web, 558, 592), s: web.s };
      const webPhoneMid = { x: webPhone0.x + 207.5 * web.s, y: webPhone0.y + 419 * web.s };
      const webZ = 1 + 1.6 * easeIn(seg(t, ...T.webOut));
      const webCam = zoom(web, webPhoneMid.x, webPhoneMid.y, webZ);

      // ── The phone ──────────────────────────────────────────────────────
      const promoPhone = (b: Box): Box => ({ ...at(b, 118, 886), s: (b.s * 1005.31) / 415 });
      const webPhone = (b: Box): Box => ({ ...at(b, 558, 592), s: b.s });
      let phone: Box = splash;
      let phoneO = 1;
      if (t < T.toPromo[0]) phone = splash;
      else if (t < T.toPromo[1]) phone = between(splash, promoPhone(promo), spring(seg(t, ...T.toPromo), 0.28));
      else if (t < T.zoomIn[0]) phone = promoPhone(promo);
      else if (t < T.zoomIn[1] + 0.05) {
        phone = promoPhone(promoCam);
        phoneO = 1 - seg(t, T.zoomIn[0] + 0.2, T.zoomIn[1] - 0.1);
      } else if (t < T.webIn + 0.3) phoneO = 0;
      else if (t < T.toSplash[0]) {
        const drop = 1 - spring(seg(t, T.webIn + 0.3, T.webIn + 1.25), 0.32);
        phone = { ...webPhone(web), y: webPhone(web).y - drop * H * 1.1 };
      } else phone = between(webPhone(web), splash, spring(seg(t, ...T.toSplash), 0.24));
      css("phone", "transform", place(phone));
      show("phone", phoneO);

      // What the phone's screen shows.
      show("ph-rings", t >= T.webIn ? seg(t, ...T.ringsBack) : 1);
      SPLASH_RINGS.forEach((ring, i) => {
        attr(`ph-ring-${i}`, "transform", `rotate(${((t / LOOP) * ring.deg).toFixed(3)} 187 364)`);
      });
      // The dots fade up where they stand, each at its own moment, and each
      // wanders its own small orbit.
      const dotsOn = t < T.webIn;
      SPLASH_WANDER.forEach((w, i) => {
        const d = drift(w, t);
        attr(`ph-dot-${i}`, "transform", `translate(${d.x.toFixed(2)} ${d.y.toFixed(2)})`);
        const s0 = lerp(T.dotsIn[0], T.dotsIn[1] - 0.5, w.start);
        show(`ph-dot-${i}`, dotsOn ? seg(t, s0, s0 + 0.5) : 0);
      });

      // The waiter card the promo's phone develops.
      const cardPop = spring(seg(t, ...T.cardIn), 0.55);
      css("ph-card", "transform", `translate(35.1px, ${(123.1 + (1 - cardPop) * 40).toFixed(2)}px) scale(${(0.9703 * lerp(0.7, 1, cardPop)).toFixed(4)})`);
      show("ph-card", t >= T.cardIn[0] && t < T.webIn ? seg(t, T.cardIn[0], T.cardIn[0] + 0.15) : 0);

      // The website's screen, with the slot machine running through it.
      const webScreenO = t >= T.webIn && t < T.toSplash[0] ? 1 : t >= T.toSplash[0] ? 1 - seg(t, T.toSplash[0], T.toSplash[0] + 0.45) : 0;
      show("ph-web", webScreenO);
      const moved = slotsMoved(t);
      for (let j = 0; j < 5; j++) {
        const q = ((((j - moved + 1) % 5) + 5) % 5) - 1;
        const dx = (q - 2) * 360;
        css(`ph-big-${j}`, "transform", `translate(${(30 + dx).toFixed(2)}px, 123px)`);
        show(`ph-big-${j}`, Math.abs(q - 2) < 1.2 ? 1 : 0);
      }

      // ── The swipe promo ────────────────────────────────────────────────
      const promoOn = t >= T.toPromo[0] && t < T.zoomIn[1];
      css("promo", "transform", place(promoCam));
      show("promo", promoOn ? 1 - seg(t, T.zoomIn[0] + 0.35, T.zoomIn[1]) : 0);
      // It grows out from where the phone stood.
      {
        const open = spring(seg(t, ...T.promoOpen), 0.18);
        const from = {
          l: (splash.x - promo.x) / promo.s,
          t: (splash.y - promo.y) / promo.s,
          r: (splash.x + 415 * splash.s - promo.x) / promo.s,
          b: (splash.y + 838 * splash.s - promo.y) / promo.s,
        };
        const l = lerp(from.l, 0, open);
        const tp = lerp(from.t, 0, open);
        const r = lerp(from.r, 2526, open);
        const b = lerp(from.b, 3006, open);
        css("promo", "clipPath", `inset(${tp.toFixed(1)}px ${(2526 - r).toFixed(1)}px ${(3006 - b).toFixed(1)}px ${l.toFixed(1)}px round ${lerp(150, 70, open).toFixed(1)}px)`);
      }
      show("promo-rings", seg(t, ...T.promoRings));
      PROMO_RINGS.forEach((ring, i) => {
        attr(`promo-ring-${i}`, "transform", `rotate(${((t / LOOP) * ring.deg).toFixed(3)} 2448.55 1693.77)`);
      });
      PROMO_WANDER.forEach((w, i) => {
        const d = drift(w, t);
        attr(`pd-${i}`, "transform", `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)})`);
        const s0 = lerp(T.promoDots[0], T.promoDots[1] - 0.5, w.start);
        show(`pd-${i}`, seg(t, s0, s0 + 0.5));
      });
      {
        const u = spring(seg(t, ...T.man), 0.35);
        const bob = 18 * Math.sin((2 * Math.PI * t) / 4);
        css("man", "transform", `translate(${(956.51 + (1 - u) * 1100).toFixed(1)}px, ${(2 + bob).toFixed(1)}px) rotate(${(Math.sin((2 * Math.PI * t) / 5) * 1.2).toFixed(2)}deg)`);
        show("man", seg(t, T.man[0], T.man[0] + 0.2));
      }
      PROMO_WORDS.forEach((_, i) => {
        const s0 = T.words + i * 0.09;
        const u = spring(seg(t, s0, s0 + 0.6), 0.55);
        css(`pw-${i}`, "transform", `translateY(${((1 - u) * 90).toFixed(1)}px)`);
        show(`pw-${i}`, seg(t, s0, s0 + 0.12));
      });
      {
        const u = spring(seg(t, T.your, T.your + 0.6), 0.55);
        css("p-your", "transform", `translateY(${((1 - u) * 90).toFixed(1)}px)`);
        show("p-your", seg(t, T.your, T.your + 0.12));
      }
      const typed = Math.floor(seg(t, ...T.type) * TYPED.length + 1e-6);
      for (let i = 0; i < TYPED.length; i++) {
        const on = i < typed;
        css(`p-ch-${i}`, "display", on ? "inline-block" : "none");
        if (on) {
          const s0 = T.type[0] + (i / TYPED.length) * (T.type[1] - T.type[0]);
          css(`p-ch-${i}`, "transform", `scale(${lerp(1.5, 1, spring(seg(t, s0, s0 + 0.3), 0.6)).toFixed(3)})`);
        }
      }
      show("p-caret", t >= T.type[0] - 0.2 && t < T.underline[0] ? (Math.floor(t * 4) % 2 === 0 ? 1 : 0.2) : 0);
      show("p-under", seg(t, ...T.underline));

      // The applied card, swiped out of the phone; then the camera dives
      // into it, its green going solid on the way.
      {
        const u = spring(seg(t, ...T.swipe), 0.35);
        const cx = lerp(622.3, 1394.55, u);
        const cy = lerp(1829.5, 1882, u) - Math.sin(Math.PI * clamp01(seg(t, ...T.swipe))) * 60;
        const rot = lerp(0, 15, u);
        const c = at(promoCam, cx, cy);
        const s = promoCam.s * 2.3504;
        css("green", "transform", `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)}) translate(-157.5px, -255.5px)`);
        show("green", t >= T.swipe[0] && promoOn ? 1 : 0);
        show("apply-green", 0.88 * seg(t, ...T.face) + 0.12 * seg(t, T.zoomIn[0], T.zoomIn[0] + 0.3));
        const tick = spring(seg(t, ...T.tick), 0.6);
        css("apply-tick", "transform", `scale(${tick.toFixed(3)})`);
        show("apply-tick", seg(t, T.tick[0], T.tick[0] + 0.1));
        const stamp = spring(seg(t, ...T.stamp), 0.55);
        css("apply-stamp", "transform", `scale(${lerp(1.7, 1, stamp).toFixed(3)}) rotate(${lerp(-10, 0, stamp).toFixed(2)}deg)`);
        show("apply-stamp", seg(t, T.stamp[0], T.stamp[0] + 0.12));
      }

      // ── The card that morphs: the green, the icon, flow panel, web page ─
      {
        const fullRect = { x: 0, y: 0, w: W, h: H, r: 0 };
        const iconRect = { x: icon.x, y: icon.y, w: 401 * icon.s, h: 401 * icon.s, r: 90 * icon.s };
        const flowRect = { x: flow.x, y: flow.y, w: 1360 * flow.s, h: 695 * flow.s, r: 36 * flow.s };
        const cam = t >= T.webOut[0] ? webCam : web;
        const webRect = { x: cam.x + 43 * cam.s, y: cam.y, w: 1440 * cam.s, h: 1369 * cam.s, r: 30 * cam.s };
        const blend = (a: typeof iconRect, b: typeof iconRect, u: number) => ({
          x: lerp(a.x, b.x, u),
          y: lerp(a.y, b.y, u),
          w: lerp(a.w, b.w, u),
          h: lerp(a.h, b.h, u),
          r: lerp(a.r, b.r, clamp01(u)),
        });
        let rect = iconRect;
        let colour = GREEN;
        let o = 1;
        if (t < T.zoomIn[1] - 0.1 || t >= T.webOut[1]) o = 0;
        else if (t < T.toFlow[0]) {
          // The whole stage of green, closing into the icon's square: eased
          // rather than sprung, so it draws in rather than snaps.
          rect = blend(fullRect, iconRect, 1 - (1 - seg(t, ...T.square)) ** 3);
          o = seg(t, T.zoomIn[1] - 0.1, T.zoomIn[1]);
        } else if (t < T.toWeb[0]) {
          rect = blend(iconRect, flowRect, spring(seg(t, ...T.toFlow), 0.28));
          colour = mix(GREEN, FLOW_PAPER, seg(t, T.toFlow[0] + 0.05, T.toFlow[0] + 0.5));
        } else {
          rect = blend(flowRect, webRect, spring(seg(t, ...T.toWeb), 0.28));
          colour = mix(FLOW_PAPER, WEB_PAPER, seg(t, ...T.toWeb));
          if (t >= T.webOut[0]) o = 1 - seg(t, T.webOut[0] + 0.05, T.webOut[1]);
        }
        css("card", "transform", `translate(${rect.x.toFixed(1)}px, ${rect.y.toFixed(1)}px)`);
        css("card", "width", `${Math.max(0, rect.w).toFixed(1)}px`);
        css("card", "height", `${Math.max(0, rect.h).toFixed(1)}px`);
        css("card", "borderRadius", `${Math.max(0, rect.r).toFixed(1)}px`);
        css("card", "background", colour);
        show("card", o);
      }

      // ── The flow promo ─────────────────────────────────────────────────
      {
        const on = t >= T.flowTitle - 0.2 && t < T.toWeb[1];
        css("flow", "transform", place(flow));
        show("flow", on ? 1 : 0);
        let n = 0;
        const out = (extra = "") => {
          const u = (t - (T.flowDrop + n * 0.045)) / 0.8;
          n++;
          if (u <= 0) return { tr: extra, o: 1 };
          const f = fall(u, (n % 2 ? 1 : -1) * 22);
          return { tr: `translateY(${f.dy.toFixed(1)}px) rotate(${f.rot.toFixed(2)}deg) ${extra}`, o: f.opacity };
        };
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
        const on = t >= T.webIn - 0.1 && t < T.webOut[1];
        css("web", "transform", place(t >= T.webOut[0] ? webCam : web));
        show("web", on ? 1 - seg(t, T.webOut[0] + 0.05, T.webOut[1]) : 0);
        const drop = (key: string, d: number, from = -520, bounce = 0.4) => {
          const s0 = T.webIn + d;
          const u = spring(seg(t, s0, s0 + 0.75), bounce);
          css(key, "transform", `translateY(${((1 - u) * from).toFixed(1)}px)`);
          show(key, seg(t, s0, s0 + 0.12));
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
        const caretOn = t >= SECTORS[0].type[0] - 0.3 && t < T.webOut[1];
        show("w-caret", caretOn ? (busy || Math.floor(t * 2.6) % 2 === 0 ? 1 : 0.15) : 0);
        PEOPLE.forEach((p, i) => {
          const s0 = T.webIn + 0.3 + i * 0.1;
          const u = spring(seg(t, s0, s0 + 0.8), 0.5);
          const bounce = -22 * hop(t / 1.6 + p.phase) * seg(t, s0 + 0.6, s0 + 1.0);
          css(`w-p-${i}`, "transform", `translateY(${((1 - u) * -560 + bounce).toFixed(1)}px)`);
          show(`w-p-${i}`, seg(t, s0, s0 + 0.12));
        });
        for (let j = 0; j < 10; j++) {
          const q = ((((j - moved + 1) % 10) + 10) % 10) - 1;
          const s0 = T.webIn + 0.55 + Math.max(0, Math.min(5, q + 1)) * 0.06;
          const u = spring(seg(t, s0, s0 + 0.8), 0.4);
          css(`w-c-${j}`, "transform", `translate(${slotX(q).toFixed(1)}px, ${(15 + (1 - u) * -700).toFixed(1)}px)`);
          show(`w-c-${j}`, q < 5.2 ? seg(t, s0, s0 + 0.12) : 0);
        }
      }

      // ── The wordmark: the thread through all five ──────────────────────
      {
        const splashMark: Box = { ...at(splash, 104, 364), s: splash.s };
        const iconMark: Box = { ...at(icon, 70.49, 37.59), s: icon.s * ICON_SCALE };
        const flowMark: Box = { ...at(flow, 1280, 32), s: flow.s * 0.9768 };
        const webMark: Box = { ...at(web, 107, 49), s: (web.s * 131.22) / 206 };
        let box = splashMark;
        let colour = GREEN;
        let o = 1;
        let dot = 0;
        let lift = 0;
        if (t < T.markUp[0]) o = 0;
        else if (t < T.toPromo[0]) {
          const u = spring(seg(t, ...T.markUp), 0.45);
          box = { ...splashMark, y: splashMark.y + (1 - u) * 70 * splash.s };
          o = seg(t, T.markUp[0], T.markUp[0] + 0.25);
        } else if (t < T.toPromo[1]) box = between(splashMark, promoMarkBox, spring(seg(t, ...T.toPromo), 0.28));
        else if (t < T.toIcon[0]) box = promoMarkBox;
        else if (t < T.markToFlow[0]) {
          // It stays out of the camera's dive: it comes forward on its own,
          // white against the green, to be the icon's f.
          // It grows at the camera's pace, evenly in scale rather than in
          // size, so it reaches the icon's f as the green reaches the edges.
          const u = easeInOut(seg(t, ...T.toIcon));
          box = {
            x: lerp(promoMarkBox.x, iconMark.x, u),
            y: lerp(promoMarkBox.y, iconMark.y, u),
            s: promoMarkBox.s * (iconMark.s / promoMarkBox.s) ** u,
          };
          colour = mix(GREEN, "#ffffff", seg(t, ...T.whiten));
          // The full stop is set down beside the f rather than dropped: it
          // leaves slowly, drifts over in a low arc, and slows to a stop.
          // At icon size its place after the a is far off the stage, so it is
          // held just inside the edge while the mark grows, and leaves from
          // there.
          const inside = (b: Box) => clamp01((206 - (W - Math.max(20, W * 0.06) - b.x) / b.s) / -DOT_BESIDE_F);
          const v = seg(t, ...T.dotOver);
          dot = t < T.dotOver[0] ? inside(box) : lerp(inside(iconMark), 1, glide(v));
          lift = -6 * Math.sin(Math.PI * v);
        } else if (t < T.markToWeb[0]) {
          box = between(iconMark, flowMark, spring(seg(t, ...T.markToFlow), 0.3));
          colour = mix("#ffffff", GREEN, seg(t, ...T.greenAgain));
          dot = 1;
        } else if (t < T.webOut[0]) {
          box = between(flowMark, webMark, spring(seg(t, ...T.markToWeb), 0.3));
          colour = mix(GREEN, MARK_DARK, seg(t, ...T.darken));
          dot = 1 - spring(seg(t, ...T.dotBack), 0.05);
          lift = -14 * Math.sin(Math.PI * seg(t, ...T.dotBack));
        } else {
          box = zoom(webMark, webPhoneMid.x, webPhoneMid.y, webZ);
          colour = MARK_DARK;
          o = 1 - seg(t, T.webOut[0], T.webOut[0] + 0.35);
        }
        css("mark", "transform", place(box));
        show("mark", o);
        attr("mark", "fill", colour);
        attr("mk-dot", "transform", `translate(${(DOT_BESIDE_F * dot).toFixed(2)} ${lift.toFixed(2)})`);

        // "ortuna": dropped off the f, and back again.
        GLYPHS.forEach((g, i) => {
          if (i === 0) return;
          const cx = (g.x0 + g.x1) / 2;
          let tr = "";
          let go = 1;
          if (t >= T.drop && t < T.lettersBack) {
            const u = (t - (T.drop + (i - 1) * 0.05)) / 0.9;
            if (u > 0) {
              const f = fall(u, (i % 2 ? 1 : -1) * (30 + i * 6));
              tr = `translate(0 ${(f.dy / 6).toFixed(2)}) rotate(${f.rot.toFixed(2)} ${cx} 20)`;
              go = f.opacity;
            }
          } else if (t >= T.lettersBack && t < T.webOut[0]) {
            const s0 = T.lettersBack + (i - 1) * 0.045;
            const u = spring(seg(t, s0, s0 + 0.55), 0.55);
            tr = `translate(0 ${((1 - u) * -26).toFixed(2)})`;
            go = seg(t, s0, s0 + 0.1);
          }
          attr(`mk-g-${i}`, "transform", tr || "translate(0 0)");
          attr(`mk-g-${i}`, "opacity", clamp01(go).toFixed(3));
        });
      }
    },
    [size],
  );

  // The clock. Started and stopped with the section's visibility; each step
  // is capped so returning to the tab does not skip whole scenes.
  useEffect(() => {
    if (reduced) {
      draw(7.2);
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
      aria-label="Fortuna, from its splash screen to its website"
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

      {/* ── The swipe promo, 2526 x 3006 ── */}
      <div ref={reg("promo")} style={{ ...abs, width: 2526, height: 3006, opacity: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: CREAM, borderRadius: 70 }} />
        <svg ref={reg("promo-rings")} width="2526" height="3006" viewBox="0 0 2526 3006" fill="none" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          {PROMO_RINGS.map((ring, i) => (
            <circle key={i} ref={reg(`promo-ring-${i}`)} cx="2448.55" cy="1693.77" r={ring.r} opacity={ring.o} stroke="#32443E" strokeOpacity="0.12" strokeWidth="13.472" strokeDasharray="53.89 53.89" />
          ))}
        </svg>
        <svg width="2526" height="3006" viewBox="0 0 2526 3006" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          {PROMO_DOTS.map(([x, y, r, fill, o], i) => (
            <circle key={i} ref={reg(`pd-${i}`)} cx={x} cy={y} r={r} fill={fill} fillOpacity={o} style={{ opacity: 0 }} />
          ))}
        </svg>
        <div ref={reg("man")} style={{ position: "absolute", left: 0, top: 0, width: 1569.49, height: 1556.02, transformOrigin: "50% 60%" }}>
          <Image src="/fortuna/reel/man.webp" alt="" width={1569} height={1556} unoptimized draggable={false} style={{ width: "100%", height: "auto" }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 119,
            top: 520,
            width: 1100,
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 105.4,
            lineHeight: "128px",
            letterSpacing: "-0.02em",
            color: FOREST,
            whiteSpace: "nowrap",
          }}
        >
          <div>
            {PROMO_WORDS.map((w, i) => (
              <span key={w} ref={reg(`pw-${i}`)} style={{ display: "inline-block", marginRight: i < PROMO_WORDS.length - 1 ? "0.24em" : 0, opacity: 0 }}>
                {w}
              </span>
            ))}
          </div>
          <div>
            <span ref={reg("p-your")} style={{ display: "inline-block", marginRight: "0.24em", opacity: 0 }}>your</span>
            <span style={{ color: ORANGE }}>
              {TYPED.split("").map((c, i) => (
                <span key={i} ref={reg(`p-ch-${i}`)} style={{ display: "none", whiteSpace: "pre", transformOrigin: "50% 80%" }}>
                  {c}
                </span>
              ))}
            </span>
            <span ref={reg("p-caret")} style={{ display: "inline-block", width: 8, height: 96, marginLeft: 6, background: ORANGE, verticalAlign: "-12px", opacity: 0 }} />
          </div>
        </div>
        <div ref={reg("p-under")} style={{ position: "absolute", left: 350.69, top: 778, width: 381.49, height: 9, borderRadius: 5, background: GREEN, opacity: 0 }} />
      </div>

      {/* ── The morphing card ── */}
      <div ref={reg("card")} style={{ ...abs, opacity: 0, boxShadow: "0 24px 60px rgba(20, 30, 27, 0.18)" }} />

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
        <div ref={reg("w-nav")} style={{ position: "absolute", left: 620, top: 34, width: 287, height: 56, borderRadius: 28, background: "#fff", boxShadow: "0 4px 14px rgba(40,40,30,0.06)", fontFamily: "var(--f-body)", fontSize: 15.5, fontWeight: 500, color: FOREST }}>
          <div style={{ position: "absolute", left: 8, top: 8, width: 141, height: 40, borderRadius: 20, border: `2px solid ${FOREST}`, display: "grid", placeItems: "center" }}>Job Seekers</div>
          <div style={{ position: "absolute", left: 149, top: 8, width: 130, height: 40, display: "grid", placeItems: "center" }}>Employers</div>
        </div>
        <div ref={reg("w-dl")} style={{ position: "absolute", left: 1293, top: 42, width: 126, height: 44, borderRadius: 22, background: FOREST, color: "#fff", fontFamily: "var(--f-body)", fontSize: 15.5, fontWeight: 500, display: "grid", placeItems: "center" }}>
          Download
        </div>
        <div style={{ position: "absolute", left: 383, top: 128, width: 760, textAlign: "center", fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 63, lineHeight: "77px", letterSpacing: "-0.02em", color: FOREST }}>
          <div ref={reg("w-h1")}>Swipe right to find</div>
          <div ref={reg("w-h2")}>your next job in</div>
          <div ref={reg("w-h3")} style={{ color: ORANGE, height: 77 }}>
            {SECTORS.map((s, w) => (
              <span key={s.word} ref={reg(`w-word-${w}`)} style={{ position: "relative", display: "none", height: 77, verticalAlign: "top" }}>
                {s.word.split("").map((c, i) => (
                  <span key={i} ref={reg(`w-s-${w}-${i}`)} style={{ display: "none" }}>
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
        <div ref={reg("w-sub")} style={{ position: "absolute", left: 493, top: 391, width: 540, textAlign: "center", fontFamily: "var(--f-body)", fontSize: 20, lineHeight: "32px", color: "#6b6b6b" }}>
          Fortuna is the fastest and most stress free way for you to discover job opportunities in your community.
        </div>
        <div ref={reg("w-cta")} style={{ position: "absolute", left: 654, top: 495, width: 224, height: 52, borderRadius: 26, background: GREEN, color: "#fff", fontFamily: "var(--f-body)", fontSize: 17, fontWeight: 600, display: "grid", placeItems: "center" }}>
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
              <circle key={i} ref={reg(`ph-dot-${i}`)} cx={x} cy={y} r={r} fill={fill} fillOpacity={o} style={{ opacity: 0 }} />
            ))}
          </svg>
          <div ref={reg("ph-card")} style={{ position: "absolute", left: 0, top: 0, transformOrigin: "157px 255px", opacity: 0 }}>
            <BigCard job={DINER} />
          </div>
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

      {/* ── The applied card, swiped out of the phone ── */}
      <div ref={reg("green")} style={{ ...abs, opacity: 0 }}>
        <BigCard job={DINER}>
          <AppliedFace refs={reg as (key: string) => (el: HTMLElement | null) => void} />
        </BigCard>
      </div>

      {/* ── The wordmark ── */}
      <svg ref={reg("mark")} width="206" height="41" viewBox="0 0 206 41" overflow="visible" style={{ ...abs, opacity: 0 }} fill={GREEN} aria-hidden="true">
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
