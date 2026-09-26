"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * A quiet night sky for the green that sweeps up over the goals.
 *
 * Stars and a few constellations, drawn in the band's own cream at low
 * strength, with a soft light that follows the cursor and brings whatever it
 * passes over up out of the background. Not a dark sky: the ground stays
 * Fortuna green and the whole thing is meant to be noticed second, after the
 * words.
 *
 * It idles. There is no twinkle and no drift — frames are drawn only while the
 * cursor is near enough to change something, and the loop stops the moment the
 * light has faded back out. The reference this is built from does the same
 * thing, which is worth knowing: measured, its canvas is byte-identical over
 * two and a half seconds with the pointer away.
 *
 * The pointer is tracked on the window rather than on the canvas, and the
 * canvas never takes pointer events. It hangs over the section above it —
 * including the globe, which has cursor-reactive dots of its own — and a
 * decorative layer has no business swallowing those.
 */

/** Field stars, excluding the ones that belong to a constellation. */
const STAR_COUNT = 150;

/** How far the light reaches, as a share of the canvas's smaller side. */
const REACH = 0.34;
/** Pixels, whatever the reach works out to; keeps it sane on a wide screen. */
const REACH_MIN = 170;
const REACH_MAX = 330;

/**
 * Resting and lit strengths. The gap between them is the whole effect.
 *
 * Raised from a first pass that was too discreet — at rest the brightest star
 * peaked at 76 of 255 and the field read as a faint texture rather than as
 * stars. The gap still has to survive the lift, so the lit end went up with
 * the resting one rather than being eaten by it.
 */
const STAR_REST = 0.62;
const STAR_LIT = 1;
const LINE_REST = 0.16;
const LINE_LIT = 0.46;
/** The glow itself, at its centre. Barely there on purpose. */
const GLOW = 0.07;

/**
 * How far the field slides against the page, in pixels each way.
 *
 * Downward as the reader scrolls down, which is the opposite of what the
 * goals list does. A block that travels up faster than the page reads as
 * nearer; one that travels down reads as further off, and the sky should be
 * the furthest thing on the page.
 *
 * The canvas is this much taller than its window at both ends, so sliding it
 * never drags an empty edge into view.
 */
const DRIFT = 85;

/**
 * The shooting star.
 *
 * One every seven and a half seconds, somewhere in whatever part of the sky is
 * actually on screen at the time — the canvas is far taller than the window it
 * shows through, so a point picked anywhere in it would mostly fall where
 * nobody is looking.
 *
 * It costs frames only while it is crossing. Between streaks the loop stops
 * exactly as it did before, and it is not scheduled at all while the section
 * is off screen.
 */
const SHOOT_EVERY = 7500;
const SHOOT_MS = 950;
/** How long the streak is at full stretch, and how far it travels. */
const SHOOT_TAIL = 130;
const SHOOT_REACH = 360;
/** Brighter than a resting star, but only just — it is a glint, not a flare. */
const SHOOT_PEAK = 0.85;

/** How quickly the lit state follows the cursor, and when to call it settled. */
const EASE = 0.16;
const SETTLED = 0.004;

/**
 * Asterisms, in their own 0–1 space, placed and scaled into the sky below.
 *
 * They sit low in it. The sky is three quarters of a viewport tall and hangs
 * above the band, so by the time the sweep has finished the top half of it is
 * off the top of the screen — the part a reader actually looks at is the strip
 * just above the title.
 *
 * Real ones, and Ursa Major and Ursa Minor are here for a reason: the handle
 * of the Little Dipper ends at Polaris, which is the north star the section is
 * named after. Nobody has to notice that for the sky to work, but it is true.
 */
type Figure = {
  at: [number, number];
  scale: number;
  stars: [number, number][];
  lines: [number, number][];
};

