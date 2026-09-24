"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent, type RefObject } from "react";
import type { MotionValue } from "motion/react";

/**
 * A dotted globe, built to match the Hero 216 reference.
 *
 * The trick in that image is that the sphere is not made of the dots. There is
 * a lit body underneath — near-white in the middle, shading to grey at the rim
 * — and the dots only mark land. The oceans are where you actually read the
 * curvature, because that is where the body shows through unobstructed. Take
 * the body away and you get a flat scatter; that was the previous version.
 *
 * Everything else is depth cues doing the work. Dots shrink and fade towards
 * the limb, the rim carries a faint inner shadow, and the whole thing is lit
 * from the upper left. No canvas, no WebGL, no per-frame maths: the grid is
 * projected once at module scope and emitted as static markup.
 */

/**
 * Land at five degrees. Columns run -170 to +20 west to east, rows 80N down to
 * 60S, so the hemisphere facing the Americas is covered end to end and West
 * Africa and Europe come round the right limb the way they do in the
 * reference.
 *
 * Kept as text on purpose. At this dot size a coastline is a handful of pixels
 * of decision, and correcting a picture beats correcting path data.
 */
const LAND = [
  "............#########.#########........",
  "..........###########.#########.....#..",
  ".#####################.########.....###",
  ".#####################...#####..#..####",
  ".######################...###......####",
  "..#####.################.........######",
  ".........###############.........######",
  "..........##############..........#####",
  "...........############...........#####",
  "............##########............#####",
  ".............########............######",
  "..............######.............######",
  "...............###.###..........#######",
  "................####...........########",
  "...................#####......#########",
  "...................######.....#########",
  "....................#######....########",
  "....................#########...#######",
  "....................#########....######",
  ".....................########....######",
  "......................#######....######",
  "......................######......#####",
  ".....................######........####",
  ".....................#####..........##.",
  ".....................####..............",
  ".....................###...............",
  ".....................###...............",
  ".....................##................",
  "......................................."
];
const LAT_TOP = 80;
const LON_LEFT = -170;
const STEP = 5;

/**
 * The frame, and the sphere in it.
 *
 * Proportioned off the reference: the body is a little over half the frame
 * wide, its centre sits below the bottom edge, and roughly the top 45 per cent
 * of it is in shot.
 */
const W = 760;
const H = 430;
const CX = 380;
const CY = 470;
const R = 365;

/** Longitude facing us, and how far the pole tips forward. */
const LON0 = -75;
const TILT = (4 * Math.PI) / 180;

const MIAMI = { lat: 25.76, lon: -80.19 };
/** A second marker, as the reference has, on the Pacific coast of Mexico. */
const SECOND = { lat: 19.4, lon: -99.1 };

const rad = (d: number) => (d * Math.PI) / 180;

function isLand(lat: number, lon: number) {
  const r = Math.round((LAT_TOP - lat) / STEP);
  const c = Math.round((lon - LON_LEFT) / STEP);
  return LAND[r]?.[c] === "#";
}

function project(lat: number, lon: number) {
  const la = rad(lat);
  const lo = rad(lon - LON0);
  const x = Math.cos(la) * Math.sin(lo);
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(lo);
  const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
  const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
  return { sx: CX + R * x, sy: CY - R * y2, depth: z2 };
}

/**
 * Built once, at module scope.
 *
 * Radius and opacity are rounded to coarse steps as well as small numbers:
 * hundreds of circles sharing a dozen values gzip far better than hundreds
 * differing in the third decimal.
 */
type Dot = { x: number; y: number; r: number; o: number };
type Point = { sx: number; sy: number; depth: number };

const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  // 1.9 degrees. The reference's texture comes from density — the dots
  // themselves are barely more than a pixel at the centre.
  for (let lat = -58; lat <= 82; lat += 1.9) {
    const lonStep = 1.9 / Math.max(Math.cos(rad(lat)), 0.2);
    for (let lon = -180; lon < 180; lon += lonStep) {
      if (!isLand(lat, lon)) continue;
      const { sx, sy, depth } = project(lat, lon);
      if (depth <= 0.05 || sy > H + 8) continue;
      out.push({
        x: Math.round(sx * 10) / 10,
        y: Math.round(sy * 10) / 10,
        r: Math.round((0.35 + 1.05 * depth) * 20) / 20,
        o: Math.round(Math.min(1, 0.06 + 0.92 * depth) * 20) / 20,
      });
    }
  }
  return out;
})();

