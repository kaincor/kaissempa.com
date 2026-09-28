"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FortunaWordmark from "./FortunaWordmark";

/**
 * The first time Fortuna is actually shown.
 *
 * A stage that plays on its own, round and round, with the product's own f.
 * as the thread: the app icon opens into the phone, the
 * phone runs the app — splash, the choice between the two users, the swipe —
 * then turns to show the other user's side, pulls back into the website, and
 * gives way to the posters before settling on the wordmark. The stage's own
 * colour changes with each chapter, so the section behind the work is part
 * of the work.
 *
 * Timed, and looping. It was first built scrubbed by the scroll, pinned for
 * seven screens; played on a clock it reads as the product being shown off
 * rather than a sequence the reader has to work through, and the page keeps
 * moving underneath it. The loop starts and ends on green — the wordmark
 * fades, the icon comes back on the same colour — so there is no seam.
 *
 * The one thing that is not on the clock is the last card in the stack,
 * which is the reader's to swipe. Touching it, or the app's buttons under
 * it, holds the loop until a few seconds after they let go; without that
 * their turn would be over in about a second.
 *
 * It only runs while it is on screen. Off screen the clock stops outright
 * rather than ticking in the background.
 *
 * Almost everything moving is vector or code. The screens the phone shows are
 * rebuilt as markup where they have to move (the job cards) and are 1x Figma
 * renders where they only have to be seen (the splash, the welcome screen);
 * the photographs are the originals from the Figma file, not renders of them.
 * About 300KB in all, none of it loaded until the section is on its way.
 */

/** Fortuna's own colours, as the stage passes through them. */
const GREEN = "#69bd45";
const CREAM = "#f7f5f0";
const FOREST = "#32443e";
const ORANGE = "#f58120";
const INK = "#2a3a35";

/**
 * One time round, in seconds.
 *
 * Quick, and every scene lands on a spring. The swipe still has two cards to
 * get through before the reader's turn, so the time saved comes out of the
 * holds between scenes rather than out of the moves themselves.
 */
const DURATION = 19;
/** How long the loop waits after the reader last touched their card. */
const HOLD_MS = 2600;

/** A span of the loop given in seconds, stored as a fraction of it. */
const S = (a: number, b: number) => [a / DURATION, b / DURATION] as const;

/**
 * Where each beat sits in the loop.
 *
 * All of the choreography reads off this one table, so the pacing can be
 * retuned in one place rather than hunted through the transforms below. The
 * zooms come in pairs across a cut: in through the f in one scene until its
 * stem fills the stage, and back out through the f of the next.
 */
const T = {
  zoomOut0: S(0, 0.6),
  zoomIn1: S(1.1, 1.6),
  zoomOut1: S(1.6, 2.2),
  welcomeIn: S(2.75, 3.05),
  tap: S(3.3, 3.6),
  listingIn: S(3.65, 3.95),
  swipeRight: S(4.15, 4.8),
  advance1: S(4.8, 5.15),
  swipeLeft: S(5.3, 5.95),
  advance2: S(5.95, 6.3),
  yourTurn: S(6.3, 7.9),
  zoomIn2: S(7.9, 8.4),
  zoomOut2: S(8.4, 9.0),
  flipTo: S(9.4, 10.0),
  flipBack: S(10.5, 11.1),
  zoomIn3: S(11.1, 11.6),
  zoomOut3: S(11.6, 12.2),
  zoomIn4: S(13.1, 13.6),
  zoomOut4: S(13.6, 14.2),
  toPoster: S(14.9, 15.35),
  zoomIn5: S(16.0, 16.5),
  zoomOut5: S(16.5, 17.1),
  zoomIn6: S(18.4, 19.0),
} as const;

/** The moment each zoom covers the stage: where the scenes change over. */
const P1 = T.zoomIn1[1];
const P2 = T.zoomIn2[1];
const P3 = T.zoomIn3[1];
const P4 = T.zoomIn4[1];
const P5 = T.zoomIn5[1];
const FLIP_TO = (T.flipTo[0] + T.flipTo[1]) / 2;
const FLIP_BACK = (T.flipBack[0] + T.flipBack[1]) / 2;

/** The colour of the f at each end of each cut, for the wash that covers it. */
const WHITE = "#ffffff";
const SITE_INK = "#32443e";
const CUTS = [
  { in: T.zoomIn1, out: T.zoomOut1, from: WHITE, to: GREEN },
  { in: T.zoomIn2, out: T.zoomOut2, from: GREEN, to: GREEN },
  { in: T.zoomIn3, out: T.zoomOut3, from: GREEN, to: SITE_INK },
  { in: T.zoomIn4, out: T.zoomOut4, from: SITE_INK, to: GREEN },
  { in: T.zoomIn5, out: T.zoomOut5, from: GREEN, to: WHITE },
  // The seam: out of the closing wordmark's f and into the icon's.
  { in: T.zoomIn6, out: T.zoomOut0, from: WHITE, to: WHITE },
] as const;

/**
 * The f in the wordmark, in the wordmark's own units (it is drawn 41 high):
 * the middle of the stem just under the crossbar, and half the stem's width.
 * The stem is the one part of the letter broad enough to fly into.
 */
