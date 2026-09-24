"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { DOTS, GLOBE, MIAMI } from "@/content/globe-dots";

/**
 * The dot field: turns with the scroll, scatters under the cursor.
 *
 * A 2D canvas rather than SVG. Server-rendered SVG costs no JavaScript and was
 * right while the dots never moved — but both of these move them, and pushing
 * three and a half thousand DOM nodes around a frame at a time is not
 * something a browser forgives. A canvas redraws the lot as pixels instead.
 *
 * It idles properly. There is no ambient animation: frames are drawn while the
 * scroll is moving or the cursor is in range, and the loop stops the moment
 * the last dot settles.
 */

const { W, H, CX, CY, R, SPIN, LAND_ROTATE, SHIFT_X, SHIFT_Y } = GLOBE;

/** The screen transform. Constant, so its trig is computed once, not per dot. */
const LR = (LAND_ROTATE * Math.PI) / 180;
const LR_COS = Math.cos(LR);
const LR_SIN = Math.sin(LR);
/** Horizon, squared — comparing squares avoids a square root per dot. */
const EDGE_SQ = (R - 3) * (R - 3);
const SPIN_RAD = (SPIN * Math.PI) / 180;

const REACH = 92;
const SHOVE = 17;
const EASE = 0.14;
const SETTLED = 0.05;
const DOT_COLOR = "64, 68, 67";

/**
 * The pin's impact.
 *
 * A ring that travels out from Miami and dies, rather than a patch that
 * swells and shrinks: a ring is what a surface actually does when something
 * lands on it, and it costs the same. Deliberately small and short — this is
 * a flinch, not an event.
 */
const SHOCK_MS = 620;
/** How far the ring gets, in frame units. */
const SHOCK_REACH = 104;
/** Peak displacement of a dot sitting exactly on the ring, in frame units. */
const SHOCK_AMP = 6.2;
/** Thickness of the ring. Wider reads as a wobble, tighter as a glitch. */
const SHOCK_BAND = 15;
/** Everything the ring can ever touch, squared, for one cheap early-out. */
const SHOCK_MAX_SQ = (SHOCK_REACH + SHOCK_BAND * 2) ** 2;

