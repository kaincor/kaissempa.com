"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * An ordered list that is the point of its section rather than a supporting
 * run of detail.
 *
 * Set in the display face instead of body copy, and arriving one item at a
 * time. Both of those are the same argument: four numbered lines at body size
 * read as admin — things that had to be written down — and the goals of a
 * product are not that. Weight and a beat between them is what makes a reader
 * count them.
 *
 * Kept apart from `List` rather than bolted onto it with flags. The plain list
 * is a server component with no JavaScript behind it, which is right for the
 * half-dozen ordinary lists in the piece, and this one has a font stack, a
 * scale and an animation of its own. They have almost nothing in common but
 * the markup.
 */

/** Seconds between one goal landing and the next starting. */
const STAGGER = 0.13;

export default function GoalList({
  items,
  align = "left",
}: {
  items: string[];
  align?: "left" | "center";
}) {
  const reduced = useReducedMotion();

  return (
    <ol
      style={{
        listStyle: "none",
        margin: "6px 0 0",
        padding: 0,
        maxWidth: "var(--f-measure-body)",
        // Shrink to the longest line before centring; centring a block that
        // already fills the column moves nothing.
        ...(align === "center"
          ? { width: "fit-content", marginInline: "auto" }
          : null),
        display: "flex",
        flexDirection: "column",
        gap: "clamp(14px, 1.8vh, 22px)",
      }}
    >
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduced ? false : { opacity: 0, scale: 0.82, y: 10 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{
            // Enough overshoot to read as a bubble arriving rather than a
            // box fading up, and damped hard enough not to wobble.
            type: "spring",
            stiffness: 420,
            damping: 20,
            mass: 0.8,
            delay: i * STAGGER,
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "clamp(30px, 4vw, 44px) 1fr",
            alignItems: "baseline",
            // Each bubbles about its own leading edge, so the column of
            // numerals stays put while the lines pop.
            transformOrigin: align === "center" ? "center left" : "left center",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: "clamp(17px, 2vw, 22px)",
              // The numeral is the quiet half of the pair: it counts the line,
              // it does not compete with it.
              opacity: 0.45,
            }}
          >
            {i + 1}
          </span>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: "clamp(19px, 2.5vw, 27px)",
              lineHeight: 1.32,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            {item}
          </span>
        </motion.li>
      ))}
    </ol>
  );
}