const PIN = project(MIAMI.lat, MIAMI.lon);
const PIN2 = project(SECOND.lat, SECOND.lon);

const MAX_TILT = 11;
const REACH = 320;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function Marker({
  at,
  delay,
  reduced,
  rotateX,
  rotateY,
  innerRef,
}: {
  at: Point;
  delay: number;
  reduced: boolean;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  innerRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.div
      ref={innerRef}
      initial={reduced ? false : { scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 330, damping: 14, mass: 0.6, delay }}
      style={{
        position: "absolute",
        left: `${(at.sx / W) * 100}%`,
        top: `${(at.sy / H) * 100}%`,
        width: "2.1%",
        aspectRatio: "1",
        marginLeft: "-1.05%",
        marginTop: `${(-1.05 * W) / H}%`,
        display: "grid",
        placeItems: "center",
        transformPerspective: 200,
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {/* The bloom around each marker in the reference is a blur, not a ring. */}
      <span
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
          transform: "translateZ(5px)",
        }}
      />
    </motion.div>
  );
}

export default function MiamiGlobe({ label = "Miami, Florida" }: { label?: string }) {
  const reduced = useReducedMotion();
  const marker = useRef<HTMLDivElement>(null);

  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, { stiffness: 150, damping: 18, mass: 0.5 });
  const sy = useSpring(ty, { stiffness: 150, damping: 18, mass: 0.5 });
  const rotateY = useTransform(sx, [-1, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-1, 1], [MAX_TILT, -MAX_TILT]);

  function track(e: PointerEvent<HTMLDivElement>) {
    if (reduced || !marker.current) return;
    const b = marker.current.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width / 2);
    const dy = e.clientY - (b.top + b.height / 2);
    const envelope = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
    tx.set(clamp(dx / (b.width / 2)) * envelope);
    ty.set(clamp(dy / (b.height / 2)) * envelope);
  }

  return (
    <div
      onPointerMove={track}
      onPointerLeave={() => {
        tx.set(0);
        ty.set(0);
      }}
      style={{
        position: "relative",
        width: "min(760px, 100%)",
        margin: "34px auto 0",
        aspectRatio: `${W} / ${H}`,
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          {/* The body. Lit from the upper left, and never quite white — on
              cream a pure white sphere reads as a hole in the page. */}
          <radialGradient id="fg-body" cx="36%" cy="28%" r="76%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="58%" stopColor="#fbf9f4" />
            <stop offset="100%" stopColor="#e9e7e1" />
          </radialGradient>

          {/* Contact shadow at the rim. Without it the body has no edge and
              the whole thing flattens into a pale disc. */}
          <radialGradient id="fg-rim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#32443e" stopOpacity="0" />
            <stop offset="84%" stopColor="#32443e" stopOpacity="0" />
            <stop offset="93%" stopColor="#32443e" stopOpacity="0.045" />
            <stop offset="100%" stopColor="#32443e" stopOpacity="0.13" />
          </radialGradient>

          {/* A short fade at the very bottom. The reference is cut by the
              viewport; mid-page a hard line reads as a clipping bug, so the
              last few per cent dissolve instead. */}
          <linearGradient id="fg-cut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="93%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="fg-cut-mask">
            <rect width={W} height={H} fill="url(#fg-cut)" />
          </mask>
        </defs>

        <g mask="url(#fg-cut-mask)">
          <circle cx={CX} cy={CY} r={R} fill="url(#fg-body)" />
          <circle cx={CX} cy={CY} r={R} fill="url(#fg-rim)" />
          <g fill="#404443">
            {DOTS.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fillOpacity={d.o} />
            ))}
          </g>
        </g>
      </svg>

      <Marker at={PIN} delay={0.45} reduced={!!reduced} rotateX={rotateX} rotateY={rotateY} innerRef={marker} />
      <Marker at={PIN2} delay={0.6} reduced={!!reduced} rotateX={rotateX} rotateY={rotateY} />

      <span className="sr-only">{label}</span>
    </div>
  );
}
