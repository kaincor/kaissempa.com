"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent } from "react";

/** Taken from the reference card: a distant vanishing point keeps the tilt
 *  subtle rather than fish-eyed. */
const PERSPECTIVE = 1500;
/** Degrees at the far edge of the section. */
const MAX_TILT = 18;
/** How far the wordmark floats in front of the photo. */
const KAI_DEPTH = 70;

const COPY = [
  "I grew up in rural Uganda.",
  "My parents devoted their careers to public health work in remote villages & I grew up working alongside them.",
  "At Stanford, I study design & computer science. I'm also on the leadership team for the Black Student Engineers Club.",
  "I try to put a piece of myself into my work: assets from scratch. Illustrations. Custom fonts. I hand drew this font I'm using right now.",
  "I enjoy bodybuilding, mountain biking & embroidery.",
];

export default function MoreAboutMe() {
  const reduced = useReducedMotion();
  const areaRef = useRef<HTMLDivElement>(null);

  // -1..1 across the section, sprung so the card settles rather than snapping.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 110, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 110, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [-1, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-1, 1], [MAX_TILT, -MAX_TILT]);

  // Tracked across the whole section, not just the card, so the tilt responds
  // while the reader is anywhere near it.
  function track(e: PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    const el = areaRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    px.set(((e.clientX - b.left) / b.width) * 2 - 1);
    py.set(((e.clientY - b.top) / b.height) * 2 - 1);
  }

  function reset() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      ref={areaRef}
      onPointerMove={track}
      onPointerLeave={reset}
      style={{
        maxWidth: "var(--content-max)",
        margin: "0 auto",
        padding: "0 30px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "clamp(32px, 6vw, 88px)",
        perspective: PERSPECTIVE,
      }}
    >
      <motion.div
        style={{
          position: "relative",
          flex: "0 1 380px",
          aspectRatio: "3 / 4",
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          // Children keep their own depth instead of being flattened into this
          // element's plane — without it the wordmark would not parallax.
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <Image
          src="/photos/kai-in-lake-lagunita.jpg"
          alt="Kai at Lake Lagunita"
          fill
          sizes="(max-width: 760px) 90vw, 380px"
          quality={85}
          style={{ objectFit: "cover", borderRadius: 14 }}
        />

        <span
          className="display"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "12%",
            // The translate has to come after the Z, or the depth is applied
            // in the parent's flattened space and the parallax disappears.
            transform: `translateZ(${KAI_DEPTH}px) translateX(-50%)`,
            fontSize: 90,
            lineHeight: 1,
            color: "#ffffff",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          Kai
        </span>
      </motion.div>

      <div
        className="display"
        style={{
          flex: "1 1 380px",
          textAlign: "left",
          color: "#6E6E6E",
          fontSize: "clamp(15px, 1.7vw, 21px)",
          lineHeight: 1.45,
          display: "flex",
          flexDirection: "column",
          gap: "0.7em",
        }}
      >
        {COPY.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