const MARK_F = { x: 8.3, y: 27, hw: 5.2 };
/** The same point in the app icon's f, in the logo's units. */
const ICON_F = { x: 66, y: 235, hw: 41 };

/** The phone's screen, in the app's own design units. */
const SCREEN_W = 375;
const SCREEN_H = 812;

/** The three card slots, straight from the Home frame in Figma. */
const SLOTS = [
  { x: 30, y: 127, w: 315 },
  { x: 40, y: 166, w: 295 },
  { x: 50, y: 203, w: 275 },
];
const CARD_H = 511;

/** How washed out a card sits at each depth, as in the design. */
const DIM = [0, 0.5, 0.68];

/**
 * How far a swiped card travels, in screen units, and how much it turns.
 *
 * Further than it looks like it needs to. The cards turn about their top
 * corner, so a card that has cleared the screen at the top swings its bottom
 * corner back in as it rotates: at 460 a 16-degree card left a sliver of red
 * or green standing at the edge of the screen for the rest of the section.
 */
const FLY = 720;
const FLY_TURN = 16;

const JOBS = [
  {
    title: "Waiter / Waitress",
    place: "Al Mac's Diner",
    rating: "4.8",
    hours: "Part Time",
    area: "Dave County",
    distance: "3.5 miles away",
    pay: "$16",
    photo: { src: "/fortuna/reveal/photo-diner.webp", w: 407, h: 610 },
  },
  {
    title: "Cook",
    place: "Little John's Bakery",
    rating: "4.6",
    hours: "Part Time Job",
    area: "Weekends",
    distance: "1 mile away",
    pay: "$26",
    photo: { src: "/fortuna/reveal/photo-briefcase.webp", w: 610, h: 560 },
  },
  {
    title: "Window Cleaner",
    place: "Riverside Cleaning Co.",
    rating: "4.7",
    hours: "Part Time Job",
    area: "Weekends",
    distance: "2.3 miles away",
    pay: "$19",
    photo: { src: "/fortuna/reveal/photo-window.webp", w: 530, h: 353 },
  },
];

/** Linear interpolation, clamped: 0 before a, 1 after b. */
function span(p: number, [a, b]: readonly [number, number]) {
  return Math.min(1, Math.max(0, (p - a) / (b - a)));
}

function useStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Where a scene's f is, as an offset from the scene's centre, in px. */
type Anchor = { x: number; y: number; hw: number };

/**
 * How far to fly into an f: until its stem is most of the stage wide.
 *
 * Capped, and the wash does the last of the covering. Flying the whole way
 * into a four-pixel stem on a phone screen means scaling the scene past a
 * hundred times, which is a lot of texture for a browser to find for a third
 * of a second when a colour fading up over the last stretch reads the same.
 */
function depth(a: Anchor, W: number) {
  return Math.min(32, Math.max(4, (W * 0.42) / a.hw));
}

/**
 * A scene's transform at a moment: arriving out of its f, leaving into it,
 * or at rest. The f's point is carried to the middle of the stage as the
 * zoom deepens, so the camera flies into the letter rather than past it.
 *
 * Scaled in log space. A linear scale from 1 to 30 spends nearly all of its
 * time in the last few multiples and reads as a lurch; log is even, the way a
 * dolly move is. The landing overshoots a touch below full size and comes
 * back, which is the bounce.
 */
function zoomed(
  v: number,
  arrive: { win: readonly [number, number]; a: Anchor } | null,
  leave: { win: readonly [number, number]; a: Anchor } | null,
  W: number,
) {
  let z = 1;
  let c = 0;
  let a: Anchor = { x: 0, y: 0, hw: 1 };
  if (arrive && v >= arrive.win[0] && v < arrive.win[1]) {
    const t = span(v, arrive.win);
    a = arrive.a;
    // Out of the letter over most of the window, then a dip just under full
    // size and back for the landing. A spring curve for the whole move did
    // its travel in the first quarter, so the scene was already at rest by
    // the time the wash had cleared and the fly-out itself was never seen.
    const out = Math.min(1, t / 0.78);
    z = Math.exp(Math.log(depth(a, W)) * (1 - easeOut2(out)));
    z *= 1 - 0.075 * Math.sin(Math.PI * span(t, [0.7, 1]));
    c = 1 - easeInOut(out);
  } else if (leave && v >= leave.win[0] && v <= leave.win[1]) {
    const t = span(v, leave.win);
    a = leave.a;
    z = Math.exp(Math.log(depth(a, W)) * easeIn2(t));
    c = easeInOut(Math.min(1, t / 0.6));
  }
  return `translate(${-c * z * a.x}px, ${-c * z * a.y}px) scale(${z})`;
}

