"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadRoses, paint, reach, schedule, type RosesData } from "./roses";

/** The drawing's margin round a cluster, past its stamps' centres (drawing units). */
export const MARGIN = 12;

export function useRoses() {
  const [data, setData] = useState<RosesData | null>(null);
  useEffect(() => {
    let live = true;
    loadRoses().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);
  return data;
}

/** A cluster's box, margin included, in drawing units. */
export function bloomBox(data: RosesData, id: string) {
  const [w, h] = data.clusters[id].size;
  return { w: w + 2 * MARGIN, h: h + 2 * MARGIN };
}

/**
 * One of Kai's rose clusters, drawing itself: the dark base, the lighter
 * orange, the dark centres, then the leaves behind, which ease into place as
 * they come and then sway a little. `run` starts a drawing (each new value
 * draws it again from nothing); 0 clears it. The parent sizes and places the
 * box (`style`); the drawing fills it.
 */
export default function RoseBloom({
  data,
  id,
  run,
  delay = 0,
  mirror = false,
  still = false,
  speed = 1,
  style,
}: {
  data: RosesData;
  id: string;
  run: number;
  /** Seconds after `run` changes before the pen starts. */
  delay?: number;
  mirror?: boolean;
  /** Reduced motion: drawn complete at once, no sway. */
  still?: boolean;
  /** How many times faster than Kai drew it the pen goes. */
  speed?: number;
  style: CSSProperties;
}) {
  const box = useRef<HTMLDivElement>(null);
  const leafC = useRef<HTMLCanvasElement>(null);
  const roseC = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = box.current;
    const lc = leafC.current;
    const rc = roseC.current;
    if (!el || !lc || !rc) return;
    const lx = lc.getContext("2d");
    const rx = rc.getContext("2d");
    if (!lx || !rx) return;
    const cluster = data.clusters[id];
    const { w } = bloomBox(data, id);
    const { strokes, end } = schedule(cluster);
    const drawn = strokes.map(() => 0);
    let raf = 0;
    let t0 = 0;
    let leafShown = false;
    let finished = false;
    // The leaves' motion is a class on their canvas, set as the drawing goes.
    const setLeafState = (s: "hidden" | "grow" | "sway") => {
      lc.className = `pm-leaf pm-leaf-${s}`;
      lc.style.animationDuration = s === "grow" && speed !== 1 ? `${1.1 / speed}s` : "";
    };

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const cw = Math.max(1, Math.round(el.clientWidth * dpr));
      const ch = Math.max(1, Math.round(el.clientHeight * dpr));
      if (lc.width === cw && lc.height === ch) return false;
      lc.width = rc.width = cw;
      lc.height = rc.height = ch;
      drawn.fill(0);
      return true;
    };
    const base = (): [number, number, number] => {
      const k = lc.width / w;
      return [k, lc.width / 2, lc.height / 2];
    };
    const draw = (t: number) => {
      const b = base();
      strokes.forEach((s, i) => {
        const n = still ? s.stroke.p.length : reach(t, s);
        if (n > drawn[i]) {
          paint(s.leaf ? lx : rx, data, s.stroke.p, drawn[i], n, b, s.stroke.c, mirror);
          drawn[i] = n;
        }
      });
    };

    if (!run) {
      fit();
      lx.clearRect(0, 0, lc.width, lc.height);
      rx.clearRect(0, 0, rc.width, rc.height);
      drawn.fill(0);
      setLeafState("hidden");
      return;
    }

    fit();
    lx.clearRect(0, 0, lc.width, lc.height);
    rx.clearRect(0, 0, rc.width, rc.height);
    setLeafState("hidden");

    if (still) {
      draw(Infinity);
      setLeafState("sway");
      finished = true;
    } else {
      const leafAt = Math.min(...strokes.filter((s) => s.leaf).map((s) => s.start), end);
      const tick = (now: number) => {
        if (!t0) t0 = now;
        const t = ((now - t0) / 1000 - delay) * speed;
        if (t >= 0) draw(t);
        if (!leafShown && t >= leafAt) {
          leafShown = true;
          setLeafState("grow");
        }
        // Runs on until the leaves have finished easing in, then hands them to the sway.
        if (t < Math.max(end + 0.05, leafAt + 1.15)) raf = requestAnimationFrame(tick);
        else {
          finished = true;
          setLeafState("sway");
        }
      };
      raf = requestAnimationFrame(tick);
    }

    // A new size redraws what has been drawn so far, sharp at the new size.
    const ro = new ResizeObserver(() => {
      if (fit() && finished) draw(Infinity);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [data, id, run, delay, mirror, still, speed]);

  const canvas: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  return (
    <div ref={box} aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", ...style }}>
      <canvas ref={leafC} className="pm-leaf pm-leaf-hidden" style={canvas} />
      <canvas ref={roseC} style={canvas} />
    </div>
  );
}

/** The leaves' motion: eased in as they are drawn, then a slow sway. */
export const LEAF_CSS = `
  .pm-leaf { transform-origin: 50% 50%; }
  .pm-leaf-grow { animation: pm-leaf-in 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .pm-leaf-sway { animation: pm-leaf-sway 7s ease-in-out infinite; }
  @keyframes pm-leaf-in {
    from { transform: rotate(-7deg) scale(0.94); }
    to { transform: rotate(0deg) scale(1); }
  }
  @keyframes pm-leaf-sway {
    0%, 100% { transform: rotate(0deg); }
    30% { transform: rotate(1.6deg); }
    70% { transform: rotate(-1.4deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .pm-leaf-grow, .pm-leaf-sway { animation: none; }
  }
`;
