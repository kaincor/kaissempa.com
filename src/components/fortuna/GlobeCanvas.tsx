"use client";

import { useEffect, useRef } from "react";
import { DOTS, GLOBE } from "@/content/globe-dots";

/**
 * The dot field, with the cursor pushing through it.
 *
 * A 2D canvas rather than SVG. Server-rendered SVG would be free to draw and
 * cost no JavaScript, and that was right while the dots never moved — but
 * nudging four thousand of them under the cursor means rewriting four thousand
 * DOM attributes a frame, which no browser forgives. A canvas redraws the lot
 * as pixels for a fraction of a millisecond.
 *
 * It does nothing at all when nothing is happening. There is no ambient
 * animation here: the loop starts when the cursor arrives and stops once the
 * last dot has settled back, so an idle globe costs one paint and then zero.
 */

const { W, H } = GLOBE;

/** How far the cursor's influence reaches, in artwork units. */
const REACH = 92;
/** How hard dots are pushed out of its way at the centre of that reach. */
const SHOVE = 17;
/** Per-frame approach to the target. Lower is heavier. */
const EASE = 0.14;
/** Below this, the dot is home and the frame need not be redrawn for it. */
const SETTLED = 0.05;

const DOT_COLOR = "64, 68, 67";

export default function GlobeCanvas() {
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
    // Current displacement per dot, in artwork units. Flat arrays rather than
    // objects: this is walked several thousand times a frame.
    const ox = new Float32Array(n);
    const oy = new Float32Array(n);

    /** Cursor in artwork coordinates, or null when it is elsewhere. */
    let cursor: { x: number; y: number } | null = null;
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

    const draw = () => {
      const k = scale * dpr;
      ctx.clearRect(0, 0, el.width, el.height);
      for (let i = 0; i < n; i++) {
        const d = DOTS[i];
        ctx.globalAlpha = d[3];
        ctx.beginPath();
        ctx.arc((d[0] + ox[i]) * k, (d[1] + oy[i]) * k, d[2] * k, 0, 6.2832);
        ctx.fill();
      }
    };

    /** One step of the push-and-settle. Returns whether anything still moves. */
    const step = () => {
      let moving = false;
      const cx = cursor?.x ?? 0;
      const cy = cursor?.y ?? 0;
      for (let i = 0; i < n; i++) {
        const d = DOTS[i];
        let tx = 0;
        let ty = 0;
        if (cursor) {
          const dx = d[0] - cx;
          const dy = d[1] - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH && dist > 0.001) {
            // Falls off with the square, so the nudge is local and the edge of
            // the effect is not a visible circle.
            const f = (1 - dist / REACH) ** 2 * SHOVE;
            tx = (dx / dist) * f;
            ty = (dy / dist) * f;
          }
        }
        ox[i] += (tx - ox[i]) * EASE;
        oy[i] += (ty - oy[i]) * EASE;
        if (!moving && (Math.abs(ox[i] - tx) > SETTLED || Math.abs(tx) > SETTLED)) {
          moving = true;
        }
      }
      return moving;
    };

    const tick = () => {
      const moving = step();
      draw();
      // Stop the moment everything is home. An idle globe should not be
      // holding a frame loop open.
      raf = moving && onScreen ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (!raf && onScreen && !still) raf = requestAnimationFrame(tick);
    };

    size();
    draw();

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
      io.disconnect();
      ro.disconnect();
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvas} style={{ display: "block" }} aria-hidden="true" />
    </div>
  );
}