export default function Reveal() {
  const reduced = useReducedMotion();
  const [stage, { w: W, h: H }] = useStage();
  const p = useMotionValue(0);
  const onScreen = useInView(stage, { amount: 0.35 });
  const holdUntil = useRef(0);

  // The reader's card holds the loop while they are using it.
  useEffect(() => {
    const onHold = (e: Event) => {
      const ms = (e as CustomEvent<number>).detail;
      holdUntil.current = ms === Infinity ? Infinity : performance.now() + ms;
    };
    window.addEventListener("fortuna-hold", onHold);
    return () => window.removeEventListener("fortuna-hold", onHold);
  }, []);

  // The clock. Started and stopped with the section's visibility, not left
  // running idle; the step is capped so coming back to the tab after a while
  // does not skip whole scenes in one frame.
  useEffect(() => {
    if (!onScreen || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (now >= holdUntil.current) p.set((p.get() + dt / DURATION) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduced, p]);

  // The phone, sized to the stage. The screen is laid out at the app's own
  // 375 x 812 and scaled into it, so every coordinate below is a Figma one.
  const screenH = Math.min(H * 0.68, 640, (W * 0.78 * SCREEN_H) / SCREEN_W);
  const screenW = (screenH * SCREEN_W) / SCREEN_H;
  const k = screenW / SCREEN_W;
  const bezel = screenW * 0.045;
  const PW = screenW + bezel * 2;
  const PH = screenH + bezel * 2;
  const phoneR = screenW * 0.14;
  const iconS = Math.min(PW * 0.62, H * 0.3);

  // Every other scene, fitted to whichever dimension of the stage runs out
  // first.
  const handH = PH * 1.04;
  const hand = handH / 640;
  const webW = Math.min(W * 0.92, 1100, (H * 0.74 * 1440) / 1297);
  const web = webW / 1440;
  const webH = 26 + 1297 * web;
  const wallW = Math.min(W * 0.9, 1200, (H * 0.76 * 1600) / 1079);
  const wall = wallW / 1600;
  const posterH = Math.min(H * 0.82, (W * 0.8 * 1800) / 1013);
  const poster = posterH / 1800;
  const markFont = Math.min(118, Math.max(44, W * 0.1));
  const markU = (markFont * 1.0256) / 41;

  // Where the f is in each scene, measured off the files themselves.
  const onScreenF = (sx: number, sy: number, hw: number): Anchor => ({
    x: bezel + sx * k - PW / 2,
    y: bezel + sy * k - PH / 2,
    hw: hw * k,
  });
  const iconU = (iconS * 0.6) / 260.337;
  const F = {
    icon: {
      x: iconS * 0.19 + ICON_F.x * iconU - iconS / 2,
      y: iconS * 0.12 + ICON_F.y * iconU - iconS / 2,
      hw: ICON_F.hw * iconU,
    },
    splash: onScreenF(84 + MARK_F.x, 346 + MARK_F.y, MARK_F.hw),
    header: onScreenF(129 + MARK_F.x * 0.5628, 59 + MARK_F.y * 0.5628, MARK_F.hw * 0.5628),
    seeker: { x: 120 * hand - (287 * hand) / 2, y: 73 * hand - handH / 2, hw: 2.5 * hand },
    webPhone: { x: 671.8 * web - webW / 2, y: 26 + 777.5 * web - webH / 2, hw: 2.4 * web },
    webLogo: { x: 69 * web - webW / 2, y: 26 + 63.5 * web - webH / 2, hw: 3.2 * web },
    wall: { x: 392 * wall - wallW / 2, y: 214.5 * wall - (1079 * wall) / 2, hw: 3.2 * wall },
    poster: { x: 114.8 * poster - (1013 * poster) / 2, y: 168 * poster - posterH / 2, hw: 11.2 * poster },
    mark: {
      x: (MARK_F.x - 103) * markU,
      y: MARK_F.y * markU - (41 * markU - 0.09 * markFont) / 2,
      hw: MARK_F.hw * markU,
    },
  };

  // The stage's colour changes only at a cut, while the wash has it covered.
  const bg = useTransform(p, (v) =>
    v < P1 ? GREEN : v < P2 ? CREAM : v < P3 ? FOREST : v < P4 ? CREAM : v < P5 ? ORANGE : GREEN,
  );

  // The wash: the colour of the stem the camera is inside, fading up over the
  // last of a zoom in and away over the first of the zoom out, and turning
  // from one f's colour to the next while it has the stage covered.
  const washOpacity = useTransform(p, (v) => {
    for (const c of CUTS) {
      if (v >= c.in[0] && v <= c.in[1]) return easeIn3(span(v, [c.in[0] + (c.in[1] - c.in[0]) * 0.55, c.in[1] - (c.in[1] - c.in[0]) * 0.08]));
      if (v >= c.out[0] && v < c.out[1]) return 1 - easeOut3(span(v, [c.out[0] + (c.out[1] - c.out[0]) * 0.06, c.out[0] + (c.out[1] - c.out[0]) * 0.4]));
    }
    return 0;
  });
  const washColour = useTransform(p, (v) => {
    for (const c of CUTS) {
      if (v >= c.in[0] && v <= c.in[1]) return mix(c.from, c.to, span(v, [c.in[1] - (c.in[1] - c.in[0]) * 0.12, c.in[1]]) * 0.5);
      if (v >= c.out[0] && v < c.out[1]) return mix(c.from, c.to, 0.5 + 0.5 * span(v, [c.out[0], c.out[0] + (c.out[1] - c.out[0]) * 0.12]));
    }
    return WHITE;
  });

  // Which scene is up. They change over only at a cut, under the wash.
  const iconOn = useTransform(p, (v) => (v < P1 ? 1 : 0));
  const phoneOn = useTransform(p, (v) => (v >= P1 && v < P2 ? 1 : 0));
  const seekerOn = useTransform(p, (v) =>
    (v >= P2 && v < FLIP_TO) || (v >= FLIP_BACK && v < P3) ? 1 : 0,
  );
  const employerOn = useTransform(p, (v) => (v >= FLIP_TO && v < FLIP_BACK ? 1 : 0));
  const webOn = useTransform(p, (v) => (v >= P3 && v < P4 ? 1 : 0));
  const markOn = useTransform(p, (v) => (v >= P5 ? 1 : 0));

  const iconT = useTransform(p, (v) => zoomed(v, { win: T.zoomOut0, a: F.icon }, { win: T.zoomIn1, a: F.icon }, W));
  const phoneT = useTransform(p, (v) => zoomed(v, { win: T.zoomOut1, a: F.splash }, { win: T.zoomIn2, a: F.header }, W));
  const seekerT = useTransform(p, (v) => zoomed(v, { win: T.zoomOut2, a: F.seeker }, { win: T.zoomIn3, a: F.seeker }, W));
  const webT = useTransform(p, (v) => zoomed(v, { win: T.zoomOut3, a: F.webPhone }, { win: T.zoomIn4, a: F.webLogo }, W));
  const wallT = useTransform(p, (v) => zoomed(v, { win: T.zoomOut4, a: F.wall }, null, W));
  const posterT = useTransform(p, (v) => zoomed(v, null, { win: T.zoomIn5, a: F.poster }, W));
  const markT = useTransform(p, (v) => zoomed(v, { win: T.zoomOut5, a: F.mark }, { win: T.zoomIn6, a: F.mark }, W));

  // The two users: the phone turned round to the employer's side and back.
  const seekerRot = useTransform(p, (v) =>
    v < FLIP_BACK
      ? 90 * easeIn(span(v, [T.flipTo[0], FLIP_TO]))
      : -90 + 90 * backOut(span(v, [FLIP_BACK, T.flipBack[1]]), 1.2),
  );
  const employerRot = useTransform(p, (v) =>
    v < FLIP_BACK - 0.0001 && v >= FLIP_TO
      ? v < T.flipBack[0]
        ? -90 + 90 * backOut(span(v, [FLIP_TO, T.flipTo[1]]), 1.2)
        : 90 * easeIn(span(v, [T.flipBack[0], FLIP_BACK]))
      : -90,
  );

  const wallOn = useTransform(p, (v) => (v >= P4 && v < T.toPoster[1] ? 1 - span(v, T.toPoster) : 0));
  const posterOn = useTransform(p, (v) => (v >= T.toPoster[0] && v < P5 ? span(v, T.toPoster) : 0));
  const posterIn = useTransform(p, (v) => 0.86 + 0.14 * backOut(span(v, T.toPoster), 1.6));

  const welcomeOpacity = useTransform(p, (v) => span(v, T.welcomeIn));
  const welcomeY = useTransform(p, (v) => 40 * (1 - backOut(span(v, T.welcomeIn), 1.6)));
  const listingOpacity = useTransform(p, (v) => span(v, T.listingIn));
  const listingY = useTransform(p, (v) => 40 * (1 - backOut(span(v, T.listingIn), 1.6)));
  const tapScale = useTransform(p, (v) => 0.2 + 1.6 * span(v, T.tap));
  const tapOpacity = useTransform(p, (v) => {
    const s = span(v, T.tap);
    return s <= 0 || s >= 1 ? 0 : 0.35 * (1 - s);
  });

  const hintOpacity = useTransform(p, (v) => {
    const a = span(v, [T.yourTurn[0], T.yourTurn[0] + 0.015]);
    const b = span(v, [T.yourTurn[1] - 0.015, T.yourTurn[1]]);
    return a * (1 - b);
  });

  if (reduced) return <StillReveal />;

  return (
    <motion.div
      ref={stage}
      style={{
        position: "relative",
        height: "100svh",
        maxHeight: 980,
        minHeight: 620,
        overflow: "hidden",
        background: bg,
        // Out of the text column to the full width of the page: the stage's
        // colour is the section's colour, and a coloured box sitting inside a
        // cream margin would read as a picture of it instead.
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginTop: "clamp(40px, 7vh, 80px)",
      }}
    >
      {/* The app icon. */}
      <Layer>
        <motion.div style={{ opacity: iconOn, transform: iconT }}>
          <div
            aria-hidden="true"
            style={{
              width: iconS,
              height: iconS,
              borderRadius: iconS * 0.23,
              background: GREEN,
              position: "relative",
              boxShadow: "0 18px 40px rgba(20, 60, 20, 0.25)",
            }}
          >
            <FLogo size={iconS} />
          </div>
        </motion.div>
      </Layer>

      {/* The phone, running the app. */}
      <Layer interactive>
        <motion.div style={{ opacity: phoneOn, transform: phoneT }}>
          <div
            style={{
              position: "relative",
              width: PW,
              height: PH,
              background: "#31403d",
              borderRadius: phoneR + bezel,
              boxShadow: "0 30px 60px rgba(20, 30, 27, 0.28)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: bezel,
                borderRadius: phoneR,
                overflow: "hidden",
                background: CREAM,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: SCREEN_W,
                  height: SCREEN_H,
                  transform: `scale(${k})`,
                  transformOrigin: "0 0",
                }}
              >
                <Shot src="/fortuna/reveal/splash.webp" w={375} h={812} />
                <motion.div style={{ position: "absolute", inset: 0, opacity: welcomeOpacity, y: welcomeY, background: CREAM }}>
                  <Shot src="/fortuna/reveal/welcome.webp" w={375} h={809} />
                  {/* The tap on Job Seeker. */}
                  <motion.span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 187 - 60,
                      top: 286 - 60,
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: GREEN,
                      scale: tapScale,
                      opacity: tapOpacity,
                    }}
                  />
                </motion.div>
                <motion.div style={{ position: "absolute", inset: 0, opacity: listingOpacity, y: listingY }}>
                  <Listing p={p} k={k} />
                </motion.div>
              </div>
            </div>
            {/* The notch. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: bezel,
                left: "50%",
                width: screenW * 0.42,
                height: screenW * 0.075,
                transform: "translateX(-50%)",
                background: "#31403d",
                borderRadius: `0 0 ${screenW * 0.05}px ${screenW * 0.05}px`,
              }}
            />
          </div>
        </motion.div>
      </Layer>

      {/* The two users, either side of the same phone. */}
      <Layer style={{ perspective: 1400 }}>
        <motion.div style={{ opacity: seekerOn, transform: seekerT }}>
          <motion.div style={{ rotateY: seekerRot }}>
            <Shot src="/fortuna/reveal/phone-seeker.webp" w={287} h={640} height={handH} />
          </motion.div>
        </motion.div>
      </Layer>
      <Layer style={{ perspective: 1400 }}>
        <motion.div style={{ opacity: employerOn, rotateY: employerRot }}>
          <Shot src="/fortuna/reveal/phone-employer.webp" w={287} h={640} height={handH} />
        </motion.div>
      </Layer>

      {/* The website, in a browser window. */}
      <Layer>
        <motion.div style={{ opacity: webOn, transform: webT }}>
          <div
            style={{
              width: webW,
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 30px 70px rgba(20, 30, 27, 0.22)",
            }}
          >
            <div
              aria-hidden="true"
              style={{ height: 26, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", background: "#ebe9e4" }}
            >
              {["#f34545", "#f58120", "#69bd45"].map((c) => (
                <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />
              ))}
            </div>
            <Shot src="/fortuna/reveal/website-hero.webp" w={1440} h={1297} width={webW} />
          </div>
        </motion.div>
      </Layer>

      {/* The posters: on the wall first, then the poster itself. */}
      <Layer>
        <motion.div style={{ opacity: wallOn, transform: wallT }}>
          <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 70px rgba(60, 25, 0, 0.3)" }}>
            <Shot src="/fortuna/reveal/posters-wall.webp" w={1600} h={1079} width={wallW} />
          </div>
        </motion.div>
      </Layer>
      <Layer>
        <motion.div style={{ opacity: posterOn, transform: posterT }}>
          <motion.div
            style={{ scale: posterIn, borderRadius: 10, overflow: "hidden", boxShadow: "0 30px 70px rgba(60, 25, 0, 0.3)" }}
          >
            <Shot src="/fortuna/reveal/poster.webp" w={1013} h={1800} height={posterH} />
          </motion.div>
        </motion.div>
      </Layer>

      {/* And the name. */}
      <Layer>
        <motion.div style={{ opacity: markOn, transform: markT }}>
          <div style={{ display: "flex", fontSize: markFont, lineHeight: 0 }}>
            <FortunaWordmark color="#ffffff" title="fortuna" />
          </div>
        </motion.div>
      </Layer>

      {/* Inside the f: the colour of its stem, covering the cut. */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: washColour,
          opacity: washOpacity,
          pointerEvents: "none",
        }}
      />

      <motion.p
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "max(5vh, 22px)",
          margin: 0,
          textAlign: "center",
          fontFamily: "var(--f-body)",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: INK,
          opacity: hintOpacity,
          pointerEvents: "none",
        }}
      >
        Your turn — swipe the card, or tap ✕ or ✓
      </motion.p>
    </motion.div>
  );
}

