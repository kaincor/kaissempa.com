"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Arrives from the left, once.
 *
 * A plain entrance, kept apart from `FadeIn` because that one only fades and
 * this one has somewhere to come from. Used where a few things should land in
 * sequence rather than together — a paragraph, the line after it, a portrait.
 */
export default function SlideIn({
  children,
  delay = 0,
  /** Pixels to the left of its resting place that it starts. */
  from = 26,
  style,
}: {
  children: ReactNode;
  delay?: number;
  from?: number;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -from }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.72, ease: [0.22, 0.61, 0.24, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}
