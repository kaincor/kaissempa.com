"use client";

import { motion, useReducedMotion } from "motion/react";
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
 * Kept apart from `List` rather than bolted onto it with flags. The plain list
 * is a server component with no JavaScript behind it, which is right for the
 * half-dozen ordinary lists in the piece; this one is a client component with
 * an animation and a scroll subscription. They share their markup and nothing
 * else.
 */

/** Seconds between one goal landing and the next starting. */
const STAGGER = 0.26;

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

  return (
    <Parallax drift={DRIFT}>
      <ol
        style={{
          listStyle: "none",
          margin: "clamp(34px, 4.6vh, 52px) 0 0",
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
            initial={reduced ? false : { opacity: 0, scale: 0.82, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{
              // Enough overshoot to read as a bubble arriving rather than a box
              // fading up, but soft: a goal should settle into place, not snap.
              default: {
                type: "spring",
                stiffness: 130,
                damping: 17,
                mass: 1.1,
                delay: i * STAGGER,
              },
              // Opacity gets a tween, not the spring. A spring this soft is
              // underdamped enough to overshoot, and on a transform that reads
              // as bounce — which is the point — while on opacity it is a
              // visible flicker back to 90% after the line has already arrived.
              opacity: { duration: 0.45, ease: "easeOut", delay: i * STAGGER },
            }}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              alignItems: "baseline",
              // Each bubbles about its own leading edge, so the column of
              // numerals stays put while the lines pop.
              transformOrigin:
                align === "center" ? "center left" : "left center",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--f-grotesk)",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--f-accent)",
                opacity: 0.6,
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