/** Two hex colours mixed, t of the way from a to b. */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((x, i) => Math.round(x + (pb[i] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Pause the loop: for a while, or until told otherwise. */
function hold(ms: number) {
  window.dispatchEvent(new CustomEvent("fortuna-hold", { detail: ms }));
}

/**
 * Centres one layer of the stage.
 *
 * Every layer is stacked over every other, faded to nothing when it is not
 * its chapter — and an invisible layer still catches the pointer. Only the
 * phone takes input; the rest are see-through to it by default, or the
 * reader's swipe would land on a transparent poster.
 */
function Layer({
  children,
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        ...style,
      }}
    >
      <div style={{ pointerEvents: interactive ? "auto" : "none" }}>{children}</div>
    </div>
  );
}

function Shot({
  src,
  w,
  h,
  width,
  height,
}: {
  src: string;
  w: number;
  h: number;
  width?: number;
  height?: number;
}) {
  const dw = width ?? (height ? (height * w) / h : w);
  const dh = height ?? (width ? (width * h) / w : h);
  return (
    <Image
      src={src}
      alt=""
      width={w}
      height={h}
      unoptimized
      draggable={false}
      style={{ display: "block", width: dw, height: dh, userSelect: "none" }}
    />
  );
}

/** The f. from the app icon, as the vector it is in the Figma file. */
function FLogo({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 260.337 324.246"
      width={size * 0.6}
      style={{ position: "absolute", left: size * 0.19, top: size * 0.12 }}
      aria-hidden="true"
    >
      <path
        d="M4.33774 317.041V294.922L24.0745 290.585L24.7251 225.962V138.353H0V109.728L26.2433 106.475C31.2317 70.9113 42.5099 50.527 59.8608 32.9618C82.4171 10.409 114.083 0 141.41 0C167.003 0 191.728 8.24045 197.367 34.2629C197.367 52.9124 185.222 66.7911 164.4 66.7911C148.351 66.7911 134.904 55.9484 122.324 28.6247L121.457 26.6731C108.444 42.9371 104.973 64.6225 106.058 105.825H147.049V138.353H107.142V225.962L107.793 287.332L138.808 294.922V317.041H23.4238H4.33774Z"
        fill="#fff"
      />
      <path
        d="M175.124 282.604C175.124 259.18 193.819 239.66 217.731 239.66C241.642 239.66 260.337 259.18 260.337 282.604C260.337 305.594 241.642 324.246 217.731 324.246C193.819 324.246 175.124 305.594 175.124 282.604Z"
        fill={ORANGE}
      />
    </svg>
  );
}

/**
 * The job seeker's home screen, rebuilt so its cards can move.
 *
 * The two cards the reader watches go by are scrubbed by the scroll: one
 * applied to, one passed on, the stack stepping forward behind each. The
 * third is theirs to swipe, by dragging or with the buttons, and comes back
 * so they can do it again.
 */
function Listing({ p, k }: { p: MotionValue<number>; k: number }) {
  // Where each card sits in the stack at a given moment: 0 is the front.
  // Rendered back to front, so the front card is always painted last and no
  // z-index has to follow the stack as it steps forward.
  const depth = (i: number, v: number) => {
    const a1 = backOut(span(v, T.advance1), 1.8);
    const a2 = backOut(span(v, T.advance2), 1.8);
    return i - a1 - a2;
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: CREAM }}>
      <Header />
      {[2, 1, 0].map((i) =>
        i === 2 ? (
          <YourCard key={i} p={p} k={k} depth={(v) => depth(i, v)} />
        ) : (
          <ScrubbedCard
            key={i}
            index={i}
            p={p}
            depth={(v) => depth(i, v)}
            swipe={i === 0 ? T.swipeRight : T.swipeLeft}
            dir={i === 0 ? 1 : -1}
          />
        ),
      )}
      <Buttons />
    </div>
  );
}

