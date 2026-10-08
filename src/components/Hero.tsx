"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PHONE_MAX } from "./hero/constants";

/**
 * The live scene loads after the page has painted. Until its first frame is
 * drawn, a still of that same frame stands in for it, so the hero is there
 * the instant the page is — the 3D catches up behind it and takes over
 * without a visible change.
 */
const HeroScene = dynamic(() => import("./hero/HeroScene"), { ssr: false });

export type HeroProps = {
  /** Heading for screen readers and crawlers. The visible wordmark is 3D
   *  geometry inside the scene, so it is invisible to both. */
  heading?: string;
  subheading?: string;
  /** Rendered behind the transparent 3D canvas. */
  behind?: ReactNode;
  /** Rendered in front of it, inside the hero bounds. */
  inFront?: ReactNode;
};

/**
 * The poster's own shape. The camera keeps a fixed vertical field of view,
 * so the scene always fills the hero's height and only shows more or less at
 * the sides; a poster set to the full height and centred lines up with it at
 * any width. Wide is 2.4:1 so even a very wide window is covered; the phone
 * layout is square.
 */
const POSTER = {
  wide: { aspect: 2.4, base: "/hero/poster-wide" },
  phone: { aspect: 1, base: "/hero/poster-phone" },
};

export default function Hero({
  heading = "Kai Ssempa",
  subheading = "Designer & Developer",
  behind,
  inFront,
}: HeroProps) {
  const [load, setLoad] = useState(false);
  const [live, setLive] = useState(false);
  const onFirstFrame = useCallback(() => setLive(true), []);

  // Start fetching the scene once the page is idle, not during first paint.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setLoad(true), { timeout: 1200 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setLoad(true), 300);
    return () => clearTimeout(t);
  }, []);

  const srcs = (base: string) => ({
    avif: `${base}-1x.avif 1x, ${base}-2x.avif 2x`,
    webp: `${base}-1x.webp 1x, ${base}-2x.webp 2x`,
  });
  const wide = srcs(POSTER.wide.base);
  const phone = srcs(POSTER.phone.base);
  const phoneQuery = `(max-width: ${PHONE_MAX}px)`;

  return (
    // svh, not dvh: the small viewport height stays put while a phone's
    // address bar slides, where dvh resized the hero, and the scene with it,
    // on every scroll.
    <section className="relative w-full overflow-hidden bg-background" style={{ height: "100svh" }}>
      {/* The scene's own text is geometry, so the page would otherwise have no
          heading at all for search engines or a screen reader. */}
      <h1 className="sr-only">
        {heading} — {subheading}
      </h1>

      {behind ? <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>{behind}</div> : null}

      {/* The still. Gone the moment the live scene has drawn. */}
      <picture
        style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", visibility: live ? "hidden" : "visible" }}
      >
        <source media={phoneQuery} type="image/avif" srcSet={phone.avif} />
        <source media={phoneQuery} type="image/webp" srcSet={phone.webp} />
        <source type="image/avif" srcSet={wide.avif} />
        <img
          src={`${POSTER.wide.base}-1x.webp`}
          srcSet={wide.webp}
          alt=""
          fetchPriority="high"
          decoding="async"
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            height: "100%",
            width: "auto",
            maxWidth: "none",
            transform: "translateX(-50%)",
          }}
        />
      </picture>

      {load ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }} title={`${heading}, ${subheading}`}>
          <HeroScene onFirstFrame={onFirstFrame} />
        </div>
      ) : null}

      {inFront ? <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>{inFront}</div> : null}
    </section>
  );
}
