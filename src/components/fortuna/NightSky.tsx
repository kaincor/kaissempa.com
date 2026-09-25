"use client";

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

/** Resting and lit strengths. The gap between them is the whole effect. */
const STAR_REST = 0.42;
const STAR_LIT = 0.95;
const LINE_REST = 0.1;
const LINE_LIT = 0.36;
/** The glow itself, at its centre. Barely there on purpose. */
const GLOW = 0.055;

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
    at: [0.06, 0.34],
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
 * That gap is the whole budget, and it is narrow. Measured from the band's top
 * edge, the intro line ends as low as 120px on a desktop and the list starts
 * as high as 161px on a phone, so the fade has 41px to live in. It is 32 wide
 * and sits in the middle of that.
 *
 * The top one keeps it from butting hard against the cream section above once
 * the sweep has finished.
 */
const SKY_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 14%, " +
  "#000 calc(100% - 78px), transparent calc(100% - 46px))";

/** Deterministic, so the field does not reshuffle on every resize. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Star = { x: number; y: number; r: number; base: number; lit: number };

export default function NightSky() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const el = canvas.current;
    if (!box || !el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let reach = REACH_MIN;
    let stars: Star[] = [];
    /** Constellation segments, in pixels, with their own eased brightness. */
    let segs: { x1: number; y1: number; x2: number; y2: number; lit: number }[] = [];
    let cursor: { x: number; y: number } | null = null;
    let raf = 0;

    const build = () => {
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
      segs = [];

      for (const fig of FIGURES) {
        const pts = fig.stars.map(([fx, fy]) => ({
          x: (fig.at[0] + fx * fig.scale) * w,
          y: (fig.at[1] + fy * fig.scale) * h,
        }));
        for (const p of pts) {
          stars.push({
            x: p.x,
            y: p.y,
            // A touch larger than the field, so the figures hold together.
            r: 1.1 + rand() * 0.7,
            base: 0.4 + rand() * 0.2,
            lit: 0,
          });
        }
        for (const [a, b] of fig.lines) {
          segs.push({
            x1: pts[a].x,
            y1: pts[a].y,
            x2: pts[b].x,
            y2: pts[b].y,
            lit: 0,
          });
        }
      }

      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: rand() * w,
          y: rand() * h,
          r: 0.5 + rand() * 0.9,
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
      for (const s of segs) {
        const a = LINE_REST + (LINE_LIT - LINE_REST) * s.lit;
        ctx.strokeStyle = `rgba(247, 245, 240, ${a})`;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }

      for (const s of stars) {
        const a = s.base * (STAR_REST + (STAR_LIT - STAR_REST) * s.lit);
        ctx.fillStyle = `rgba(247, 245, 240, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (1 + 0.5 * s.lit), 0, 6.2832);
        ctx.fill();
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

      for (const s of segs) {
        let t = 0;
        if (cursor) {
          // Measured to the segment's middle: a line lights as a whole, which
          // is what makes the figure read rather than a piece of it.
          const mx = (s.x1 + s.x2) / 2;
          const my = (s.y1 + s.y2) / 2;
          const d2 = (mx - cx) ** 2 + (my - cy) ** 2;
          if (d2 < r2) t = (1 - Math.sqrt(d2) / reach) ** 2;
        }
        s.lit += (t - s.lit) * EASE;
        if (Math.abs(t - s.lit) > SETTLED) moving = true;
      }

      return moving;
    };

    const tick = () => {
      const moving = settle();
      if (!moving) {
        // The easing approaches zero without reaching it, and stopping the
        // loop mid-approach leaves the field fractionally brighter than rest
        // forever. Measured at 223 changed samples before this.
        for (const s of stars) s.lit = 0;
        for (const s of segs) s.lit = 0;
      }
      draw();
      raf = moving && !still ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf && !still) raf = requestAnimationFrame(tick);
    };

    build();
    draw();

    const move = (e: PointerEvent) => {
      if (still) return;
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // A margin either side, so the light arrives before the pointer does
      // rather than snapping on at the edge.
      const pad = reach * 0.5;
      const near =
        x > -pad && x < rect.width + pad && y > -pad && y < rect.height + pad;
      if (!near) {
        if (!cursor) return;
        cursor = null;
      } else {
        cursor = { x, y };
      }
      kick();
    };

    window.addEventListener("pointermove", move, { passive: true });

    const ro = new ResizeObserver(() => {
      build();
      draw();
    });
    ro.observe(box);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      ro.disconnect();
    };
  }, []);

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
      <canvas
        ref={canvas}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          // Thins out toward the title rather than stopping at a line.
          maskImage: SKY_MASK,
          WebkitMaskImage: SKY_MASK,
        }}
      />
    </div>
  );
}