/** A card's slot in the stack, blended between neighbouring slots. */
function slot(d: number) {
  // Past the front slot on the overshoot: carried on along the line from the
  // second slot through the first, so the card comes a little too far
  // forward and settles back.
  const lo = d < 0 ? 0 : Math.floor(Math.min(d, 2));
  const hi = Math.min(2, lo + 1);
  const t = d < 0 ? d : Math.min(d, 2) - lo;
  const a = SLOTS[lo];
  const b = SLOTS[hi];
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    s: (a.w + (b.w - a.w) * t) / SLOTS[0].w,
    dim: Math.max(0, DIM[lo] + (DIM[hi] - DIM[lo]) * t),
  };
}

function ScrubbedCard({
  index,
  p,
  depth,
  swipe,
  dir,
}: {
  index: number;
  p: MotionValue<number>;
  depth: (v: number) => number;
  swipe: readonly [number, number];
  dir: 1 | -1;
}) {
  const transform = useTransform(p, (v) => {
    const s = slot(depth(v));
    const go = easeIn(span(v, swipe));
    const x = s.x + dir * FLY * go;
    const r = dir * FLY_TURN * go;
    return `translate(${x}px, ${s.y + 30 * go}px) rotate(${r}deg) scale(${s.s})`;
  });
  const dim = useTransform(p, (v) => slot(depth(v)).dim);
  const state = useTransform(p, (v) => Math.min(1, span(v, swipe) * 1.8));
  // Gone once it has gone, however the corners happen to fall.
  const gone = useTransform(p, (v) => 1 - span(v, [swipe[0] + (swipe[1] - swipe[0]) * 0.7, swipe[1]]));
  return (
    <motion.div style={{ ...CARD_BOX, transform, opacity: gone }}>
      <Card job={JOBS[index]} dim={dim} state={state} dir={dir} />
    </motion.div>
  );
}

