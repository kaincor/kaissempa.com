"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import RoseBloom, { bloomBox, useRoses } from "./RoseBloom";

export type RosePlace = {
  /** Which of Kai's clusters. */
  c: string;
  /** The letter it grows on, by index into the heading. */
  at: number;
  /** Where its centre sits on that letter: 0..1 across and down the letter's box. */
  u: number;
  v: number;
  /** Its width, in em. */
  w: number;
  mirror?: boolean;
};

/**
 * A heading with one of Kai's roses growing on a letter of it, drawn each
 * time the heading comes into view. The letter is found by measuring the
 * text, not by wrapping it, so Kaisteel's ligatures and kerning are left
 * whole.
 */
export default function RoseHeading({ text, rose }: { text: string; rose: RosePlace }) {
  const data = useRoses();
  const still = !!useReducedMotion();
  const wrap = useRef<HTMLSpanElement>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const [run, setRun] = useState(0);

  // The letter's box, relative to the heading.
  useEffect(() => {
    const el = wrap.current;
    const node = el?.firstChild;
    if (!el || !node || node.nodeType !== Node.TEXT_NODE) return;
    const measure = () => {
      const r = document.createRange();
      const i = Math.min(rose.at, text.length - 1);
      r.setStart(node, i);
      r.setEnd(node, i + 1);
      const b = r.getBoundingClientRect();
      const o = el.getBoundingClientRect();
      // Kaisteel's letters fill roughly the top 0.72em of the line box down
      // to the baseline; the range covers the whole line, so take that part.
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const top = b.top - o.top + (b.height - fs * 0.92) / 2 + fs * 0.12;
      setSpot({ x: b.left - o.left + rose.u * b.width, y: top + rose.v * fs * 0.72 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [text, rose.at, rose.u, rose.v]);

  // Drawn on arrival, cleared on leaving, drawn again on the way back.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let shown = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.99 && !shown) {
          shown = true;
          setRun((r) => r + 1);
        } else if (!e.isIntersecting && shown) {
          shown = false;
          setRun(0);
        }
      },
      { threshold: [0, 0.99], rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let bloom = null;
  if (data && spot) {
    const b = bloomBox(data, rose.c);
    bloom = (
      <RoseBloom
        data={data}
        id={rose.c}
        run={run}
        still={still}
        mirror={rose.mirror}
        // A beat after the heading has begun to fade in.
        delay={0.35}
        style={{
          left: spot.x,
          top: spot.y,
          width: `${rose.w}em`,
          aspectRatio: `${b.w} / ${b.h}`,
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  }

  return (
    <span ref={wrap} style={{ position: "relative", display: "inline-block" }}>
      {text}
      {bloom}
    </span>
  );
}
