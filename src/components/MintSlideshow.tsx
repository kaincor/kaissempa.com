"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Kai's Mint Magazine covers, one at a time, crossfading every 2s. Ordered
 * so the two takes of one person never play back to back, the last included
 * (it wraps round to the first).
 *
 * Each cover is the photo with its MINT wordmark drawn over it as a vector,
 * so the letters stay sharp at any size instead of being compressed into the
 * photo. Placement is from Kai's Figma frames (2240x1120 exports), as
 * percentages of the frame: left, top, width.
 */
const SLIDES = [
  { name: "aiden-3", at: [58.75, 68.66, 39.29] },
  { name: "cyprien-3", at: [5.18, 8.66, 39.82] },
  { name: "jacob-5", at: [24.11, 62.86, 51.61] },
  { name: "chloe-3", at: [9.29, 38.13, 43.66] },
  { name: "aiden-4", at: [4.29, 7.5, 49.91] },
  { name: "cyprien-4", at: [57.68, 70.27, 40.36] },
  { name: "jacob-6", at: [2.19, 28.93, 63.53] },
  { name: "tom-4", at: [60.71, 5.45, 37.14] },
] as const;

const HOLD_MS = 2000;
const FADE_MS = 800;

/**
 * Every image is stacked in the frame and only the current one is opaque, so
 * the change is a crossfade with nothing empty between. All of them load
 * with the thumbnail, so each is ready before its turn. It stops while the
 * thumbnail is off-screen or the tab is hidden, and with reduced motion it
 * holds on the first image.
 */
export default function MintSlideshow({ sizes }: { sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % SLIDES.length);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, [inView, reduced]);

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, background: "#000" }}>
      {SLIDES.map(({ name, at: [left, top, width] }, i) => (
        <div
          key={name}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === index ? 1 : 0,
            // The incoming cover fades in on top; the outgoing one stays
            // opaque underneath until it is covered, then drops out at once,
            // so nothing dark shows through mid-fade.
            zIndex: i === index ? 2 : 1,
            transition:
              i === index ? `opacity ${FADE_MS}ms ease-in-out` : `opacity 0ms linear ${FADE_MS}ms`,
          }}
        >
          <Image
            src={`/case-studies/mint/${name}.jpg`}
            alt=""
            fill
            sizes={sizes}
            quality={90}
            style={{ objectFit: "cover" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/case-studies/mint/${name}-wordmark.svg`}
            alt=""
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              // Tailwind's preflight caps img at 100% width; the art is placed
              // by percentage and must not be resized by it.
              maxWidth: "none",
              height: "auto",
            }}
          />
        </div>
      ))}
    </div>
  );
}
