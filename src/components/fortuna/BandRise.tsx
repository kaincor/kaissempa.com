"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * A band's colour, swept up over the one above it.
 *
 * A tongue of the same colour hung directly above the band, revealed from its
 * bottom edge upward by a clip. Because the band's own
 * top edge is where the tongue starts, the two read as one surface climbing
 * the screen rather than as a shape sliding over it.
 *
 * `clip-path` rather than height or a transform. Height would relayout every
 * frame; a transform would drag the tongue's far edge into view and show its
 * seam. A clip repaints nothing and has no far edge to show.
 *
 * Anything passed as children is painted inside the tongue, so it arrives
 * with the colour instead of fading in on top of it afterwards.
 *
 * Scrubbed, deliberately. The reader is doing the pulling here — the colour
 * arriving under their thumb is the whole effect, and a timed version would
 * either beat them to it or lag behind.
 */

/**
 * How tall the tongue is.
 *
 * It has to finish covering the screen by the time the band's own top edge
 * reaches the middle of it, so it needs to be at least half a viewport plus
 * whatever the reader can see above that. Three quarters clears it on every
 * aspect ratio without hanging so far up the page that it starts sweeping over
 * content that is still being read.
 */
const RISE = "76vh";

export default function BandRise({
  color,
  drop = "1px",
  children,
}: {
  color: string;
  /**
   * How far the tongue hangs past the band's top edge, down over its own
   * content. Any CSS length; a percentage resolves against the band's height,
   * which is what lets the star field scale with however much content the band
   * is carrying instead of guessing at a pixel figure that only fits one
   * viewport. One pixel by default, purely to bury the seam.
   */
  drop?: string;
  /** Painted inside the tongue, so it is revealed by the same sweep. */
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  // A zero-height marker pinned to the band's top edge, so this component can
  // scrub off its own position instead of being handed a ref from a server
  // component that cannot make one.
  const mark = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mark,
    // From the band's top edge touching the bottom of the screen, to it
    // reaching the middle. After that the band itself is doing the covering.
    offset: ["start end", "start center"],
  });

  const clip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(100% 0 0 0)", "inset(0% 0 0 0)"],
  );

  // Nothing to sweep if the reader has asked for stillness: the band's own
  // background already paints everything from its top edge down.
  if (reduced) return null;

  return (
    <div
      ref={mark}
      aria-hidden="true"
      // Full height, not zero: the tongue's percentages resolve against this,
      // so it needs to be the size of the band. Nothing is painted here and it
      // takes no pointer events, so spanning the band costs nothing.
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // Hangs past the band's top edge by `drop`. Even at its smallest
          // that is a pixel, because where two same-coloured blocks merely
          // touch each antialiases against the backdrop separately and the
          // two partial coverages do not add up to opaque — on a fractionally
          // positioned edge (measured at 365.53) that reads as a hairline
          // across the page.
          top: "auto",
          // The marker spans the band, so its own bottom edge is the band's
          // bottom. Coming back up by everything except `drop` puts the
          // tongue's bottom edge `drop` below the band's TOP, which is what
          // the name means and what a percentage has to measure from.
          bottom: `calc(100% - ${drop})`,
          height: `calc(${RISE} + ${drop})`,
          background: color,
          clipPath: clip,
          pointerEvents: "none",
          willChange: "clip-path",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
