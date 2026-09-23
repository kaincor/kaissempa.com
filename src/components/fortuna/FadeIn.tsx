"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * A plain fade-and-lift, played once when the element reaches the screen.
 *
 * `delay` is what sequences a section: the heading, the paragraph and the
 * pull-out all sit within a screen of each other, so they come into view at
 * more or less the same moment and the stagger has to come from the delays
 * rather than from their positions.
 */
export default function FadeIn({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