const FIGURES: Figure[] = [
  {
    // Ursa Major, the Plough. Bowl of four, handle of three.
    //
    // Low and out to the right, past the edge of the text column where there
    // is empty band for it to sit in. It has to clear the taper at the foot of
    // the sky and the drift at both ends of its travel, which is most of why
    // it is not lower.
    at: [0.8, 0.7],
    scale: 0.26,
    stars: [
      [0, 0.35],
      [0.13, 0.44],
      [0.17, 0.22],
      [0.03, 0.14],
      [0.31, 0.18],
      [0.45, 0.11],
      [0.6, 0.2],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    // Ursa Minor. Index 0 is Polaris.
    at: [0.42, 0.27],
    scale: 0.17,
    stars: [
      [0, 0],
      [0.11, 0.13],
      [0.22, 0.28],
      [0.33, 0.37],
      [0.46, 0.32],
      [0.5, 0.47],
      [0.37, 0.52],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  {
    // Cassiopeia's W.
    at: [0.74, 0.33],
    scale: 0.2,
    stars: [
      [0, 0.1],
      [0.13, 0.31],
      [0.27, 0.07],
      [0.41, 0.3],
      [0.54, 0.04],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    // Orion: shoulders, belt, feet.
    at: [0.3, 0.55],
    scale: 0.17,
    stars: [
      [0, 0],
      [0.3, 0.05],
      [0.24, 0.36],
      [0.18, 0.33],
      [0.12, 0.3],
      [0.33, 0.6],
      [0.05, 0.62],
    ],
    lines: [
      [0, 1],
      [0, 4],
      [1, 2],
      [4, 3],
      [3, 2],
      [2, 5],
      [4, 6],
    ],
  },
];

/**
 * Fades at both ends.
 *
 * The bottom one is measured in pixels up from the bottom edge, not as a share
 * of the height, because what it has to clear is a fixed run of type — the
 * heading and the line under it — and not a fraction of a viewport. The field
 * carries on behind those and runs out in the gap before the numbered goals.
 *
 * The field now runs the full height of the band, so the bottom fade is a long
 * taper that reaches nothing exactly at the foot of it. The sky thins out as
 * the goals run out and is gone by the boundary with the section below, rather
 * than stopping somewhere in the middle of the band's padding.
 *
 * The top one keeps it from butting hard against the cream section above once
 * the sweep has finished.
 */
const SKY_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 14%, " +
  "#000 calc(100% - 115px), transparent 100%)";

/** Deterministic, so the field does not reshuffle on every resize. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Star = { x: number; y: number; r: number; base: number; lit: number };
type Seg = { x1: number; y1: number; x2: number; y2: number; lit: number };
/** A constellation at runtime: its own stars and lines, lit as one thing. */
type Group = { stars: Star[]; segs: Seg[]; lit: number };

export default function NightSky() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [-DRIFT, DRIFT]);

  useEffect(() => {
    const box = field.current;
    const el = canvas.current;
    if (!box || !el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let reach = REACH_MIN;
    /** Field stars only. Each catches the light on its own. */
    let stars: Star[] = [];
    /** The constellations. Each lights as a whole. */
    let groups: Group[] = [];
    /**
     * Where the pointer is on screen, not on the canvas.
     *
     * The canvas slides underneath it as the page scrolls, so a position
     * stored in canvas coordinates would go stale the moment the reader
     * scrolled without moving the mouse — the light would stick to the stars
     * it happened to be on. Converted against the canvas's live box each
     * frame instead.
     */
    let cursorClient: { x: number; y: number } | null = null;
    let cursor: { x: number; y: number } | null = null;
    let raf = 0;
    /** The streak in flight, if there is one. */
    let shoot: { t0: number; x: number; y: number; dx: number; dy: number } | null =
      null;
    let onScreen = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /** Brings `cursor` up to date with where the canvas currently is. */
    const locate = () => {
      if (!cursorClient) {
        cursor = null;
        return;
      }
      const r = el.getBoundingClientRect();
      cursor = { x: cursorClient.x - r.left, y: cursorClient.y - r.top };
    };

    const build = () => {
      // The sliding layer, not the canvas inside it. Measuring the canvas
      // would be circular: this function also sets the canvas's own height,
      // so the second call reads back whatever the first one wrote and the
      // field collapses — measured at 150px against a 1027px window.
      const rect = box.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      reach = Math.min(REACH_MAX, Math.max(REACH_MIN, Math.min(w, h) * REACH));

      const rand = rng(20220601);
      stars = [];
      groups = [];

      for (const fig of FIGURES) {
        const pts = fig.stars.map(([fx, fy]) => ({
          x: (fig.at[0] + fx * fig.scale) * w,
          y: (fig.at[1] + fy * fig.scale) * h,
        }));
        groups.push({
          stars: pts.map((p) => ({
            x: p.x,
            y: p.y,
            // A touch larger than the field, so the figures hold together.
            r: 1.1 + rand() * 0.7,
            base: 0.4 + rand() * 0.2,
            lit: 0,
          })),
          segs: fig.lines.map(([a, b]) => ({
            x1: pts[a].x,
            y1: pts[a].y,
            x2: pts[b].x,
            y2: pts[b].y,
            lit: 0,
          })),
          lit: 0,
        });
      }

      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: rand() * w,
          y: rand() * h,
          r: 0.6 + rand() * 1,
          base: 0.35 + rand() * 0.65,
          lit: 0,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (cursor) {
        // The light itself. Nothing but a soft wash — the reveal is carried by
        // the stars and the lines brightening, not by this.
        const g = ctx.createRadialGradient(
          cursor.x,
          cursor.y,
          0,
          cursor.x,
          cursor.y,
          reach,
        );
        g.addColorStop(0, `rgba(247, 245, 240, ${GLOW})`);
        g.addColorStop(0.55, `rgba(247, 245, 240, ${GLOW * 0.35})`);
        g.addColorStop(1, "rgba(247, 245, 240, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.lineWidth = 1;
      for (const g of groups) {
        const a = LINE_REST + (LINE_LIT - LINE_REST) * g.lit;
        ctx.strokeStyle = `rgba(247, 245, 240, ${a})`;
        ctx.beginPath();
        for (const s of g.segs) {
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
        ctx.stroke();
        for (const s of g.stars) {
          const sa = s.base * (STAR_REST + (STAR_LIT - STAR_REST) * g.lit);
          ctx.fillStyle = `rgba(247, 245, 240, ${sa})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * (1 + 0.5 * g.lit), 0, 6.2832);
          ctx.fill();
        }
      }

      for (const s of stars) {
        const a = s.base * (STAR_REST + (STAR_LIT - STAR_REST) * s.lit);
        ctx.fillStyle = `rgba(247, 245, 240, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (1 + 0.5 * s.lit), 0, 6.2832);
        ctx.fill();
      }

      if (shoot) {
        const age = (performance.now() - shoot.t0) / SHOOT_MS;
        if (age >= 1) {
          shoot = null;
        } else {
          // In fast, out slow, so it arrives as a glint and leaves as a fade.
          const fade = age < 0.18 ? age / 0.18 : (1 - age) / 0.82;
          const a = SHOOT_PEAK * fade;
          const travel = SHOOT_REACH * age;
          const hx = shoot.x + shoot.dx * travel;
          const hy = shoot.y + shoot.dy * travel;
          // The tail grows out of nothing rather than existing at full length
          // from the first frame, which would read as a line being wiped on.
          const tail = SHOOT_TAIL * Math.min(1, age * 3.5);
          const tx = hx - shoot.dx * tail;
          const ty = hy - shoot.dy * tail;

          const g = ctx.createLinearGradient(tx, ty, hx, hy);
          g.addColorStop(0, "rgba(247, 245, 240, 0)");
          g.addColorStop(1, `rgba(247, 245, 240, ${a})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();

          const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9);
          halo.addColorStop(0, `rgba(247, 245, 240, ${a * 0.55})`);
          halo.addColorStop(1, "rgba(247, 245, 240, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(hx, hy, 9, 0, 6.2832);
          ctx.fill();
        }
      }
    };

    /** Advances every lit value toward its target. Returns whether any moved. */
    const settle = () => {
      let moving = false;
      const cx = cursor?.x ?? 0;
      const cy = cursor?.y ?? 0;
      const r2 = reach * reach;

      for (const s of stars) {
        let t = 0;
        if (cursor) {
          const d2 = (s.x - cx) ** 2 + (s.y - cy) ** 2;
          // Squared falloff, so the edge of the light is not a visible circle.
          if (d2 < r2) t = (1 - Math.sqrt(d2) / reach) ** 2;
        }
        s.lit += (t - s.lit) * EASE;
        if (Math.abs(t - s.lit) > SETTLED) moving = true;
      }

      for (const g of groups) {
        let t = 0;
        if (cursor) {
          // Distance to the nearest star in the figure, not to each line on
          // its own. Lighting the parts separately makes a constellation
          // arrive in pieces and flicker as the cursor crosses it; one value
          // for the whole figure gives it a single steady glow.
          let best = Infinity;
          for (const s of g.stars) {
            const d2 = (s.x - cx) ** 2 + (s.y - cy) ** 2;
            if (d2 < best) best = d2;
          }
          if (best < r2) t = (1 - Math.sqrt(best) / reach) ** 2;
        }
        g.lit += (t - g.lit) * EASE;
        if (Math.abs(t - g.lit) > SETTLED) moving = true;
      }

      return moving;
    };

    const tick = () => {
      locate();
      const moving = settle();
      if (!moving && !cursor) {
        // Only with the pointer gone. The easing approaches zero without
        // reaching it, and stopping the loop mid-approach leaves the field
        // fractionally brighter than rest forever — 223 changed samples,
        // measured. Doing it whenever the loop stops is what made a
        // constellation glow up and then blink out under a resting cursor:
        // "settled" there means it has reached full brightness, not zero.
        for (const s of stars) s.lit = 0;
        for (const g of groups) g.lit = 0;
      }
      draw();
      raf = (moving || shoot) && !still ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf && !still) raf = requestAnimationFrame(tick);
    };

    build();
    draw();

    const move = (e: PointerEvent) => {
      if (still) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // A margin either side, so the light arrives before the pointer does
      // rather than snapping on at the edge.
      const pad = reach * 0.5;
      const near =
        x > -pad && x < rect.width + pad && y > -pad && y < rect.height + pad;
      if (!near) {
        if (!cursorClient) return;
        cursorClient = null;
      } else {
        cursorClient = { x: e.clientX, y: e.clientY };
      }
      kick();
    };

    /**
     * Fires a streak somewhere in the part of the sky the reader can see.
     *
     * The canvas is more than twice the height of its window and most of it is
     * off the top of the screen at any moment, so the start point is picked
     * from the canvas's overlap with the viewport rather than from the canvas.
     */
    const fire = () => {
      const r = el.getBoundingClientRect();
      const top = Math.max(0, -r.top);
      const bottom = Math.min(r.height, window.innerHeight - r.top);
      // Room for the streak to run without starting at the very bottom edge.
      const span = bottom - top - SHOOT_REACH * 0.6;
      if (span <= 0) return;

      const leftToRight = Math.random() < 0.5;
      // A shallow dive, the way they actually look.
      const angle = (18 + Math.random() * 16) * (Math.PI / 180);
      shoot = {
        t0: performance.now(),
        x: leftToRight ? Math.random() * w * 0.45 : w - Math.random() * w * 0.45,
        y: top + Math.random() * span,
        dx: (leftToRight ? 1 : -1) * Math.cos(angle),
        dy: Math.sin(angle),
      };
      kick();
    };

    const schedule = () => {
      clearTimeout(timer);
      if (still || !onScreen) return;
      timer = setTimeout(() => {
        fire();
        schedule();
      }, SHOOT_EVERY);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) schedule();
        else clearTimeout(timer);
      },
      { rootMargin: "0px" },
    );
    io.observe(box);

    window.addEventListener("pointermove", move, { passive: true });

    // Scrolling slides the canvas under the pointer, so the lit patch has to
    // be recomputed — but only while there is a pointer on it to light one.
    const unsub = drift.on("change", () => {
      if (cursorClient) kick();
    });

    const ro = new ResizeObserver(() => {
      build();
      draw();
    });
    ro.observe(box);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      unsub();
      clearTimeout(timer);
      io.disconnect();
      ro.disconnect();
    };
  }, [drift]);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {/* The ambient shift. A hint of the band's own dark green pooled at the
          top, going to nothing well before the bottom edge — the tongue has to
          meet the band below it in exactly the band's colour or the join shows
          as a line. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(41, 136, 0, 0.16) 0%, rgba(41, 136, 0, 0.06) 45%, rgba(41, 136, 0, 0) 78%)",
        }}
      />
      {/* The window. It holds still against the band, carries the taper and
          clips the field sliding behind it — the fade has to stay welded to
          the foot of the band, so it cannot travel with the stars. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          maskImage: SKY_MASK,
          WebkitMaskImage: SKY_MASK,
        }}
      >
        <motion.div
          ref={field}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -DRIFT,
            bottom: -DRIFT,
            y: reducedMotion ? 0 : drift,
            willChange: "transform",
          }}
        >
          <canvas
            ref={canvas}
            style={{ position: "absolute", inset: 0, display: "block" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
