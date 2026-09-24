"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

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
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [DRIFT, -DRIFT]);

  return (
    <motion.ol
      ref={ref}
      style={{
        y: reduced ? 0 : drift,
        willChange: "transform",
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
            gridTemplateColumns: "clamp(24px, 3vw, 38px) 1fr",
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
              fontSize: "clamp(13px, 1.6vw, 19px)",
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
              // Sized to put the longest goal on one line rather than to a
              // round number. The column is 62vw, so the type has to track vw
              // too or the fit only holds at one width. It gives out on a
              // phone, where 58 characters on one line would mean type smaller
              // than the body copy — there they wrap to two.
              fontSize: "clamp(15px, 2vw, 24px)",
              lineHeight: 1.32,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            {item}
          </span>
        </motion.li>
      ))}
    </motion.ol>
  );
}
