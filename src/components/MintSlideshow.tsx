"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Kai's Mint Magazine covers, one at a time, crossfading every 1.5s. Ordered
 * so the two takes of one person never play back to back, the last included
 * (it wraps round to the first).
 *
 * Each cover is the photo with its MINT wordmark drawn over it as a vector,
 * so the letters stay sharp at any size instead of being compressed into the
 * photo. Placement is from Kai's Figma frames (2240x1120 exports), as
 * percentages of the frame: left, top, width.
 *
 * `pinned` covers have the wordmark worked into the scene (tucked behind or
 * around things in the photo), so it moves with the photo rather than
 * holding still over it. On the rest it holds still, which reads as depth.
 */
const SLIDES = [
  { name: "aiden-3", pinned: false, at: [58.75, 68.66, 39.29] },
  { name: "cyprien-3", pinned: false, at: [5.18, 8.66, 39.82] },
  { name: "jacob-5", pinned: false, at: [24.11, 62.86, 51.61] },
  { name: "chloe-3", pinned: true, at: [9.29, 38.13, 43.66] },
  { name: "aiden-4", pinned: false, at: [4.29, 7.5, 49.91] },
  { name: "cyprien-4", pinned: true, at: [57.68, 70.27, 40.36] },
  { name: "jacob-6", pinned: true, at: [2.19, 28.93, 63.53] },
  { name: "tom-4", pinned: true, at: [60.71, 5.45, 37.14] },
] as const;

const HOLD_MS = 1500;
const FADE_MS = 800;
/** How far right of its resting place a photo starts, as % of the frame. */
const DRIFT_PCT = 1.5;

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
  // A running count rather than the index, so the cover on its way out is
  // known too (none before the first change).
  const [step, setStep] = useState(0);
  const index = step % SLIDES.length;
  const leaving = step > 0 ? (step - 1) % SLIDES.length : -1;

  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setStep((n) => n + 1);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, [inView, reduced]);

  return (
    <div
      ref={ref}
      style={{ position: "absolute", inset: 0, background: "#000" }}
    >
      {SLIDES.map(({ name, pinned, at: [left, top, width] }, i) => {
        const wordmark = (
          // eslint-disable-next-line @next/next/no-img-element
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
        );
        return (
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
                i === index
                  ? `opacity ${FADE_MS}ms ease-in-out`
                  : `opacity 0ms linear ${FADE_MS}ms`,
            }}
          >
            {/* The photo drifts a touch right to left as it fades in, easing
              out until the next one comes. As that one fades in over it, it
              carries on left, picking up speed, so it eases out the way it
              eased in. Scaled up slightly so the drift never shows an edge.
              The wordmark stays still on top,
              unless it is pinned to the photo. The reset back to the right
              waits until the photo is covered. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateX(${
                  reduced || i === index
                    ? 0
                    : i === leaving
                      ? -DRIFT_PCT
                      : DRIFT_PCT
                }%) scale(1.04)`,
                transition:
                  i === index
                    ? `transform ${HOLD_MS + FADE_MS}ms cubic-bezier(0.25, 0.6, 0.35, 1)`
                    : i === leaving
                      ? `transform ${FADE_MS + 400}ms cubic-bezier(0.55, 0, 0.85, 0.4)`
                      : "transform 0ms",
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
              {pinned ? wordmark : null}
            </div>
            {pinned ? null : wordmark}
          </div>
        );
      })}
    </div>
  );
}
