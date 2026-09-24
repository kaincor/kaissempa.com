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
 * A pin dropped on Miami, from Kai's sketch.
 *
 * The globe is a horizon rather than a ball: one very large circle whose top
 * arc crosses the frame, so what shows is the curve of somewhere much bigger
 * than the picture. Florida hangs off that curve and the marker floats above
 * it, tail down, exactly as drawn.
 *
 * Deliberately not the reference, which is a WebGL particle sphere on two
 * full-size canvases. That is a lot of machinery to say "a place on Earth",
 * and this page will carry several of these. This is one inline SVG of about
 * thirty nodes, animating nothing but transform and opacity, so it composites
 * on the GPU and costs essentially nothing to leave on the page.
 */

/** Miami, in the artwork's own coordinates. The marker's tail lands here. */
const MIAMI = { x: 251, y: 170 };
/** Degrees the marker leans toward the cursor. */
const MAX_TILT = 15;
/** How far away the cursor can be and still move it, in px. */
const REACH = 240;

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
    // Same shape as the footer chips: offset from centre normalised to the
    // element's own size, damped by distance so it settles when you leave.
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
        width: "min(440px, 100%)",
        margin: "40px auto 12px",
        aspectRatio: "440 / 300",
      }}
    >
      <svg
        viewBox="0 0 440 300"
        width="100%"
        aria-hidden="true"
        focusable="false"
        style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="fg-sea" cx="40%" cy="10%" r="95%">
            <stop offset="0%" stopColor="var(--f-petrol-light)" />
            <stop offset="58%" stopColor="var(--f-petrol)" />
            <stop offset="100%" stopColor="var(--f-forest)" />
          </radialGradient>

          {/* The globe is dissolved at its edges rather than cropped. A linear
              fade only handled the bottom and left the circle meeting the
              frame in a hard vertical line down each side; going radial takes
              the sides with it, so the world simply stops being in focus. */}
          <radialGradient id="fg-fade" cx="50%" cy="20%" r="82%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="52%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="fg-mask">
            <rect width="440" height="300" fill="url(#fg-fade)" />
          </mask>

        </defs>

        <g mask="url(#fg-mask)">
          {/* r=340 against a 440-wide frame: the arc rises 65px across the
              half-width, which is the shallow curve in the sketch. */}
          <circle cx="220" cy="425" r="340" fill="url(#fg-sea)" />

          {/* Latitudes, flattening towards the horizon. Three lines is enough
              to say "sphere"; more starts to look like graph paper. */}
          <g fill="none" stroke="var(--f-cream)" strokeOpacity="0.18" strokeWidth="1">
            <path d="M22 152 Q220 70 418 152" />
            <path d="M6 212 Q220 142 434 212" />
            <path d="M0 268 Q220 206 440 268" />
            <path d="M220 85 V300" />
            <path d="M120 96 Q150 200 168 300" />
            <path d="M320 96 Q290 200 272 300" />
          </g>

          {/* Florida, hanging off the horizon as drawn: the panhandle running
              west along the curve, the peninsula dropping south and tapering
              into the keys. */}
          <g fill="var(--f-green)">
            <path
              d="M112 106
                 L 112 124
                 C 140 121, 168 122, 186 126
                 C 194 128, 200 133, 206 143
                 C 213 156, 219 174, 224 194
                 C 227 206, 229 215, 231 221
                 C 232 224, 235 224, 236 221
                 C 240 209, 246 193, 250 176
                 C 254 159, 256 142, 255 126
                 C 254 113, 248 104, 238 101
                 C 224 97, 208 97, 194 98
                 C 166 99, 136 102, 112 106 Z"
            />
            <g fillOpacity="0.85">
              <circle cx="226" cy="229" r="2.1" />
              <circle cx="219" cy="234" r="1.8" />
              <circle cx="212" cy="237" r="1.4" />
              <circle cx="205" cy="239" r="1.1" />
            </g>
          </g>
        </g>
      </svg>

      {/* The marker. A sibling of the artwork, not part of it: it carries a 3D
          transform and its own timing, and neither belongs in a drawing that
          never changes. */}
      <motion.div
        ref={marker}
        initial={reduced ? false : { y: -130, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1, rotate: [0, 0, -7, 5, -2.5, 0] }}
        viewport={{ once: true, amount: 0.55 }}
        transition={{
          y: { type: "spring", stiffness: 300, damping: 15, mass: 0.7, delay: 0.3 },
          opacity: { duration: 0.2, delay: 0.3 },
          // The settle: it plants, rocks off the impact, and stops.
          rotate: { duration: 1.1, delay: 0.3, times: [0, 0.42, 0.58, 0.74, 0.88, 1] },
        }}
        style={{
          position: "absolute",
          left: `${(MIAMI.x / 440) * 100}%`,
          top: `${(MIAMI.y / 300) * 100}%`,
          width: "11.4%",
          aspectRatio: "40 / 54",
          // Anchored on the tail's point, so it pivots and lands on the city
          // rather than beside it.
          marginLeft: "-5.7%",
          marginTop: "-15.4%",
          transformOrigin: "50% 100%",
          transformPerspective: 300,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* A green pin on a green landmass is invisible, which is exactly what
            happened first time. The cream edge and the shadow under it are
            what let it read as an object sitting above Florida rather than
            part of it. */}
        <svg
          viewBox="-3 -3 46 60"
          width="100%"
          aria-hidden="true"
          style={{ overflow: "visible", filter: "drop-shadow(0 4px 6px rgba(50,68,62,0.45))" }}
        >
          <path
            d="M20 53 C 12 40, 2 32, 2 20 A 18 18 0 1 1 38 20 C 38 32, 28 40, 20 53 Z"
            fill="var(--f-green)"
            stroke="var(--f-cream)"
            strokeWidth="2.5"
          />
        </svg>
        {/* The f stands off the disc, so the lean separates the two. */}
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "6%",
            height: "60%",
            display: "grid",
            placeItems: "center",
            transform: "translateZ(8px)",
            fontFamily: "var(--f-serif)",
            fontWeight: 700,
            fontSize: "clamp(13px, 2.6vw, 23px)",
            lineHeight: 1,
            color: "var(--f-orange)",
          }}
        >
          f
        </span>
      </motion.div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
