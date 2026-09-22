"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import type { MountainRange as Range } from "@/data/mountainRanges";

export type RidgeRiseProps = {
  range: Range;
  height?: string;
  /** Colour of the ridge and the section below it. */
  color?: string;
  rise?: number;
  /**
   * Where the parallax starts and finishes, in useScroll's terms.
   *
   * The default assumes there is a page's worth of scrolling left below this
   * block. Near the bottom there is not: "end start" asks for the scroll
   * position that carries this block's bottom edge past the TOP of the screen,
   * and if everything below it is shorter than one viewport, that position does
   * not exist. The travel then stops partway and the block rests permanently
   * offset — which drags whatever is welded to its base out of alignment.
   */
  scrollOffset?: ["start end" | "start start", "end start" | "end end"];
  children?: ReactNode;
};

/**
 * A ridge opening a section: peaks upward into whatever sits above, solid
 * colour below. The mirror of RidgeDivider, and simpler — lifting it only ever
 * exposes more of the section above, so it needs no backing block.
 *
 * Scroll progress is measured against the element rather than the window,
 * since this sits well down the page.
 */
export default function RidgeRise({
  range,
  height = "clamp(75px, 11vw, 190px)",
  color = "#000000",
  rise = 70,
  scrollOffset = ["start end", "end start"],
  children,
}: RidgeRiseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: scrollOffset,
  });
  const y = useTransform(scrollYProgress, [0, 1], [rise, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        position: "relative",
        // Above the ridge that follows: its backing block reaches upward and
        // would otherwise paint over this section's photo and copy.
        zIndex: 1,
        y: reduced ? 0 : y,
        willChange: "transform",
      }}
    >
      <svg
        viewBox={range.viewBox}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        style={{ display: "block" }}
        aria-hidden="true"
        focusable="false"
      >
        <path d={range.d} fill={color} />
      </svg>
      <section
        style={{
          background: color,
          // Covers the few pixels these paths stop short of their viewBox
          // floor. -1 left a hairline of page background showing through on
          // range 1, whose path ends about 1.3px above the border at this size.
          marginTop: -3,
          // The block rides upward; without this the lift exposes what is below.
          paddingBottom: rise + 40,
        }}
      >
        {children}
      </section>
    </motion.div>
  );
}
