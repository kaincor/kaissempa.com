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
              left: 0,
              display: "flex",
              // max-content, not a percentage of the container. A percentage
              // width makes the row a multiple of the CONTAINER, while a tile
              // is height x aspect — the two only agree by accident, and the
              // mismatch is what makes the loop jump.
              width: "max-content",
              height: `${layer.heightPct}%`,
            }}
            // x as a percentage resolves against the element's own width. With
            // the row sized to exactly TILE_COUNT tiles, 100/TILE_COUNT percent
            // is exactly one tile, so the loop lands pixel-perfect at any size.
            animate={
              reduced ? undefined : { x: [`-${100 / TILE_COUNT}%`, "0%"] }
            }
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
                  // Without this the tiles squash to fit the row and the tile
                  // width stops matching the travel distance.
                  flexShrink: 0,
                  width: "auto",
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
