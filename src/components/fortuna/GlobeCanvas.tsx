"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { DOTS, GLOBE } from "@/content/globe-dots";

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

export default function GlobeCanvas({ progress }: { progress: MotionValue<number> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

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

    let cursor: { x: number; y: number } | null = null;
    let spin = still ? SPIN_RAD : 0;
    let scale = 1;
    let dpr = 1;
    let raf = 0;
    let onScreen = true;

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
          (CX + sx + ox[i]) * k,
          (fy + oy[i]) * k,
          (0.3 + 0.95 * z) * k,
          0,
          6.2832,
        );
        ctx.fill();
      }
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
      const moving = settleStep();
      draw();
      raf = moving && onScreen && !still ? requestAnimationFrame(tick) : 0;
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

    return () => {
      if (raf) cancelAnimationFrame(raf);
      unsub();
      io.disconnect();
      ro.disconnect();
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave);
    };
  }, [progress]);

  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvas} style={{ display: "block" }} aria-hidden="true" />
    </div>
  );
}
