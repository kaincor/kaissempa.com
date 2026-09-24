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
 * A pin dropped on Miami.
 *
 * The frame is wider than the globe on purpose. Earlier the circle was bigger
 * than its viewBox, so the arc ran off the sides and met the frame in a
 * straight vertical line — a boundary where there should have been a horizon.
 * At 760 across, a 340 circle closes its own curve inside the picture and the
 * mask dissolves it on every side, so it ends the same way top, bottom and
 * edges: by stopping being there.
 *
 * Not WebGL, deliberately. The reference is a particle sphere on two full-size
 * canvases; this is about thirty SVG nodes and no canvas at all, animating
 * nothing but transform and opacity.
 */

/** Where the needle goes in, in artwork coordinates. */
const MIAMI = { x: 415, y: 180 };
const MAX_TILT = 15;
const REACH = 260;

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

  /** Everything the drop shares, so the pin and its shadow cannot drift. */
  const LAND = { type: "spring", stiffness: 300, damping: 15, mass: 0.7, delay: 0.3 } as const;

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
        margin: "36px auto 8px",
        aspectRatio: "760 / 300",
      }}
    >
      <svg viewBox="0 0 760 300" width="100%" aria-hidden="true" style={{ display: "block" }}>
        <defs>
          <radialGradient id="fg-sea" cx="42%" cy="6%" r="88%">
            <stop offset="0%" stopColor="var(--f-petrol-light)" />
            <stop offset="55%" stopColor="var(--f-petrol)" />
            <stop offset="100%" stopColor="var(--f-forest)" />
          </radialGradient>
          <radialGradient id="fg-fade" cx="50%" cy="24%" r="72%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="56%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="fg-mask">
            <rect width="760" height="300" fill="url(#fg-fade)" />
          </mask>
          {/* The label rides a latitude rather than sitting flat, so it belongs
              to the surface instead of floating over it. */}
          <path id="fg-miami-arc" d="M334 214 Q408 236 486 210" fill="none" />
        </defs>

        <g mask="url(#fg-mask)">
          <circle cx="380" cy="425" r="340" fill="url(#fg-sea)" />

          <g fill="none" stroke="var(--f-cream)" strokeOpacity="0.17" strokeWidth="1">
            <path d="M120 148 Q380 66 640 148" />
            <path d="M84 208 Q380 138 676 208" />
            <path d="M60 264 Q380 202 700 264" />
            <path d="M380 85 V300" />
            <path d="M270 94 Q306 198 326 300" />
            <path d="M490 94 Q454 198 434 300" />
          </g>

          {/* Land. It reads as a coastline with a peninsula; past that the
              silhouette is doing all the work at this size and precision buys
              nothing. */}
          <g fill="var(--f-green)">
            <path
              d="M258 104
                 L 258 126
                 C 292 122, 326 123, 348 128
                 C 358 130, 366 136, 372 147
                 C 380 161, 386 180, 391 200
                 C 394 212, 396 220, 398 226
                 C 399 229, 402 229, 403 226
                 C 407 213, 413 196, 418 178
                 C 423 160, 425 142, 424 126
                 C 423 112, 416 103, 404 100
                 C 388 96, 368 96, 350 97
                 C 318 98, 284 100, 258 104 Z"
            />
            <g fillOpacity="0.85">
              <circle cx="393" cy="235" r="2.1" />
              <circle cx="386" cy="240" r="1.8" />
              <circle cx="379" cy="243" r="1.4" />
              <circle cx="372" cy="245" r="1.1" />
            </g>
          </g>

          <text
            fill="var(--f-cream)"
            fillOpacity="0.92"
            style={{
              fontFamily: "var(--f-grotesk)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.22em",
            }}
          >
            <textPath href="#fg-miami-arc" startOffset="50%" textAnchor="middle">
              MIAMI
            </textPath>
          </text>
        </g>
      </svg>

      {/* The shadow is its own element, because it must not rotate with the
          pin — it belongs to the ground. Growing and darkening as the pin
          arrives is most of what sells the fall; without it the marker just
          slides down the screen. */}
      <motion.div
        aria-hidden="true"
        initial={reduced ? false : { scale: 0.25, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.38 }}
        viewport={{ once: true, amount: 0.55 }}
        transition={LAND}
        style={{
          position: "absolute",
          left: `${(MIAMI.x / 760) * 100}%`,
          top: `${(MIAMI.y / 300) * 100}%`,
          width: "4.2%",
          height: "3.4%",
          marginLeft: "-2.1%",
          marginTop: "-0.9%",
          borderRadius: "50%",
          background: "var(--f-forest)",
          filter: "blur(3px)",
          willChange: "transform, opacity",
        }}
      />

      <motion.div
        ref={marker}
        initial={reduced ? false : { y: -150, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1, rotate: [0, 0, -6, 4, -2, 0] }}
        viewport={{ once: true, amount: 0.55 }}
        transition={{
          y: LAND,
          opacity: { duration: 0.18, delay: 0.3 },
          rotate: { duration: 1.05, delay: 0.3, times: [0, 0.44, 0.6, 0.76, 0.9, 1] },
        }}
        style={{
          position: "absolute",
          left: `${(MIAMI.x / 760) * 100}%`,
          // Head high, needle in the ground: the whole marker stands above the
          // surface rather than sitting on it.
          top: `${(MIAMI.y / 300) * 100}%`,
          width: "6.3%",
          aspectRatio: "48 / 124",
          marginLeft: "-3.15%",
          // The needle's point is the bottom of the box, so the box hangs
          // entirely above the city it is stuck into.
          // 124 of the artwork's 760, so the head stands clear above the
          // coastline rather than level with it.
          marginTop: "-16.3%",
          transformOrigin: "50% 100%",
          transformPerspective: 320,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <svg viewBox="0 0 48 124" width="100%" aria-hidden="true">
          <defs>
            {/* Lit from the upper left, which is the only thing making a flat
                disc read as a ball. */}
            <radialGradient id="fg-head" cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor="var(--f-green-light)" />
              <stop offset="48%" stopColor="var(--f-green)" />
              <stop offset="100%" stopColor="var(--f-green-dark)" />
            </radialGradient>
            {/* Dark, because the needle crosses the landmass and the land is
                the same green as the head. A light core keeps it from reading
                as a flat stick. */}
            <linearGradient id="fg-needle" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--f-forest)" />
              <stop offset="38%" stopColor="var(--f-petrol-light)" />
              <stop offset="100%" stopColor="var(--f-forest)" />
            </linearGradient>
          </defs>
          {/* Needle first, so the head sits over its top. */}
          <path d="M21.8 42 H26.2 L24.7 123 H23.3 Z" fill="url(#fg-needle)" />
          <circle cx="24" cy="24" r="22" fill="url(#fg-head)" />
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="var(--f-cream)"
            strokeOpacity="0.85"
            strokeWidth="2"
          />
        </svg>
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "38.7%",
            display: "grid",
            placeItems: "center",
            transform: "translateZ(9px)",
            fontFamily: "var(--f-serif)",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.9vw, 24px)",
            lineHeight: 1,
            color: "var(--f-cream)",
          }}
        >
          f
        </span>
      </motion.div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
