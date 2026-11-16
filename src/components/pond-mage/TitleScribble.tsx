"use client";

import { useEffect, useRef } from "react";
import { paint, type RosesData } from "./roses";

/** When each letter is coloured in: a beat apart, each taking a moment. */
export const LETTER_GAP = 0.075;
export const LETTER_DUR = 0.42;

/**
 * Kai's title lettering, coloured in by crayon. Each letter is scribbled
 * over, left to right, with the same brush as the roses, and the crisp
 * lettering shows through wherever the crayon has been. Once every letter is
 * in, the same canvas shows the whole lettering, so there is no handover to
 * jump at; the <img> is only for reduced motion.
 */
export default function TitleScribble({
  data,
  src,
  run,
  still,
}: {
  data: RosesData;
  src: string;
  run: number;
  still: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!run || still) return;
    const el = box.current;
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!el || !c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.max(1, Math.round(el.clientWidth * dpr));
    c.height = Math.max(1, Math.round(el.clientHeight * dpr));
    ctx.clearRect(0, 0, c.width, c.height);
    const mask = document.createElement("canvas");
    mask.width = c.width;
    mask.height = c.height;
    const mx = mask.getContext("2d")!;
    const k = c.width / data.title.w;
    const letters = data.title.letters;
    const drawn = letters.map(() => 0);
    const img = new Image();
    img.src = src;
    let raf = 0;
    let t0 = 0;
    const end = (letters.length - 1) * LETTER_GAP + LETTER_DUR;

    const tick = (now: number) => {
      if (!img.complete) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      letters.forEach((l, i) => {
        const f = Math.min(1, Math.max(0, (t - i * LETTER_GAP) / LETTER_DUR));
        const n = Math.round(f * l.p.length);
        if (n > drawn[i]) {
          paint(mx, data, l.p, drawn[i], n, [k, 0, 0], "#000");
          drawn[i] = n;
        }
      });
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      if (t < end) raf = requestAnimationFrame(tick);
      else {
        // The crayon is done: the whole lettering, drawn once more on the
        // same canvas, which stays. Swapping to the <img> here made the
        // letters jump in Safari, which rasterises the SVG (and its rough
        // edge filter) differently in an <img> than when drawn to a canvas.
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
      }
    };
    raf = requestAnimationFrame(tick);
    // If the title changes size once drawn, redraw it whole at the new size.
    let lastW = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastW || !img.complete) return;
      lastW = el.clientWidth;
      c.width = Math.max(1, Math.round(el.clientWidth * dpr));
      c.height = Math.max(1, Math.round(el.clientHeight * dpr));
      if (t0 && performance.now() - t0 >= end * 1000) ctx.drawImage(img, 0, 0, c.width, c.height);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [data, src, run, still]);

  return (
    <div ref={box} style={{ position: "absolute", inset: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", opacity: still ? 1 : 0 }}
      />
      <canvas
        ref={cv}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: still || !run ? 0 : 1 }}
      />
    </div>
  );
}
