"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * The persona sheet's outline, drawn rather than switched on.
 *
 * It starts as a point at the top of the sheet and opens out from there —
 * both ends travelling at the same rate, along the top, round the corners and
 * down the sides, until they run out into the fade at the bottom. Two halves
 * rather than one loop: a single path drawn from a start point unrolls one
 * way round the box like a tape measure, and the thing that makes this read
 * as a frame opening is that the two sides are always mirror images.
 *
 * An SVG, not the CSS border it replaces. A border can be revealed by a mask
 * but it cannot be drawn — there is no way to say "the first 40% of this
 * box's edge". A stroked path has a length, and `pathLength` normalises that
 * length to 1 whatever the sheet's actual size, so the same number means the
 * same fraction of the way round at every breakpoint.
 */

/** Seconds for the outline to reach the bottom of the sheet. */
const DRAW = 1.7;
/**
 * Eased at both ends rather than only the far one.
 *
 * The page's usual entrance ease front-loads almost everything: measured on
 * this path it was three fifths of the way round in 360ms, which crosses the
 * whole top edge — the part the reader is actually watching — in under two
 * tenths of a second and then crawls down the sides. A symmetric ease spends
 * the time where the drawing is visible.
 */
const PACE = "easeInOut" as const;
/**
 * The dot it starts as.
 *
 * A fraction of the half-perimeter rather than zero: at zero there is nothing
 * on screen and the outline appears to start a few frames in, once it is long
 * enough to see. Four thousandths of a ~900px run is a 3–4px mark, which
 * against a 2px round-capped stroke is a dot.
 */
const SEED = 0.004;

export default function SheetFrame({
  radius,
  color,
  width,
  fade,
}: {
  radius: number;
  color: string;
  /** Stroke weight, in pixels. */
  width: number;
  /** A CSS mask, where the outline gives out at the bottom. */
  fade: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reduced = useReducedMotion();

  // The path is in real pixels, so it has to be rebuilt when the sheet
  // reflows. Scaling one viewBox instead would stretch the corner radii into
  // ellipses and thin the stroke on one axis.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  // The stroke straddles the path, so the centre line sits half a width in —
  // which is where a CSS border of the same weight would put it, and keeps
  // the outline inside the sheet's box rather than half outside it.
  const i = width / 2;
  const r = Math.max(0, Math.min(radius - i, (w - width) / 2, (h - width) / 2));
  const mid = w / 2;

  // Each half leaves the top centre and travels to the bottom centre, one
  // clockwise and one anticlockwise.
  const right = `M ${mid} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r} V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i} H ${mid}`;
  const left = `M ${mid} ${i} H ${i + r} A ${r} ${r} 0 0 0 ${i} ${i + r} V ${h - i - r} A ${r} ${r} 0 0 0 ${i + r} ${h - i} H ${mid}`;

  return (
    <div
      ref={box}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        maskImage: fade,
        WebkitMaskImage: fade,
        pointerEvents: "none",
      }}
    >
      {w > 0 && h > 0 ? (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          fill="none"
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Stable keys, so a reflow updates the path in place. Keying on
              the path data would remount both halves on every resize and
              replay the draw from the dot. */}
          {[
            ["left", left],
            ["right", right],
          ].map(([side, d]) => (
            <motion.path
              key={side}
              d={d}
              stroke={color}
              strokeWidth={width}
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: SEED }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: DRAW, ease: PACE }}
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}