/** The reader's card: the stack's last, swipeable by hand. */
function YourCard({
  p,
  k,
  depth,
}: {
  p: MotionValue<number>;
  k: number;
  depth: (v: number) => number;
}) {
  const x = useMotionValue(0);
  const [live, setLive] = useState(false);
  useMotionValueEvent(p, "change", (v) => setLive(v >= T.advance2[1] && v < T.zoomIn2[0]));

  // The scroll places it in the stack; the reader's drag moves it from there.
  const transform = useTransform([p, x], ([v, d]: number[]) => {
    const s = slot(depth(v));
    return `translate(${s.x + d}px, ${s.y + Math.abs(d) * 0.06}px) rotate(${d * 0.035}deg) scale(${s.s})`;
  });
  const dim = useTransform(p, (v) => slot(depth(v)).dim);
  const right = useTransform(x, (d) => Math.min(1, Math.max(0, d / 160)));
  const left = useTransform(x, (d) => Math.min(1, Math.max(0, -d / 160)));

  const shown = useMotionValue(1);
  const fling = (dir: 1 | -1) => {
    animate(shown, 0, { duration: 0.3, delay: 0.12 });
    animate(x, dir * FLY, { duration: 0.4, ease: [0.4, 0, 0.9, 0.6] }).then(() => {
      // Back into the stack so it can be swiped again.
      x.jump(0);
      animate(shown, 1, { duration: 0.35, delay: 0.15 });
    });
  };

  // The buttons under the stack act on this card too.
  useEffect(() => {
    const onButton = (e: Event) => {
      if (!live) return;
      fling((e as CustomEvent<1 | -1>).detail);
    };
    window.addEventListener("fortuna-swipe", onButton);
    return () => window.removeEventListener("fortuna-swipe", onButton);
  });

  return (
    <motion.div
      style={{
        ...CARD_BOX,
        transform,
        opacity: shown,
        cursor: live ? "grab" : "default",
        // Horizontal drags are the card's; vertical ones still scroll the
        // page, which matters on a phone where the whole stage is pinned.
        touchAction: "pan-y",
      }}
      onPanStart={() => {
        if (live) hold(Infinity);
      }}
      onPan={(_, info) => {
        if (live) x.set(info.offset.x / k);
      }}
      onPanEnd={(_, info) => {
        if (!live) return;
        hold(HOLD_MS);
        const d = info.offset.x / k;
        if (Math.abs(d) > 90 || Math.abs(info.velocity.x) > 600) fling(d > 0 ? 1 : -1);
        else animate(x, 0, { type: "spring", stiffness: 420, damping: 30 });
      }}
    >
      <Card job={JOBS[2]} dim={dim} state={right} dir={1} altState={left} />
    </motion.div>
  );
}

