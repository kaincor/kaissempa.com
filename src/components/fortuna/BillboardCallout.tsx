"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import FillInline from "./FillText";
import type { Rich } from "@/content/fortuna";

/**
 * The pull-out, raised like a billboard.
 *
 * It starts lying flat in the page's own plane, hinged along its bottom edge,
 * where it is edge-on to the reader and so takes up no height and shows
 * nothing. Reaching the screen swings it upright. The text is painted on the
 * board and comes up with it rather than arriving separately, which is the
 * point — one object moving, not a box and its contents negotiating.
 *
 * Timed rather than scrubbed. A scroll-linked version ties the pace of the
 * animation to the pace of the reader, so a fast scroll makes it snap and a
 * slow one makes it crawl; a billboard has its own speed.
 */

/** Degrees it lies back at rest. 90 is flat, and flat is invisible. */
const LAID_FLAT = 90;
/** How near the viewer the hinge reads. Short, so the throw is dramatic. */
const PERSPECTIVE = 1100;

export default function BillboardCallout({
  text,
  align = "left",
  delay = 0,
}: {
  text: Rich;
  align?: "left" | "center" | "right";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  // The fill waits for the board to arrive rather than running on a guessed
  // delay, so the two stay in step if the spring is ever retuned.
  const [filled, setFilled] = useState(false);

  return (
    <motion.div
      initial={reduced ? false : { rotateX: LAID_FLAT }}
      whileInView={{ rotateX: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      onAnimationComplete={() => setFilled(true)}
      transition={{
        type: "spring",
        stiffness: 74,
        damping: 12,
        mass: 0.9,
        delay,
      }}
      style={{
        margin: "32px 0",
        background: "var(--f-callout)",
        borderRadius: 14,
        padding: "26px 38px",
        transformPerspective: PERSPECTIVE,
        // Hinged along the bottom edge, so it stands up off the page rather
        // than spinning about its middle.
        transformOrigin: "center bottom",
        willChange: "transform",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--f-body)",
          fontSize: "var(--f-body-size)",
          lineHeight: 1.6,
          letterSpacing: "-0.02em",
          textAlign: align,
        }}
      >
        <FillInline nodes={text} filled={reduced ? true : filled} />
      </p>
    </motion.div>
  );
}
