"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { DOTS, GLOBE } from "@/content/globe-dots";

/**
 * The rotating dot field, and the markers that ride with it.
 *
 * A 2D canvas, not SVG and not WebGL. SVG was right while the globe was still:
 * the dots could be server-rendered and cost no JavaScript at all. Spinning
 * changes the arithmetic — every dot moves every frame, and rewriting four
 * thousand DOM attributes sixty times a second is not something the browser
 * will forgive. A canvas redraws the lot as pixels instead.
 *
 * Measured before committing to it: 10,400 dots cost 0.5ms a frame, 3 per cent
 * of a frame's budget. At the 3,802 this ships it does not register. WebGL
 * would have been 185KB of JavaScript to do the same arithmetic on a GPU that
 * is not being troubled by it.
 *
 * The dots are unit vectors with the camera tilt already baked in, so a frame
 * is two multiplies and an add each — no trigonometry in the loop.
 */

const { W, H, CX, CY, R, SWEEP } = GLOBE;

/** Seconds for one full drift out and back. Long enough to read as one way. */
const PERIOD = 150;
const DOT_COLOR = "64, 68, 67";

const PLACES = [
  { lat: 25.76, lon: -80.19, label: "Miami, Florida" },
  { lat: 19.43, lon: -99.13, label: "Mexico City" },
];
/** Baked the same way the dots are, so markers and land move together. */
const LON0 = -75;
const TILT = (4 * Math.PI) / 180;
const MARKERS = PLACES.map(({ lat, lon, label }) => {
  const la = (lat * Math.PI) / 180;
  const lo = ((lon - LON0) * Math.PI) / 180;
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(lo);
  return {
    label,
    x: Math.cos(la) * Math.sin(lo),
    y: y * Math.cos(TILT) - z * Math.sin(TILT),
    z: y * Math.sin(TILT) + z * Math.cos(TILT),
  };
});

const MAX_TILT = 11;
const REACH = 320;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export default function GlobeCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pins = useRef<(HTMLDivElement | null)[]>([]);
  /** Cursor lean, kept in a ref so pointer moves never re-render. */
  const lean = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = el.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = 1;
    const size = () => {
      const w = box.clientWidth;
      const h = (w * H) / W;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      return w / W;
    };
    let scale = size();

    const draw = (angle: number) => {
      const k = scale * dpr;
      ctx.clearRect(0, 0, el.width, el.height);
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);

      for (let i = 0; i < DOTS.length; i++) {
        const d = DOTS[i];
        const x = d[0] * ca + d[2] * sa;
        const z = -d[0] * sa + d[2] * ca;
        // Behind the sphere.
        if (z <= 0.04) continue;
        const sy = (CY - R * d[1]) * k;
        if (sy > (H + 8) * k) continue;
        ctx.globalAlpha = 0.06 + 0.92 * z;
        ctx.beginPath();
        ctx.arc((CX + R * x) * k, sy, (0.3 + 0.95 * z) * k, 0, 6.2832);
        ctx.fill();
      }

      // The markers are DOM, so they can keep the bloom and the cursor lean.
      // Only their transform changes, which the compositor handles.
      for (let i = 0; i < MARKERS.length; i++) {
        const node = pins.current[i];
        if (!node) continue;
        const m = MARKERS[i];
        const x = m.x * ca + m.z * sa;
        const z = -m.x * sa + m.z * ca;
        node.style.opacity = z <= 0.06 ? "0" : "1";
        node.style.transform =
          `translate3d(${(CX + R * x) * scale}px, ${(CY - R * m.y) * scale}px, 0)` +
          ` translate(-50%, -50%)` +
          ` rotateX(${lean.current.y * -MAX_TILT}deg) rotateY(${lean.current.x * MAX_TILT}deg)`;
      }
    };

    ctx.fillStyle = `rgb(${DOT_COLOR})`;

    if (still) {
      draw(0);
      return;
    }

    let raf = 0;
    let running = false;
    const start = performance.now();
    const tick = (now: number) => {
      // Eased lean, so the markers settle rather than snapping.
      lean.current.x += (lean.current.tx - lean.current.x) * 0.12;
      lean.current.y += (lean.current.ty - lean.current.y) * 0.12;
      // Starts at the right and drifts left. The period is long enough that
      // the turn at each end is never perceptible as a turn.
      const t = ((now - start) / 1000 / PERIOD) * Math.PI * 2;
      draw((SWEEP * Math.PI) / 180 * Math.cos(t));
      raf = requestAnimationFrame(tick);
    };

    // Nothing runs while it is off screen. A drifting globe three sections up
    // the page is pure cost.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(tick);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(box);

    const ro = new ResizeObserver(() => {
      scale = size();
      ctx.fillStyle = `rgb(${DOT_COLOR})`;
      if (!running) draw(0);
    });
    ro.observe(box);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  function track(e: PointerEvent<HTMLDivElement>) {
    const node = pins.current[0];
    if (!node) return;
    const b = node.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width / 2);
    const dy = e.clientY - (b.top + b.height / 2);
    const envelope = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
    lean.current.tx = clamp(dx / (b.width / 2 || 1)) * envelope;
    lean.current.ty = clamp(dy / (b.height / 2 || 1)) * envelope;
  }

  return (
    <div
      ref={wrap}
      onPointerMove={track}
      onPointerLeave={() => {
        lean.current.tx = 0;
        lean.current.ty = 0;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <canvas ref={canvas} style={{ display: "block" }} aria-hidden="true" />

      {MARKERS.map((m, i) => (
        <div
          key={m.label}
          ref={(n) => {
            pins.current[i] = n;
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "2.1%",
            aspectRatio: "1",
            display: "grid",
            placeItems: "center",
            perspective: 200,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-115%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,129,32,0.55) 0%, rgba(245,129,32,0.22) 42%, rgba(245,129,32,0) 70%)",
            }}
          />
          <span
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "var(--f-orange)",
            }}
          />
          <span className="sr-only">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
