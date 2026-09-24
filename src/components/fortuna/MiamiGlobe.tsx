"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent } from "react";

/**
 * A dotted globe with Miami marked, after the references.
 *
 * The continents are not drawn, they are sampled. Dots are laid out on a
 * sphere at even spacing, projected orthographically, and kept only where they
 * fall on land — so the coastlines emerge from the grid rather than being
 * traced, which is what gives the references their look and what makes an
 * approximate landmass acceptable. Dots shrink and fade toward the limb, and
 * that alone is what reads as curvature; there is no shading anywhere.
 *
 * Still no canvas. The whole thing is generated once at module scope and
 * emitted as static SVG, so rendering it costs a paint and nothing else.
 */

/**
 * Land, at five degrees, for the hemisphere that faces us.
 *
 * Columns run -165 to -15 west to east, rows 75N down to 55S. Deliberately
 * legible as text: at dot resolution the coastline is a dozen pixels of
 * decision, and editing this is easier than editing a path. Everything outside
 * the grid is ocean, which for a globe centred on the Americas is true.
 */
const LAND = [
  "........####################...",
  "#############################..",
  "######################..#####..",
  "#######################........",
  ".######################........",
  "......#################........",
  ".......################........",
  "........##############.........",
  ".........############..........",
  "..........##########...........",
  "...........####..#.............",
  "............####.###...........",
  "..............####.............",
  ".................#####.........",
  ".................######........",
  "..................#######......",
  "..................#########....",
  "..................#########....",
  "...................########....",
  "....................#######....",
  "....................######.....",
  "...................######......",
  "...................#####.......",
  "...................####........",
  "...................###.........",
  "...................###.........",
  "...................##..........",
];
const LAT_TOP = 75;
const LON_LEFT = -165;
const STEP = 5;

/**
 * The frame, and where the sphere sits in it.
 *
 * The centre has to be INSIDE the picture, not below it. With the centre below
 * the bottom edge only northern latitudes projected into view, so the whole of
 * South America fell off and what was left was a small cluster around the
 * Great Lakes. At CY just under the radius the top of the globe clears the top
 * edge by 30 and the frame still reaches about 25 degrees south, which is the
 * Americas end to end.
 */
const W = 760;
const H = 460;
const CX = 380;
const CY = 330;
const R = 300;

/** Longitude facing the viewer, and how far the north pole tips forward. */
const LON0 = -92;
const TILT = (12 * Math.PI) / 180;

const MIAMI = { lat: 25.76, lon: -80.19 };

const rad = (d: number) => (d * Math.PI) / 180;

function isLand(lat: number, lon: number) {
  const r = Math.round((LAT_TOP - lat) / STEP);
  const c = Math.round((lon - LON_LEFT) / STEP);
  return LAND[r]?.[c] === "#";
}

/** Orthographic projection, with the tilt applied. */
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

type Dot = { x: number; y: number; r: number; o: number };

/**
 * Built once, at module scope. Roughly even spacing means the longitude step
 * has to open up towards the poles, or the dots crowd into a solid cap.
 */
const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  // 2.6 degrees. At 4 the grid was too coarse to read as a surface — the
  // references get their texture from density, not from the dots themselves.
  for (let lat = -56; lat <= 80; lat += 2.6) {
    const lonStep = 2.6 / Math.max(Math.cos(rad(lat)), 0.22);
    for (let lon = -180; lon < 180; lon += lonStep) {
      if (!isLand(lat, lon)) continue;
      const { sx, sy, depth } = project(lat, lon);
      // Behind the sphere, or below the frame.
      if (depth <= 0.06 || sy > H + 6) continue;
      out.push({
        x: Math.round(sx * 10) / 10,
        y: Math.round(sy * 10) / 10,
        // Rounded to coarse steps as well as small: hundreds of circles
        // differing only in the third decimal compress far worse than
        // hundreds sharing a dozen values.
        r: Math.round((0.95 + 1.3 * depth) * 20) / 20,
        o: Math.round(Math.min(1, 0.3 + 0.7 * depth) * 20) / 20,
      });
    }
  }
  return out;
})();

const PIN = project(MIAMI.lat, MIAMI.lon);

const MAX_TILT = 12;
const REACH = 300;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

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
        margin: "36px auto 4px",
        aspectRatio: `${W} / ${H}`,
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          {/* The globe stops at the bottom the way the references do: not cut,
              just no longer there. */}
          <linearGradient id="fg-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="74%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="fg-mask">
            <rect width={W} height={H} fill="url(#fg-fade)" />
          </mask>
        </defs>

        <g mask="url(#fg-mask)" fill="var(--f-petrol)">
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fillOpacity={d.o} />
          ))}
        </g>
      </svg>

      {/* Miami. One accent dot with a ring around it, which is how the
          references mark a place — no pin, no label. */}
      <motion.div
        ref={marker}
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ type: "spring", stiffness: 320, damping: 14, mass: 0.6, delay: 0.45 }}
        style={{
          position: "absolute",
          left: `${(PIN.sx / W) * 100}%`,
          top: `${(PIN.sy / H) * 100}%`,
          width: "3.4%",
          aspectRatio: "1",
          marginLeft: "-1.7%",
          marginTop: `${(-1.7 * W) / H}%`,
          display: "grid",
          placeItems: "center",
          transformPerspective: 220,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid var(--f-orange)",
            opacity: 0.45,
          }}
        />
        <span
          style={{
            width: "46%",
            height: "46%",
            borderRadius: "50%",
            background: "var(--f-orange)",
            transform: "translateZ(6px)",
            boxShadow: "0 0 10px rgba(245, 129, 32, 0.55)",
          }}
        />
      </motion.div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
