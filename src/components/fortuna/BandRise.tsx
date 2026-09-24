"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

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

export default function BandRise({ color }: { color: string }) {
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
      style={{ position: "absolute", top: 0, left: 0, right: 0, height: 0 }}
    >
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // The marker has no height, so its bottom edge is the band's top.
          bottom: 0,
          height: RISE,
          background: color,
          clipPath: clip,
          pointerEvents: "none",
          willChange: "clip-path",
        }}
      />
    </div>
  );
}
