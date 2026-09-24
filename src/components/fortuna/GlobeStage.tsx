"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import GlobeCanvas from "./GlobeCanvas";
import MiamiPin from "./MiamiPin";
import { FillLine } from "./FillText";
import type { Rich } from "@/content/fortuna";

/**
 * The globe's whole performance: it arrives, the pin drops, the line lights.
 *
 * Timed rather than scrubbed. Scrubbing tied the pace of the entrance to the
 * pace of the reader — a flick of the wheel made it snap, a slow drag made it
 * crawl — and it also ran backwards when they scrolled back up. This plays
 * once, at its own speed, the first time it is properly on screen, and then
 * stays where it finished for the rest of the page's life.
 *
 * One motion value drives all of it. The frame's lift, growth and fade are
 * three transforms of it, and the canvas reads the same value to turn the
 * planet, so the land cannot arrive out of step with the body it is painted
 * on.
 */

/** Long enough to be a reveal, short enough not to be a wait. */
const RISE_MS = 1.45;
/** Slow out of the gate, long glide into place. */
const RISE_EASE = [0.22, 0.61, 0.24, 1] as const;
/** A beat after the globe settles, so the two read as separate events. */
const PIN_DELAY = 220;

export default function GlobeStage({
  children,
  caption,
  width,
  height,
}: {
  children: ReactNode;
  caption: Rich;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Nearly half of it showing. Any less and the entrance starts while the
  // globe is still a sliver at the bottom of the screen and is mostly over by
  // the time the reader can see it.
  const inView = useInView(ref, { once: true, amount: 0.45 });

  const progress = useMotionValue(reduced ? 1 : 0);
  const [dropPin, setDropPin] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(progress, 1, {
      duration: RISE_MS,
      ease: RISE_EASE,
    });
    // The pin waits on the globe actually finishing rather than on a guessed
    // delay, so the two stay in step if the entrance is ever retuned.
    let timer: ReturnType<typeof setTimeout>;
    controls.then(() => {
      timer = setTimeout(() => setDropPin(true), PIN_DELAY);
    });
    return () => {
      controls.stop();
      clearTimeout(timer);
    };
  }, [inView, reduced, progress]);

  const y = useTransform(progress, [0, 1], [118, 0]);
  const scale = useTransform(progress, [0, 1], [0.66, 1]);
  const opacity = useTransform(progress, [0, 0.38], [0, 1]);

  return (
    <>
      <p
        style={{
          margin: "0 0 18px",
          maxWidth: "var(--f-measure-body)",
          marginInline: "auto",
          textAlign: "center",
          fontFamily: "var(--f-body)",
          fontSize: "var(--f-body-size)",
          lineHeight: 1.7,
          letterSpacing: "-0.02em",
        }}
      >
        <FillLine nodes={caption} filled={reduced ? true : landed} />
      </p>

      <motion.div
        ref={ref}
        style={{
          position: "relative",
          width: `min(${width}px, 100%)`,
          margin: "34px auto 0",
          aspectRatio: `${width} / ${height}`,
          // Grows from its own base, so it rises out of the page rather than
          // inflating around its middle.
          transformOrigin: "50% 85%",
          y: reduced ? 0 : y,
          scale: reduced ? 1 : scale,
          opacity: reduced ? 1 : opacity,
          willChange: "transform, opacity",
        }}
      >
        {children}
        <GlobeCanvas progress={progress} impact={landed} />
        <MiamiPin drop={reduced || dropPin} onLanded={() => setLanded(true)} />
      </motion.div>
    </>
  );
}
