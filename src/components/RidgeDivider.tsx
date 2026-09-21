"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import type { MountainRange as Range } from "@/data/mountainRanges";

export type RidgeDividerProps = {
  range: Range;
  height?: string;
  /** Colour of the ridge and of the block above it. */
  ridgeColor?: string;
  /** Colour of the section the ridge hangs into. */
  sectionColor?: string;
  /** Pixels the ridge and the section below it lift as they cross the screen. */
  rise?: number;
  /** Rotate the silhouette 180deg so the peaks point downward. */
  flip?: boolean;
  children?: ReactNode;
};

/**
 * A ridge closing out a section rather than opening one: flipped, its flat
 * baseline meets the block above and its peaks hang down into the section
 * below, which is a different colour.
 *
 * Scroll progress is measured against this element, not the window. The hero's
 * ridge can map the first viewport of scrolling because it starts at the top of
 * the page; anything further down has to track its own position or it would
 * finish animating before it is ever on screen.
 */
export default function RidgeDivider({
  range,
  height = "clamp(75px, 11vw, 190px)",
  ridgeColor = "#000000",
  sectionColor = "#d4d4d4",
  rise = 180,
  flip = true,
  children,
}: RidgeDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [rise / 2, -rise / 2]);

  return (
    <motion.div
      ref={ref}
      style={{ position: "relative", y: reduced ? 0 : y, willChange: "transform" }}
    >
      <div style={{ position: "relative" }}>
        {/* Out of flow, so it adds no height. Extends the ridge colour upward
            past the lift distance; without it, rising would drag the ridge away
            from the section above and open a band of the wrong colour. The
            negative margin laps it a few pixels over the silhouette's flat
            edge, which stops short of the viewBox border on most of these
            paths and would otherwise show as a hairline. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "100%",
            marginBottom: -8,
            left: 0,
            right: 0,
            height: rise + 80,
            background: ridgeColor,
          }}
        />
        <svg
          viewBox={range.viewBox}
          preserveAspectRatio="none"
          width="100%"
          height={height}
          style={{
            display: "block",
            transform: flip ? "rotate(180deg)" : undefined,
          }}
          aria-hidden="true"
          focusable="false"
        >
          <path d={range.d} fill={ridgeColor} />
        </svg>
      </div>

      <section style={{ background: sectionColor }}>{children}</section>
    </motion.div>
  );
}
