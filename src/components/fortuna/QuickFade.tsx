"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Fortuna's text entrance: a quick fade and a small lift, played once, the
 * moment the piece is on screen. Each piece watches for itself, with no turn
 * to wait for, so scrolling fast never leaves text sitting invisible behind
 * a queue (which the shared FadeIn's arrival queue could).
 */
export default function QuickFade({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
