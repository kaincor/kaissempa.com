"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import type { MountainRange as Range } from "@/data/mountainRanges";

export type MountainRangeProps = {
  range: Range;
  /** Any CSS length. The silhouette stretches to fill it. */
  height?: string;
  color?: string;
  /** Extra pixels the ridge lifts across one viewport of scrolling. */
  rise?: number;
  /** Pixels to sink the ridge below the fold, so less of it shows at rest. */
  drop?: number;
  /**
   * Padding under the section's content. Defaults to `rise`, which stops the
   * lift exposing page background when nothing follows. Pass 0 when the next
   * section already extends this colour upward behind itself.
   */
  padBottom?: number;
  /** Content for the solid section below the ridge. */
  children?: ReactNode;
};

/**
 * The lift MountainRange applies, as a motion value.
 *
 * Exported because anything that has to stay welded to the bottom of a
 * MountainRange has to move by exactly this, and a hard-coded number will not
 * do it. The lift saturates after one viewport of scrolling, so on a tall
 * screen a block further down the page can assume it has already finished and
 * cancel it with a constant. On a short screen the section above is short too,
 * the next block reaches the viewport after a couple of hundred pixels of
 * scrolling, and that assumption is simply false — the constant overshoots by
 * whatever the lift has not done yet.
 */
export function useRangeLift(rise: number) {
  const { scrollY } = useScroll();
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const sync = () => setVh(window.innerHeight);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return useTransform(scrollY, [0, vh || 1], [0, -rise]);
}

/**
 * A full-bleed ridge whose base rests on the bottom of the viewport at rest,
 * overlapping whatever sits above it, with a solid section of the same colour
 * running beneath. Scrolling lifts the pair faster than the page so the range
 * rises out of the scene.
 *
 * preserveAspectRatio="none" lets the ridge span any viewport width at a height
 * we control, rather than towering on wide screens and collapsing to a sliver
 * on a phone. The trade is horizontal stretch: peaks flatten on ultrawide.
 */
export default function MountainRange({
  range,
  height = "clamp(70px, 10vw, 180px)",
  color = "#000000",
  rise = 140,
  drop = 28,
  padBottom,
  children,
}: MountainRangeProps) {
  const reduced = useReducedMotion();
  const y = useRangeLift(rise);
  // Pins the skirt below to the hero's edge while this block parallaxes.
  const counter = useTransform(y, (v) => -v);

  return (
    <motion.div
      style={{
        position: "relative",
        zIndex: 1,
        y: reduced ? 0 : y,
        willChange: "transform",
      }}
    >
      {/* The skirt.

          The layer behind the 3D scene hangs a full viewport of black under
          its own silhouette, and that is what keeps the bottom of the hero
          covered. But the hero clips it, and once `drop` sinks this ridge far
          enough that its section starts below the hero's edge, the strip in
          between is backed by nothing at all: the only black there is this
          silhouette, so every valley in it shows page grey. Measured at
          drop 56, that was a 55px strip with 108px of its width bare.

          So this fills exactly that strip. It is pinned to the hero's edge
          rather than carried along with the parallax — the block it belongs to
          rides up as the reader scrolls, and a skirt that rode with it would
          climb into the sky and black out the valleys of the ridge behind.
          Three pixels of overlap upward, into territory the layer behind is
          already painting black, to bury the seam. */}
      {drop > 0 ? (
        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -3,
            left: 0,
            right: 0,
            height: drop + 3,
            background: color,
            y: reduced ? 0 : counter,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <svg
        viewBox={range.viewBox}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        style={{
          display: "block",
          // Pulls the ridge up over the section above so its base lands on the
          // bottom edge of the viewport at scroll 0, less `drop` to sink it.
          marginTop: `calc(${drop}px - (${height}))`,
          // The negative margin puts the ridge over the hero; without this the
          // transparent sky would swallow clicks meant for the 3D scene.
          pointerEvents: "none",
          // Several paths stop a fraction short of their viewBox floor, and
          // preserveAspectRatio="none" scales that shortfall up. Dropping the
          // silhouette a pixel buries the seam under the section below.
          transform: "translateY(1px)",
        }}
        aria-hidden="true"
        focusable="false"
      >
        <path d={range.d} fill={color} />
      </svg>

      <section
        style={{
          background: color,
          // Covers sub-pixel rounding where the path stops a fraction short of
          // the viewBox floor, which would otherwise show as a hairline seam.
          marginTop: -1,
          // The whole block rides upward, so without this the lift would expose
          // page background below the last section.
          paddingBottom: Math.max(padBottom ?? rise, 0),
        }}
      >
        {children}
      </section>
    </motion.div>
  );
}
