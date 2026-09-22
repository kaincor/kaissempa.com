"use client";

import type { ReactNode } from "react";

/**
 * Published Spline viewer. This build has its scene background set to
 * transparent, and Spline emits `body { background: rgba(212,212,212, 0) }`
 * in the viewer page, so the iframe composites over whatever sits behind it.
 * Swapping back to an opaque scene build would silently hide the far layer.
 */
export const SPLINE_VIEWER_URL =
  "https://my.spline.design/precipicetransparentbackground-UtEKIoigXLsoG55EWLMeWVh7/";

export type HeroProps = {
  /** Heading for screen readers and crawlers. The visible wordmark is 3D
   *  geometry inside the Spline scene, so it is invisible to both. */
  heading?: string;
  subheading?: string;
  src?: string;
  /** Rendered behind the transparent 3D canvas. */
  behind?: ReactNode;
  /** Rendered in front of it, inside the hero bounds. */
  inFront?: ReactNode;
};

export default function Hero({
  heading = "Kai Ssempa",
  subheading = "Designer & Developer",
  src = SPLINE_VIEWER_URL,
  behind,
  inFront,
}: HeroProps) {
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

      {behind ? <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>{behind}</div> : null}

      {/* No loading cover: with a transparent scene the page background shows
          through until the canvas paints, so there is nothing to mask. */}
      <iframe
        src={src}
        title={`${heading}, ${subheading} — interactive 3D scene`}
        className="absolute inset-0 h-full w-full border-0"
        style={{ zIndex: 1, background: "transparent" }}
        allow="autoplay; fullscreen"
      />

      {inFront ? <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>{inFront}</div> : null}
    </section>
  );
}
