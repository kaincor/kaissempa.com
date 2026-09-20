"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import type { MountainRange as Range } from "@/data/mountainRanges";

export type RidgeLayerProps = {
  range: Range;
  height?: string;
  color?: string;
  /** Pixels this layer lifts across one viewport of scrolling. */
  rise?: number;
  /**
   * Pixels to sink it below the container's bottom edge. Must stay well under
   * the rendered height or the ridge disappears entirely — and `height` is
   * usually a clamp(), so the effective height shrinks on narrow viewports.
   */
  drop?: number;
};

/**
 * A standalone parallax ridge pinned to the bottom of its container, with no
 * section beneath it. Used for layers that sit behind the 3D canvas, where the
 * only job is a silhouette at a different depth.
 */
export default function RidgeLayer({
  range,
  height = "clamp(60px, 8vw, 140px)",
  color = "#000000",
  rise = 60,
  drop = 0,
}: RidgeLayerProps) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const sync = () => setVh(window.innerHeight);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const y = useTransform(scrollY, [0, vh || 1], [0, -rise]);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -drop,
        y: reduced ? 0 : y,
        willChange: "transform",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox={range.viewBox}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        // Same one-pixel drop as MountainRange: buries the sub-pixel seam
        // where the path stops short of its viewBox floor.
        style={{ display: "block", transform: "translateY(1px)" }}
        aria-hidden="true"
        focusable="false"
      >
        <path d={range.d} fill={color} />
      </svg>
      {/* Mass below the ridge, hung out of flow. The layer is bottom-anchored,
          so an in-flow filler would grow upward and shove the ridge off the top
          instead of extending below it. A full viewport of cover means lifting
          never drags its own bottom edge into view, which would otherwise show
          as light gaps through the valleys of the ridge in front. */}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          height: "100vh",
          marginTop: -1,
          background: color,
        }}
      />
    </motion.div>
  );
}
