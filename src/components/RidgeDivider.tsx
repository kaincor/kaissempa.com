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
  /**
   * Pixels to pull this whole block upward in flow. The section above reserves
   * bottom padding to cover its own lift; without cancelling that here, the
   * reserved space reads as dead air between the copy and the ridge.
   */
  pullUp?: number;
  /**
   * Where the parallax starts and finishes, in useScroll's terms.
   *
   * The default suits a divider with page on both sides of it. The last block
   * on the page needs "end end" instead: no scroll position exists that would
   * carry its bottom edge past the top of the screen, so measured the default
   * way its travel can never complete and it rests permanently offset.
   */
  scrollOffset?: ["start end" | "start start", "end start" | "end end"];
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
  pullUp = 0,
  scrollOffset = ["start end", "end start"],
  children,
}: RidgeDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: scrollOffset,
  });
  // Travels from `rise` down to 0 rather than straddling zero. Lifting past
  // its layout position would slide this ridge up over the copy above it,
  // which is black on black and would simply swallow the last line.
  const y = useTransform(scrollYProgress, [0, 1], [rise, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        position: "relative",
        // Deliberately behind MountainRange (zIndex 1). pullUp slides this
        // block up so its black backing reaches into the section above; in
        // front, that backing covers the deck and the copy. Behind, it is
        // black on black where it overlaps and only shows in the gap it exists
        // to fill. The ridge itself still reads because it stops at the black
        // section's bottom edge rather than crossing it.
        zIndex: 0,
        marginTop: -pullUp,
        y: reduced ? 0 : y,
        willChange: "transform",
      }}
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
            // Must cover this block's own travel plus the lift of the section
            // above it, since the two move in opposite directions.
            height: rise * 2 + 160,
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
