"use client";

import { useEffect, useRef, useState } from "react";
import { paint, type RosesData } from "./roses";

/** When each letter is coloured in: a beat apart, each taking a moment. */
export const LETTER_GAP = 0.075;
export const LETTER_DUR = 0.42;

/**
 * Kai's title lettering, coloured in by crayon. Each letter is scribbled
 * over, left to right, with the same brush as the roses, and the crisp
 * lettering shows through wherever the crayon has been. Once every letter is
 * in, the vector lettering itself takes over, so what stays on screen is the
 * SVG exactly.
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
  // Which drawing has finished: the lettering shows once the current one has.
  const [doneRun, setDoneRun] = useState(0);
  const done = still || (run !== 0 && doneRun === run);

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
      else setDoneRun(run);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data, src, run, still]);

  return (
    <div ref={box} style={{ position: "absolute", inset: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", opacity: done ? 1 : 0 }}
      />
      <canvas
        ref={cv}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: done || !run ? 0 : 1 }}
      />
    </div>
  );
}
