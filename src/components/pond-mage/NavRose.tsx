"use client";

import { useReducedMotion } from "motion/react";
import RoseBloom, { bloomBox, useRoses } from "./RoseBloom";

/**
 * The Pond Mage menu's touch: hovering Home, Work or About grows one of
 * Kai's roses on top of the word, drawn stroke by stroke as on the headings,
 * and leaving it lets the rose fade away. Each word has its own cluster and
 * spot, so the three read as a little bed rather than one stamp repeated.
 */

type Place = { c: string; u: number; v: number; w: number; mirror?: boolean };

/** Where on the word (0..1 across, 0..1 down the letters) and how wide (em). */
const PLACES: Record<string, Place> = {
  Home: { c: "C", u: 0.24, v: -0.08, w: 1.1 },
  Work: { c: "E", u: 0.8, v: -0.06, w: 1.25, mirror: true },
  About: { c: "D", u: 0.56, v: -0.12, w: 0.95 },
};

/** How long the rose takes to fade on leaving, s. */
export const NAV_ROSE_FADE = 0.45;

/**
 * `run` draws it afresh with each new value (the link counts its hovers) and
 * 0 clears it, once it has faded; `hot` is whether it is showing.
 */
export default function NavRose({
  word,
  run,
  hot,
}: {
  word: string;
  run: number;
  hot: boolean;
}) {
  const data = useRoses();
  const still = !!useReducedMotion();
  const place = PLACES[word];

  if (!place || !data) return null;
  const b = bloomBox(data, place.c);
  // The leaves' sway (LEAF_CSS) is already on the page, from PondScene.
  return (
    <RoseBloom
      data={data}
      id={place.c}
      run={run}
      still={still}
      mirror={place.mirror}
      // Twice the headings' pace: a hover is brief.
      speed={2}
      style={{
        left: `${place.u * 100}%`,
        // Kaisteel's letters fill the top of the line down to the
        // baseline, so "down the letters" starts a little into the line.
        top: `calc(0.18em + ${place.v} * 0.72em)`,
        width: `${place.w}em`,
        aspectRatio: `${b.w} / ${b.h}`,
        transform: "translate(-50%, -50%)",
        opacity: hot ? 1 : 0,
        transition: hot ? "none" : `opacity ${NAV_ROSE_FADE}s ease-out`,
      }}
    />
  );
}
