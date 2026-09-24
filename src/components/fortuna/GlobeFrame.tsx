"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * The interactive shell around the globe.
 *
 * Split from the artwork on purpose. The dot grid is nearly a thousand
 * positions, and if this file rendered it the whole array would be shipped to
 * the browser as JavaScript on top of the SVG already in the HTML — the same
 * data twice. Passing the artwork in as children keeps it server-rendered:
 * what crosses the wire is markup, and the only JavaScript here is the
 * handful of numbers that make the markers lean.
 */
export type MarkerSpec = { x: number; y: number; delay: number; label: string };

const MAX_TILT = 11;
const REACH = 320;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export default function GlobeFrame({
  children,
  markers,
  width,
  height,
}: {
  children: ReactNode;
  markers: MarkerSpec[];
  width: number;
  height: number;
}) {
  const reduced = useReducedMotion();
  const anchor = useRef<HTMLDivElement>(null);

  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, { stiffness: 150, damping: 18, mass: 0.5 });
  const sy = useSpring(ty, { stiffness: 150, damping: 18, mass: 0.5 });
  const rotateY = useTransform(sx, [-1, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-1, 1], [MAX_TILT, -MAX_TILT]);

  function track(e: PointerEvent<HTMLDivElement>) {
    if (reduced || !anchor.current) return;
    const b = anchor.current.getBoundingClientRect();
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
        width: `min(${width}px, 100%)`,
        margin: "34px auto 0",
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {children}

      {markers.map((m, i) => (
        <motion.div
          key={m.label}
          ref={i === 0 ? anchor : undefined}
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            type: "spring",
            stiffness: 330,
            damping: 14,
            mass: 0.6,
            delay: m.delay,
          }}
          style={{
            position: "absolute",
            left: `${(m.x / width) * 100}%`,
            top: `${(m.y / height) * 100}%`,
            width: "2.1%",
            aspectRatio: "1",
            marginLeft: "-1.05%",
            marginTop: `${(-1.05 * width) / height}%`,
            display: "grid",
            placeItems: "center",
            transformPerspective: 200,
            rotateX: reduced ? 0 : rotateX,
            rotateY: reduced ? 0 : rotateY,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {/* The bloom in the reference is a blur, not a ring. */}
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
              transform: "translateZ(5px)",
            }}
          />
          <span className="sr-only">{m.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
