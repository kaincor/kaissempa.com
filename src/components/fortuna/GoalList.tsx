"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { useArrival } from "./arrival";
import Parallax from "./Parallax";

/**
 * An ordered list that is the point of its section rather than a supporting
 * run of detail.
 *
 * Set in the page's own body type, like every other list — the display face
 * was tried here and did not carry it. What marks these out instead is
 * movement: they arrive one at a time, and the block drifts against the page
 * as the reader scrolls. Timing and depth rather than size and weight.
 *
 * Nothing but opacity moves. They used to arrive on a soft spring, scaling up
 * from 0.82 so each one popped; four lines popping in turn is a lot of event
 * for what is a list of four sentences, and the parallax is already giving
 * the block its own plane. A fade leaves the pace as the only effect.
 *
 * Kept apart from `List` rather than bolted onto it with flags. The plain list
 * is a server component with no JavaScript behind it, which is right for the
 * half-dozen ordinary lists in the piece; this one is a client component with
 * an animation and a scroll subscription. They share their markup and nothing
 * else.
 */

/**
 * The pace of the four.
 *
 * Budgeted to 2.5 seconds for the whole list rather than set per line: three
 * gaps of 0.5 plus a 1s fade puts the last goal at rest exactly on the mark.
 * Change either and the other has to give.
 */
const STAGGER = 0.5;
const FADE = 1;

/**
 * How far the block drifts against the page, in pixels each way.
 *
 * The whole list moves as one, not each line on its own depth. Separate
 * depths would open and close the gaps between the goals as the reader
 * scrolls, and four lines that breathe in and out are a effect rather than a
 * list. Moving the block keeps the spacing exactly as set while still putting
 * the goals on a different plane from the heading above them.
 */
const DRIFT = 18;

export default function GoalList({
  items,
  align = "left",
}: {
  items: string[];
  align?: "left" | "center" | "right";
}) {
  const reduced = useReducedMotion();
  const list = useRef<HTMLOListElement>(null);
  // The list takes one turn on the page's queue — which is what keeps it
  // behind the line that introduces it — and holds the queue until its last
  // goal has started, so nothing below cuts in while it is still counting.
  const go = useArrival(list, { amount: 0.4, hold: (items.length - 1) * STAGGER, disabled: !!reduced });

  return (
    <Parallax drift={DRIFT}>
      <ol
        ref={list}
        style={{
          listStyle: "none",
          margin: "clamp(46px, 6vh, 68px) 0 0",
          padding: 0,
          maxWidth: "var(--f-measure-body)",
          // Shrink to the longest line before centring; centring a block that
          // already fills the column moves nothing.
          ...(align === "center"
            ? { width: "fit-content", marginInline: "auto" }
            : null),
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {items.map((item, i) => (
          <motion.li
            key={item}
            initial={reduced ? false : { opacity: 0 }}
            animate={go ? { opacity: 1 } : undefined}
            transition={{
              duration: FADE,
              ease: "easeOut",
              delay: i * STAGGER,
            }}
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "34px 1fr",
              alignItems: "baseline",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                // The display face, not the grotesk. A bold sans numeral read
                // as a form field next to a sentence about a product's north
                // star; a serif one reads as a figure in a list.
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: "1.05em",
                color: "var(--f-accent)",
                position: "relative",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: "var(--f-body)",
                fontSize: "var(--f-body-size)",
                lineHeight: 1.6,
                letterSpacing: "-0.02em",
                position: "relative",
              }}
            >
              {item}
            </span>
          </motion.li>
        ))}
      </ol>
    </Parallax>
  );
}
