"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Drifts a block against the page as it passes through the viewport.
 *
 * One transform on one wrapper, scrubbed off that wrapper's own position, so
 * anything can be given depth without knowing where it sits in the document.
 * It moves as a single block on purpose: putting the parts of a group on
 * separate depths opens and closes the gaps between them as the reader
 * scrolls, which is a different effect and usually an unwanted one.
 *
 * The drift has to fit in the space around the block. Half of it eats into the
 * gap above and half into the gap below, so a block with a 20px gap and a 22px
 * drift will collide with its neighbour — measured on the goals list before the
 * gap was opened up.
 */
export default function Parallax({
  children,
  /** Pixels it travels each way. Total movement is twice this. */
  drift = 18,
  className,
}: {
  children: ReactNode;
  drift?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y: reduced ? 0 : y, willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
