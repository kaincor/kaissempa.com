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
  /** Pixels to sink it below the container's bottom edge. */
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
        style={{ display: "block" }}
        aria-hidden="true"
        focusable="false"
      >
        <path d={range.d} fill={color} />
      </svg>
      {/* Mass below the ridge so lifting it never exposes the layer behind.
          Uses the magnitude of `rise`, since a negative rise sinks the layer
          and still needs cover underneath. */}
      <div
        style={{ height: Math.abs(rise) + 120, background: color, marginTop: -1 }}
      />
    </motion.div>
  );
}
