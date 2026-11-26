"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { seg } from "../reel/motion";

/**
 * The three primary colours, as a card that keeps re-dividing itself: green
 * across the top, orange and cream underneath. The two edges between them
 * slide, hold, and slide again, so each colour takes its turn being the
 * biggest, and the loop comes back to where it started.
 *
 * Timed off the reference, measured frame by frame: each move takes 1.1 s
 * and eases in and out, then the card holds for 0.9 s. The horizontal edge
 * goes from half to a third, to two thirds, and back; the vertical one from
 * half to two thirds and back. The type rides the edge it's pinned to, a
 * beat behind it, so it trails the colour.
 */

const GREEN = "#69BD45";
const CREAM = "#F7F5F0";
const ORANGE = "#F58120";

const PERIOD = 6;
/** [when the move starts, where the edges go: horizontal, vertical]. */
const MOVES: [number, number, number][] = [
  [0, 1 / 3, 1 / 2],
  [2, 2 / 3, 2 / 3],
  [4, 1 / 2, 1 / 2],
];
const MOVE = 1.1;
/** How far behind its edge the type follows, in seconds. */
const LAG = 0.035;

const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

/** Where the two edges are at time t, as fractions of the card. */
function edges(t: number) {
  t = ((t % PERIOD) + PERIOD) % PERIOD;
  let h = MOVES[MOVES.length - 1][1];
  let v = MOVES[MOVES.length - 1][2];
  for (const [at, h1, v1] of MOVES) {
    if (t < at) break;
    const u = easeInOutCubic(seg(t, at, at + MOVE));
    h += (h1 - h) * u;
    v += (v1 - v) * u;
  }
  return { h, v };
}

const SWATCHES = {
  green: { name: ["Lucky", "Green"], hex: "#69BD45", bg: GREEN, ink: CREAM },
  orange: { name: ["Sunset", "Drive"], hex: "#F58120", bg: ORANGE, ink: CREAM },
  cream: { name: ["Common", "Cream"], hex: "#F7F5F0", bg: CREAM, ink: GREEN },
};

export default function PaletteReel() {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const q = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
    const top = q("green");
    const left = q("orange");
    const right = q("cream");
    const topHex = q("green-hex");
    const leftName = q("orange-name");
    const rightName = q("cream-name");
    const rightHex = q("cream-hex");

    const draw = (t: number) => {
      const { h, v } = edges(t);
      const late = edges(t - LAG);
      const H = root.clientHeight;
      const W = root.clientWidth;
      top.style.height = `${h * 100}%`;
      left.style.top = right.style.top = `${h * 100}%`;
      left.style.width = `${v * 100}%`;
      right.style.left = `${v * 100}%`;
      // The type pinned to a moving edge trails it a little.
      const dy = (late.h - h) * H;
      const dx = (late.v - v) * W;
      topHex.style.transform = `translateY(${dy.toFixed(2)}px)`;
      leftName.style.transform = `translateY(${dy.toFixed(2)}px)`;
      rightName.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      rightHex.style.transform = `translateX(${dx.toFixed(2)}px)`;
    };

    if (reduced) {
      draw(PERIOD - 0.01);
      return;
    }
    draw(0);
    let visible = false;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.2 });
    io.observe(root);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible) return;
      time = (time + dt) % PERIOD;
      draw(time);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  const panel: React.CSSProperties = { position: "absolute", overflow: "hidden" };
  const name = (s: (typeof SWATCHES)[keyof typeof SWATCHES], k?: string) => (
    <div
      data-k={k}
      style={{
        position: "absolute",
        top: "6cqw",
        left: "6cqw",
        fontFamily: "var(--f-display)",
        fontSize: "5.9cqw",
        lineHeight: 1.02,
        letterSpacing: "-0.02em",
        color: s.ink,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "block" }}>{s.name[0]}</span>
      <span style={{ display: "block" }}>{s.name[1]}</span>
    </div>
  );
  const hex = (s: (typeof SWATCHES)[keyof typeof SWATCHES], k?: string) => (
    <div
      data-k={k}
      style={{
        position: "absolute",
        bottom: "6cqw",
        left: "6cqw",
        fontFamily: "var(--f-grotesk)",
        fontSize: "3cqw",
        fontWeight: 500,
        letterSpacing: "0.06em",
        color: s.ink,
      }}
    >
      {s.hex}
    </div>
  );

  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          ref={host}
          role="img"
          aria-label="The Fortuna palette as a card that keeps re-dividing itself: Lucky Green, #69BD45, across the top; Sunset Drive orange, #F58120, and Common Cream, #F7F5F0, underneath. The edges between them slide so each colour takes its turn being the biggest."
          style={{
            position: "relative",
            containerType: "inline-size",
            width: "min(100%, 440px)",
            aspectRatio: "4 / 5",
            borderRadius: "clamp(16px, 2.2vw, 24px)",
            overflow: "hidden",
            background: CREAM,
            boxShadow: "0 1px 2px rgba(40,40,30,0.08), 0 22px 48px rgba(40,40,30,0.16)",
          }}
        >
          <div data-k="green" style={{ ...panel, left: 0, top: 0, width: "100%", height: "50%", background: SWATCHES.green.bg }}>
            {name(SWATCHES.green)}
            {hex(SWATCHES.green, "green-hex")}
          </div>
          <div data-k="orange" style={{ ...panel, left: 0, top: "50%", bottom: 0, width: "50%", background: SWATCHES.orange.bg }}>
            {name(SWATCHES.orange, "orange-name")}
            {hex(SWATCHES.orange)}
          </div>
          <div data-k="cream" style={{ ...panel, left: "50%", top: "50%", right: 0, bottom: 0, background: SWATCHES.cream.bg }}>
            {name(SWATCHES.cream, "cream-name")}
            {hex(SWATCHES.cream, "cream-hex")}
          </div>
        </div>
      </div>
    </figure>
  );
}
