"use client";

import { useEffect, useState } from "react";

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
  const [covered, setCovered] = useState(true);

  // The iframe can finish loading before React hydrates, in which case its
  // load event is missed entirely and onLoad never fires. The cover must
  // therefore clear on a timer too, or the hero stays blank forever.
  useEffect(() => {
    const t = setTimeout(() => setCovered(false), 6000);
    return () => clearTimeout(t);
  }, []);

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

      {/* Never opacity-gated. The cover below handles the blank-frame flash, so
          a missed load event degrades to a slightly late fade, not a dead hero. */}
      <iframe
        src={src}
        title={`${heading}, ${subheading} — interactive 3D scene`}
        className="absolute inset-0 h-full w-full border-0"
        onLoad={() => setCovered(false)}
        allow="autoplay; fullscreen"
      />

      {/* Spline paints its own background only once it boots. Without this the
          reader gets a flash of empty iframe on a slow connection. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-background"
        style={{
          opacity: covered ? 1 : 0,
          transition: "opacity 600ms ease-out",
        }}
      />
    </section>
  );
}
