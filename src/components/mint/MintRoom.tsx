"use client";

import { useEffect, useRef } from "react";
import { ROOM_TOP } from "./colors";

/**
 * The room the Mint page sits in: a bare grey interior, the light of a
 * window out of shot thrown across the wall in long bars split by its
 * mullions, and sun through leaves dappling the floor.
 *
 * Painted, not modelled: everything that holds still is drawn once into one
 * canvas (redrawn only on resize), and the floor's dappled light is drawn
 * once into two more that sway with plain CSS transforms, so the browser
 * only ever moves finished layers about and never repaints them. Soft edges
 * come from canvas shadows, which every browser blurs the same way.
 *
 * Positions are in units of the screen's height, so the light keeps its
 * place at the left on any width, and the wall just runs further on a wide
 * screen.
 */

const WALL = "#a3a3a3";
const LIGHT = "rgba(255, 255, 255, 0.42)";
/** Where the floor starts, and the window's corner, in screen heights. */
const FLOOR_Y = 0.785;

export default function MintRoom() {
  const wall = useRef<HTMLCanvasElement>(null);
  const leavesA = useRef<HTMLCanvasElement>(null);
  const leavesB = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let t = 0;
    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // The light is all soft; drawing it at full device resolution would
      // only cost memory, so it is drawn at most at 1.25x.
      const dpr = Math.min(1.25, window.devicePixelRatio || 1);
      if (wall.current) paintWall(wall.current, w, h, dpr);
      if (leavesA.current) paintLeaves(leavesA.current, w, h, dpr, 7);
      if (leavesB.current) paintLeaves(leavesB.current, w, h, dpr, 23);
    };
    draw();
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(draw, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const layer: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" };
  return (
    <div
      aria-hidden="true"
      data-theme-color={ROOM_TOP}
      style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: WALL, pointerEvents: "none" }}
    >
      <canvas ref={wall} style={layer} />
      {/* The leaves outside, swaying: two patterns drifting out of step. */}
      {/* Only as tall as the floor, so the swaying layers are a strip, not
          the whole screen, and plain alpha rather than a blend mode, which
          would make the browser recomposite everything under them. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: `${FLOOR_Y * 100}%`, bottom: 0, overflow: "hidden" }}>
        <canvas ref={leavesA} className="mint-leaves-a" style={layer} />
        <canvas ref={leavesB} className="mint-leaves-b" style={{ ...layer, opacity: 0.7 }} />
      </div>
      <style>{`
        .mint-leaves-a { transform-origin: 30% 90%; animation: mint-sway-a 9s ease-in-out infinite alternate; will-change: transform; }
        .mint-leaves-b { transform-origin: 40% 95%; animation: mint-sway-b 13s ease-in-out infinite alternate; will-change: transform, opacity; }
        @keyframes mint-sway-a {
          0% { transform: translate(0, 0) rotate(0deg); }
          35% { transform: translate(0.6%, 0.15%) rotate(0.35deg); }
          70% { transform: translate(-0.4%, -0.1%) rotate(-0.25deg); }
          100% { transform: translate(0.3%, 0.2%) rotate(0.2deg); }
        }
        @keyframes mint-sway-b {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          50% { transform: translate(-0.8%, 0.2%) rotate(-0.4deg); opacity: 0.45; }
          100% { transform: translate(0.5%, -0.15%) rotate(0.3deg); opacity: 0.75; }
        }
        @media (prefers-reduced-motion: reduce) { .mint-leaves-a, .mint-leaves-b { animation: none; } }
      `}</style>
    </div>
  );
}

function setup(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  return g;
}

/**
 * Fill a path with soft edges: drawn far off the canvas with a shadow thrown
 * back on, so only the blurred shadow lands. Works the same in every browser,
 * unlike the canvas filter property.
 */
function soft(g: CanvasRenderingContext2D, path: Path2D, color: string, blur: number) {
  g.save();
  // Shadow offsets and blur are in device pixels, untouched by the canvas
  // transform, so they are scaled by it here to match the path.
  const k = g.getTransform().a;
  g.shadowColor = color;
  g.shadowBlur = blur * k;
  g.shadowOffsetX = 10000 * k;
  g.translate(-10000, 0);
  g.fillStyle = "#000";
  g.fill(path);
  g.restore();
}

function quad(pts: [number, number][]) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

function paintWall(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
  const g = setup(c, w, h, dpr);
  const H = h;
  const X = (v: number) => v * H;
  const fy = FLOOR_Y * H;

  // The wall: an even grey, a shade deeper low down and off to the right,
  // away from the light.
  let grad = g.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "#9f9f9f");
  grad.addColorStop(Math.min(1, X(0.35) / w), "#a3a3a3");
  grad.addColorStop(1, "#a6a6a6");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, fy);
  grad = g.createLinearGradient(0, 0, 0, fy);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.05)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.05)");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, fy);

  // The light from a window out of shot to the left, falling just in from
  // the screen's edge: two tall bars split by its mullions into four panes,
  // their crossbars sloping down to the right. Upper panes only, so none is
  // cut off by the floor.
  const panes: [number, number][] = [
    [0.04, 0.33],
    [0.35, 0.6],
  ];
  const bars: [number, number][] = [
    [0.035, 0.085],
    [0.095, 0.135],
  ];
  const slope = 0.75;
  for (const [x0, x1] of bars) {
    for (const [y0, y1] of panes) {
      const top = (x: number) => X(y0 + (x - bars[0][0]) * slope);
      const bot = (x: number) => Math.min(fy, X(y1 + (x - bars[0][0]) * slope));
      soft(g, quad([[X(x0), top(x0)], [X(x1), top(x1)], [X(x1), bot(x1)], [X(x0), bot(x0)]]), LIGHT, 7);
    }
  }

  // The floor: a little lighter than the wall, meeting it in one level
  // line, with a soft line of shadow along it.
  grad = g.createLinearGradient(0, fy, 0, h);
  grad.addColorStop(0, "#a8a8a8");
  grad.addColorStop(1, "#b1b1b1");
  g.fillStyle = grad;
  g.fillRect(0, fy, w, h - fy);
  soft(g, quad([[0, fy - 1], [w, fy - 1], [w, fy + 3], [0, fy + 3]]), "rgba(0, 0, 0, 0.16)", 5);
}

/** A small seeded random, so the leaves fall the same on every draw. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Sun through leaves on the floor: clusters of stretched, soft patches. */
function paintLeaves(c: HTMLCanvasElement, w: number, h: number, dpr: number, seed: number) {
  const H = h;
  const fy = FLOOR_Y * H;
  // The canvas covers just the floor, so it is drawn with the floor's top at 0.
  const g = setup(c, w, h - fy, dpr);
  const rnd = seeded(seed);
  // Mostly on the window side, thinning out to the right.
  const reach = Math.min(w, H * 1.1);
  for (let i = 0; i < 38; i++) {
    const x = Math.pow(rnd(), 1.7) * reach;
    const y = H * 0.03 + rnd() * (h - fy);
    const rx = H * (0.02 + rnd() * 0.06);
    const ry = rx * (0.22 + rnd() * 0.18);
    const p = new Path2D();
    p.ellipse(x, y, rx, ry, (rnd() - 0.5) * 0.4, 0, Math.PI * 2);
    const a = 0.14 + rnd() * 0.24;
    soft(g, p, `rgba(255, 255, 255, ${(a * 0.75).toFixed(2)})`, H * 0.016);
  }
}
