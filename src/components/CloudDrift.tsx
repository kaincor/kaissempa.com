"use client";

import { motion, useReducedMotion } from "motion/react";

export type CloudLayerSpec = {
  src: string;
  /** Tile height as a percentage of the container, so it scales with the box. */
  heightPct: number;
  /** Tile width / height. */
  aspect: number;
  /** Seconds for one tile to pass. */
  duration: number;
};

const TILE_COUNT = 6;

/**
 * Two cloud layers drifting at different speeds behind the Zorzal art.
 *
 * Ported from the Framer component, with the sizing changed from fixed pixels
 * to percentages. The original's tiles were a fixed height regardless of the
 * container, so the clouds only lined up at one width.
 *
 * The loop translates by exactly one tile. With N identical tiles in a flex
 * row, that is 100/N percent of the row's own width, which avoids having to
 * measure anything in JavaScript.
 */
export default function CloudDrift({ layers }: { layers: CloudLayerSpec[] }) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {layers.map((layer, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <motion.div
            style={{
              position: "absolute",
              bottom: 0,
              // Offset by one tile so the row already covers the left edge
              // before the drift begins.
              left: `-${100 / TILE_COUNT}%`,
              display: "flex",
              width: `${TILE_COUNT * 100}%`,
              height: `${layer.heightPct}%`,
            }}
            animate={reduced ? undefined : { x: [`0%`, `${100 / TILE_COUNT}%`] }}
            transition={
              reduced
                ? undefined
                : {
                    duration: layer.duration,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear",
                  }
            }
          >
            {Array.from({ length: TILE_COUNT }).map((_, t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={t}
                src={layer.src}
                alt=""
                style={{
                  height: "100%",
                  aspectRatio: layer.aspect,
                  flexShrink: 0,
                  display: "block",
                }}
              />
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