const CARD_BOX: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: SLOTS[0].w,
  height: CARD_H,
  transformOrigin: "0 0",
  userSelect: "none",
};

function Card({
  job,
  dim,
  state,
  dir,
  altState,
}: {
  job: (typeof JOBS)[number];
  dim: MotionValue<number>;
  /** How far into its applied (1) or passed (-1) colour the card is. */
  state: MotionValue<number>;
  dir: 1 | -1;
  /** The other direction's colour, for the card that can go either way. */
  altState?: MotionValue<number>;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fffdf9",
        boxShadow: "0 8px 24px rgba(40, 40, 30, 0.12)",
        fontFamily: "var(--f-body)",
        color: "#111",
      }}
    >
      <div style={{ position: "absolute", left: 6, top: 6, right: 6, height: 280, borderRadius: 12, overflow: "hidden" }}>
        <Image
          src={job.photo.src}
          alt=""
          width={job.photo.w}
          height={job.photo.h}
          unoptimized
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, top: 304 }}>
        <div style={{ fontSize: 23, fontWeight: 500, letterSpacing: "-0.01em" }}>{job.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 16, fontWeight: 500 }}>
          {job.place}
          <span style={{ background: ORANGE, color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
            ★ {job.rating}
          </span>
        </div>
        <div style={{ height: 1, background: "#e4ded6", margin: "16px 0 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>
            <Row icon={<Clock />}>{job.hours}</Row>
            <Row icon={<Pin />} tone={ORANGE}>
              {job.area}
              <br />
              {job.distance}
            </Row>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>HOURLY</div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{job.pay}</div>
          </div>
        </div>
      </div>
      {/* Washed out while it waits its turn, as the back of the stack is. */}
      <motion.div style={{ position: "absolute", inset: 0, background: "#f7f5f0", opacity: dim }} />
      <StateFace colour={dir > 0 ? GREEN : "#f34545"} icon={dir > 0 ? "check" : "x"} amount={state} />
      {altState ? <StateFace colour="#f34545" icon="x" amount={altState} /> : null}
    </div>
  );
}

/** The solid applied or passed face, straight from the swipe states. */
function StateFace({
  colour,
  icon,
  amount,
}: {
  colour: string;
  icon: "check" | "x";
  amount: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        background: colour,
        opacity: amount,
        display: "flex",
        justifyContent: "center",
        paddingTop: 108,
      }}
    >
      <svg width="74" height="74" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {icon === "check" ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}

function Row({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", color: tone, marginTop: 4 }}>
      <span style={{ width: 14, display: "inline-flex", justifyContent: "center", paddingTop: 4 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function Header() {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 50, height: 44 }}>
      <svg style={{ position: "absolute", left: 32, top: 6 }} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="12" cy="9" r="6" fill={GREEN} />
        <path d="M1 27c0-6.6 5-11 11-11s11 4.4 11 11z" fill={GREEN} />
        <circle cx="24" cy="4" r="3" fill={ORANGE} />
      </svg>
      {/* At the Home frame's own position and width — 116 wide at (129, 59) —
          in a box with no line height, so its top-left corner is the
          wordmark's and the f the camera flies into is where it is expected
          to be. */}
      <div style={{ position: "absolute", left: 129, top: 9, display: "flex", fontSize: 22.5, lineHeight: 0 }}>
        <FortunaWordmark title="fortuna" />
      </div>
      <svg style={{ position: "absolute", right: 32, top: 8 }} width="28" height="26" viewBox="0 0 28 26" aria-hidden="true">
        <rect x="1" y="7" width="26" height="18" rx="4" fill="#6f8b81" />
        <rect x="9" y="2" width="10" height="7" rx="2" fill="none" stroke="#6f8b81" strokeWidth="2.4" />
      </svg>
    </div>
  );
}

function Buttons() {
  const press = (dir: 1 | -1) => {
    hold(HOLD_MS);
    window.dispatchEvent(new CustomEvent("fortuna-swipe", { detail: dir }));
  };
  return (
    <>
      <button
        type="button"
        aria-label="Pass on this job"
        onClick={() => press(-1)}
        style={{ ...BUTTON, left: 97, background: "#ff8989" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7l10 10M17 7L7 17" stroke="#b01212" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Apply to this job"
        onClick={() => press(1)}
        style={{ ...BUTTON, left: 213, background: "#ade495" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#298800" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}

const BUTTON: React.CSSProperties = {
  position: "absolute",
  top: 683,
  width: 64,
  height: 64,
  borderRadius: 16,
  border: "none",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(40, 40, 30, 0.12)",
};

function Clock() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <path
        d="M5.5 0C2.46169 0 0 2.46169 0 5.5C0 8.53831 2.46169 11 5.5 11C8.53831 11 11 8.53831 11 5.5C11 2.46169 8.53831 0 5.5 0ZM5.5 9.93548C3.03831 9.93548 1.06452 7.96169 1.06452 5.5C1.06452 3.06048 3.03831 1.06452 5.5 1.06452C7.93952 1.06452 9.93548 3.06048 9.93548 5.5C9.93548 7.96169 7.93952 9.93548 5.5 9.93548ZM6.85282 7.62903C6.98589 7.71774 7.14113 7.69556 7.22984 7.5625L7.65121 7.00806C7.73992 6.875 7.71774 6.71976 7.58468 6.63105L6.12097 5.54435V2.39516C6.12097 2.2621 5.9879 2.12903 5.85484 2.12903H5.14516C4.98992 2.12903 4.87903 2.2621 4.87903 2.39516V6.05444C4.87903 6.12097 4.90121 6.20968 4.96774 6.25403L6.85282 7.62903Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Pin() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true">
      <path
        d="M4.03125 11.7541C4.24219 12.082 4.73438 12.082 4.94531 11.7541C8.36719 6.83707 9 6.32195 9 4.49561C9 2.01366 6.98438 0 4.5 0C1.99219 0 0 2.01366 0 4.49561C0 6.32195 0.609375 6.83707 4.03125 11.7541Z"
        fill={ORANGE}
      />
    </svg>
  );
}

/**
 * For readers who have asked for less motion: the same work, laid out still.
 * Nothing pinned, nothing scrubbed — the phone, the two users and a poster
 * in a row that wraps.
 */
function StillReveal() {
  const items: [string, number, number][] = [
    ["/fortuna/reveal/phone-seeker.webp", 287, 640],
    ["/fortuna/reveal/phone-employer.webp", 287, 640],
    ["/fortuna/reveal/poster.webp", 1013, 1800],
  ];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 24,
        margin: "clamp(40px, 7vh, 80px) 0",
      }}
    >
      {items.map(([src, w, h]) => (
        <Shot key={src} src={src} w={w} h={h} height={360} />
      ))}
    </div>
  );
}

/** Overshoots past 1 and settles back; `s` is how far. */
function backOut(t: number, s = 1.70158) {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}
function easeIn2(t: number) {
  return t * t;
}
function easeOut2(t: number) {
  return 1 - (1 - t) * (1 - t);
}
function easeIn3(t: number) {
  return t * t * t;
}
function easeOut3(t: number) {
  return 1 - (1 - t) ** 3;
}
function easeIn(t: number) {
  return t * t;
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}
