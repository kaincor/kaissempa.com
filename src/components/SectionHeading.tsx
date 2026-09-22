"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * The one place a landing page headline is sized.
 *
 * "Projects & Products" and "More about me" previously lived in separate files
 * at clamp(28-56) and clamp(13-18) respectively — same role, wildly different
 * scale. This meets in the middle and keeps them tied together.
 */
export const HEADING_SIZE = "clamp(20px, 2.9vw, 38px)";

export default function SectionHeading({
  children,
  color = "var(--foreground)",
  paddingTop = 0,
  paddingBottom = 0,
}: {
  children: ReactNode;
  color?: string;
  paddingTop?: number;
  paddingBottom?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const play = reduced ? true : inView;

  return (
    <motion.h2
      ref={ref}
      className="display"
      initial={false}
      animate={play ? { opacity: 1, y: 0 } : { opacity: 0, y: -44 }}
      transition={
        reduced ? { duration: 0 } : { duration: 1.9, ease: [0.16, 1, 0.3, 1] }
      }
      style={{
        margin: "0 auto",
        paddingTop,
        paddingBottom,
        fontSize: HEADING_SIZE,
        lineHeight: 1.05,
        color,
        textAlign: "center",
      }}
    >
      {children}
    </motion.h2>
  );
}
