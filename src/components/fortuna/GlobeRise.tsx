"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Brings the globe up into the page as the reader arrives at it.
 *
 * One transform on one element, so the body, the dots and everything else ride
 * up together and the canvas never has to redraw for it — the compositor moves
 * the finished pixels. Scrubbed rather than played, because the globe should
 * feel like it is being revealed by the scroll rather than reacting to it.
 *
 * It finishes early, at the point the globe reaches the middle of the screen,
 * so the reader spends most of its time on screen looking at it settled rather
 * than still arriving.
 */
export default function GlobeRise({
  children,
  width,
  height,
}: {
  children: ReactNode;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [70, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.84, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{
        position: "relative",
        width: `min(${width}px, 100%)`,
        margin: "34px auto 0",
        aspectRatio: `${width} / ${height}`,
        // Grows from its own base, so it rises out of the page rather than
        // inflating around its middle.
        transformOrigin: "50% 85%",
        y: reduced ? 0 : y,
        scale: reduced ? 1 : scale,
        opacity: reduced ? 1 : opacity,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </motion.div>
  );
}