export default function GlobeCanvas({
  progress,
  impact,
}: {
  progress: MotionValue<number>;
  /** Flips once, when the pin lands, to set the ring off. */
  impact: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // The ring lives inside the draw effect's closure, so firing it from a prop
  // change means leaving a handle behind rather than re-running the effect —
  // which would rebuild every buffer and lose the cursor's current state.
  const fire = useRef<() => void>(() => {});

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = DOTS.length;
    // Displacement per dot. Flat arrays, not objects: walked thousands of
    // times a frame.
    const ox = new Float32Array(n);
    const oy = new Float32Array(n);
    // The shock is not eased. It has its own short life and its own shape, and
    // running it through the cursor's spring would smear the ring into a blur.
    const rx = new Float32Array(n);
    const ry = new Float32Array(n);

    let cursor: { x: number; y: number } | null = null;
    let spin = still ? SPIN_RAD : 0;
    let scale = 1;
    let dpr = 1;
    let raf = 0;
    let onScreen = true;
    let shockFrom = 0;

    const size = () => {
      const w = box.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * dpr);
      el.height = Math.round(((w * H) / W) * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${(w * H) / W}px`;
      scale = w / W;
      ctx.fillStyle = `rgb(${DOT_COLOR})`;
    };

    /**
     * One frame.
     *
     * Per dot: a rotation about the polar axis, a visibility test, the fixed
     * screen transform, a horizon test, then a fill. Twelve or so operations,
     * no trigonometry — the two angles it needs are computed once above.
     */
    const draw = () => {
      const k = scale * dpr;
      const ca = Math.cos(spin);
      const sa = Math.sin(spin);
      ctx.clearRect(0, 0, el.width, el.height);

      for (let i = 0; i < n; i++) {
        const d = DOTS[i];
        const x = d[0] * ca + d[2] * sa;
        const z = -d[0] * sa + d[2] * ca;
        if (z <= 0.04) continue;

        const px = R * x;
        const py = -R * d[1];
        const sx = px * LR_COS + py * LR_SIN + SHIFT_X;
        const sy = -px * LR_SIN + py * LR_COS + SHIFT_Y;
        // The shift pushes land off the body it is painted on, so anything
        // past the horizon is dropped. It has to happen here rather than at
        // build time now, because what is inside changes as the planet turns.
        if (sx * sx + sy * sy > EDGE_SQ) continue;

        const fy = CY + sy;
        if (fy > H + 8) continue;

        ctx.globalAlpha = 0.06 + 0.92 * z;
        ctx.beginPath();
        ctx.arc(
          (CX + sx + ox[i] + rx[i]) * k,
          (fy + oy[i] + ry[i]) * k,
          (0.3 + 0.95 * z) * k,
          0,
          6.2832,
        );
        ctx.fill();
      }
    };

    /**
     * Advances the impact ring. Returns whether it is still alive.
     *
     * Most dots are nowhere near the ring at any given moment, so the squared
     * distance check throws them out before anything expensive happens.
     */
    const shockStep = (now: number) => {
      if (!shockFrom) return false;
      const age = (now - shockFrom) / SHOCK_MS;
      if (age >= 1) {
        shockFrom = 0;
        rx.fill(0);
        ry.fill(0);
        return false;
      }

      const ring = age * SHOCK_REACH;
      // Squared falloff, so it leaves quietly rather than switching off.
      const amp = SHOCK_AMP * (1 - age) ** 2;
      const ca = Math.cos(spin);
      const sa = Math.sin(spin);

      for (let i = 0; i < n; i++) {
        const d = DOTS[i];
        const px = R * (d[0] * ca + d[2] * sa);
        const py = -R * d[1];
        const dx = CX + px * LR_COS + py * LR_SIN + SHIFT_X - MIAMI.x;
        const dy = CY - px * LR_SIN + py * LR_COS + SHIFT_Y - MIAMI.y;
        const sq = dx * dx + dy * dy;
        if (sq > SHOCK_MAX_SQ) {
          rx[i] = 0;
          ry[i] = 0;
          continue;
        }
        const dist = Math.sqrt(sq);
        const off = (dist - ring) / SHOCK_BAND;
        // A triangular band instead of a gaussian: an exp per dot per frame
        // buys nothing the eye can see at this size.
        const band = off > 1 || off < -1 ? 0 : 1 - Math.abs(off);
        if (band === 0 || dist < 0.001) {
          rx[i] = 0;
          ry[i] = 0;
          continue;
        }
        const f = (amp * band) / dist;
        rx[i] = dx * f;
        ry[i] = dy * f;
      }
      return true;
    };

    /** Advances the cursor scatter. Returns whether anything still moves. */
    const settleStep = () => {
      let moving = false;
      const cx = cursor?.x ?? 0;
      const cy = cursor?.y ?? 0;
      const ca = Math.cos(spin);
      const sa = Math.sin(spin);
      for (let i = 0; i < n; i++) {
        const d = DOTS[i];
        let tx = 0;
        let ty = 0;
        if (cursor) {
          const x = d[0] * ca + d[2] * sa;
          const px = R * x;
          const py = -R * d[1];
          const dx = CX + px * LR_COS + py * LR_SIN + SHIFT_X - cx;
          const dy = CY - px * LR_SIN + py * LR_COS + SHIFT_Y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH && dist > 0.001) {
            // Inverse square, so the nudge stays local and the edge of the
            // effect is not a visible circle.
            const f = (1 - dist / REACH) ** 2 * SHOVE;
            tx = (dx / dist) * f;
            ty = (dy / dist) * f;
          }
        }
        ox[i] += (tx - ox[i]) * EASE;
        oy[i] += (ty - oy[i]) * EASE;
        // Distance left to travel, not distance from home. A cursor parked
        // inside the field holds its dots at a standing offset forever; asking
        // whether they are displaced would spin the loop drawing identical
        // frames for as long as the reader leaves the mouse there.
        if (!moving && (Math.abs(tx - ox[i]) > SETTLED || Math.abs(ty - oy[i]) > SETTLED)) {
          moving = true;
        }
      }
      return moving;
    };

    const tick = () => {
      const alive = shockStep(performance.now());
      const moving = settleStep();
      draw();
      raf = (moving || alive) && onScreen && !still ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf && onScreen && !still) raf = requestAnimationFrame(tick);
    };

    size();
    draw();

    // The spin is scrubbed, so a scroll frame only has to redraw — the scatter
    // is untouched and its loop is left alone.
    const unsub = progress.on("change", (p) => {
      if (still) return;
      spin = SPIN_RAD * p;
      if (onScreen && !raf) draw();
    });

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (!onScreen && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(box);

    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(box);

    const move = (e: globalThis.PointerEvent) => {
      if (still) return;
      const b = box.getBoundingClientRect();
      cursor = { x: (e.clientX - b.left) / scale, y: (e.clientY - b.top) / scale };
      kick();
    };
    const leave = () => {
      cursor = null;
      kick();
    };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);

    fire.current = () => {
      if (still) return;
      shockFrom = performance.now();
      kick();
    };

    return () => {
      fire.current = () => {};
      if (raf) cancelAnimationFrame(raf);
      unsub();
      io.disconnect();
      ro.disconnect();
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave);
    };
  }, [progress]);

  useEffect(() => {
    if (impact) fire.current();
  }, [impact]);

  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvas} style={{ display: "block" }} aria-hidden="true" />
    </div>
  );
}
