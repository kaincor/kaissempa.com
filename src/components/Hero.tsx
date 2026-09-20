"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Published Spline viewer. This build has its scene background set to
 * transparent, and Spline emits `body { background: rgba(212,212,212, 0) }`
 * in the viewer page, so the iframe composites over whatever sits behind it.
 * Republishing with BG Color shown would silently hide the far layer.
 */
export const SPLINE_VIEWER_URL =
  "https://my.spline.design/precipicetransparentbackground-UtEKIoigXLsoG55EWLMeWVh7/";

export type HeroProps = {
  /** Heading for screen readers and crawlers. The visible wordmark is 3D
   *  geometry inside the Spline scene, so it is invisible to both. */
  heading?: string;
  subheading?: string;
  src?: string;
  /**
   * Pixels the canvas shifts across one viewport of scrolling. Positive lifts
   * it (reads as nearer), negative sinks it (reads as further).
   */
  rise?: number;
  /**
   * How far the canvas is oversized past the hero on each edge. Without this a
   * shifted canvas drags its own edge into view.
   */
  overscan?: number;
  /** Rendered behind the transparent 3D canvas. */
  behind?: ReactNode;
  /** Rendered in front of it, inside the hero bounds. */
  inFront?: ReactNode;
};

export default function Hero({
  heading = "Kai Ssempa",
  subheading = "Designer & Developer",
  src = SPLINE_VIEWER_URL,
  rise = 0,
  overscan = 200,
  behind,
  inFront,
}: HeroProps) {
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
    <section
      className="relative w-full overflow-hidden bg-background"
      style={{ height: "100dvh" }}
    >
      {/* The scene's own text is geometry, so the page would otherwise have no
          heading at all for search engines or a screen reader. */}
      <h1 className="sr-only">
        {heading} — {subheading}
      </h1>

      {behind ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>{behind}</div>
      ) : null}

      {/* No loading cover: with a transparent scene the page background shows
          through until the canvas paints, so there is nothing to mask. */}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -overscan,
          height: `calc(100% + ${overscan * 2}px)`,
          zIndex: 1,
          y: reduced ? 0 : y,
          willChange: "transform",
        }}
      >
        <iframe
          src={src}
          title={`${heading}, ${subheading} — interactive 3D scene`}
          className="h-full w-full border-0"
          style={{ background: "transparent", display: "block" }}
          allow="autoplay; fullscreen"
        />
      </motion.div>

      {inFront ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>{inFront}</div>
      ) : null}
    </section>
  );
}
