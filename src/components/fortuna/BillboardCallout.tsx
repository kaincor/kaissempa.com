"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { useArrival } from "./arrival";
import FillInline from "./FillText";
import Parallax from "./Parallax";
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
/** Pixels of drift each way. Its own margins are 32, so this clears them. */
const DRIFT = 16;

export default function BillboardCallout({
  text,
  align = "left",
}: {
  text: Rich;
  align?: "left" | "center" | "right";
}) {
  const reduced = useReducedMotion();
  const board = useRef<HTMLDivElement>(null);
  // Its turn on the page's queue, which also keeps it behind the heading and
  // paragraph above it: it is the loudest thing in its section and should
  // not be what the eye catches on the way in.
  const go = useArrival(board, { amount: 0.5, disabled: !!reduced });
  // The fill waits for the board to arrive rather than running on a guessed
  // delay, so the two stay in step if the spring is ever retuned.
  const [filled, setFilled] = useState(false);

  return (
    // Depth on the outside, the hinge on the inside. Both are transforms on
    // the same element otherwise, and the drift would fight the rotation.
    <Parallax drift={DRIFT}>
      <motion.div
        ref={board}
        initial={reduced ? false : { rotateX: LAID_FLAT }}
        animate={go ? { rotateX: 0 } : undefined}
        onAnimationComplete={() => setFilled(true)}
        transition={{
          type: "spring",
          stiffness: 74,
          damping: 12,
          mass: 0.9,
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
    </Parallax>
  );
}
