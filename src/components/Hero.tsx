"use client";

import { useState } from "react";

/** Published Spline viewer. Standalone HTML bundle, embedded in an iframe. */
export const SPLINE_VIEWER_URL =
  "https://my.spline.design/precipicemvp-GtnNKaB1IxQV7qHP95c03fpK/";

export type HeroProps = {
  /** Heading for screen readers and crawlers. The visible wordmark is 3D
   *  geometry inside the Spline scene, so it is invisible to both. */
  heading?: string;
  subheading?: string;
  src?: string;
};

export default function Hero({
  heading = "Kai Ssempa",
  subheading = "Designer & Developer",
  src = SPLINE_VIEWER_URL,
}: HeroProps) {
  const [loaded, setLoaded] = useState(false);

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

      <iframe
        src={src}
        title={`${heading}, ${subheading} — interactive 3D scene`}
        className="absolute inset-0 h-full w-full border-0"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 600ms ease-out",
        }}
        onLoad={() => setLoaded(true)}
        allow="autoplay; fullscreen"
      />

      {/* Spline paints its own background only once it boots. Without this the
          reader gets a flash of empty iframe on a slow connection. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-background"
        style={{
          opacity: loaded ? 0 : 1,
          transition: "opacity 600ms ease-out",
        }}
      />
    </section>
  );
}
