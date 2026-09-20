"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

export type ParallaxLayer = {
  /** Usually an <svg> ridge silhouette, but any node works. */
  content: ReactNode;
  /**
   * Depth. 0 scrolls with the page (infinitely far away), 1 travels the full
   * `travel` distance (right under the reader's nose). Order layers back to
   * front with ascending speed.
   */
  speed: number;
  /** Extra vertical offset at rest, px. Lets ridges overlap. */
  offset?: number;
};

export type MountainParallaxProps = {
  layers: ParallaxLayer[];
  /** Section height. Longer means a slower, more gradual drift. */
  height?: string;
  /** Pixels the fastest layer (speed 1) travels across the whole scroll range. */
  travel?: number;
  children?: ReactNode;
  className?: string;
};

/**
 * Layered scroll parallax. Each layer is pinned to the bottom of the section
 * and slides vertically at a rate set by its `speed`, so near ridges outrun far
 * ones and the range gains depth as the reader scrolls.
 */
export default function MountainParallax({
  layers,
  height = "150vh",
  travel = 320,
  children,
  className,
}: MountainParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={ref}
      className={className}
      style={{ position: "relative", height, overflow: "hidden" }}
    >
      {layers.map((layer, i) => (
        <Layer
          key={i}
          layer={layer}
          progress={scrollYProgress}
          travel={travel}
          zIndex={i}
        />
      ))}
      {children ? (
        <div style={{ position: "relative", zIndex: layers.length + 1 }}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function Layer({
  layer,
  progress,
  travel,
  zIndex,
}: {
  layer: ParallaxLayer;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  travel: number;
  zIndex: number;
}) {
  const reduced = useReducedMotion();
  const distance = layer.speed * travel;
  // Starts low and rises as the section passes through the viewport, so nearer
  // layers sweep past faster than distant ones.
  const y = useTransform(progress, [0, 1], [distance, -distance]);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: layer.offset ?? 0,
        zIndex,
        y: reduced ? 0 : y,
        willChange: "transform",
        pointerEvents: "none",
      }}
    >
      {layer.content}
    </motion.div>
  );
}

/**
 * Placeholder ridge. Swap for a real exported SVG.
 *
 * The solid block under the silhouette matters: layers travel upward, and
 * without mass below them their bottom edge lifts clear of the viewport and
 * exposes the layer behind. `base` must exceed the layer's travel distance.
 */
export function Ridge({
  points,
  opacity = 1,
  height = 320,
  base = 800,
}: {
  points: string;
  opacity?: number;
  height?: number;
  base?: number;
}) {
  return (
    <div style={{ position: "relative", opacity }}>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        width="100%"
        height={height}
        style={{ display: "block" }}
        aria-hidden="true"
        focusable="false"
      >
        <polygon points={points} fill="currentColor" />
      </svg>
      {/* Hangs below the silhouette and out of the section, which clips it, so
          the filler never shifts the ridge's own resting position. */}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          height: base,
          background: "currentColor",
        }}
      />
    </div>
  );
}
