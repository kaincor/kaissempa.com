"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DOT, GLYPHS } from "../reel/wordmark";

/**
 * The wordmark as a construction sheet: the letters in outline over a hatch,
 * the guides they were drawn to, and their proportions measured off.
 *
 * Every number is measured from the wordmark's own outlines, in its units:
 *   Y, the f from its top to the baseline: 39.94
 *   Z, one stem (f, r, t, u, n): 10.38
 *   the whole mark with its full stop: 206 = 5.16Y
 *   the x-height: 27.48 = 0.69Y
 *   the o's counter: 6.98 = 0.67Z
 *   the u's and n's counters: 6.0 = 0.58Z; the a's: 5.04 = 0.49Z
 *   the full stop: 10.71 across = 1.03Z, about one stem
 *
 * It draws itself in once when it comes on screen, the way it would be drawn
 * by hand: the frame and the band are ruled, the guides dropped through
 * them, the letters traced in outline one after another and then hatched,
 * the measurements laid over them, and the numbers written in last.
 */

const GREEN = "#69BD45";
const ORANGE = "#F58120";

/** The sheet, in wordmark units, and where the wordmark sits on it. */
const VW = 360;
const VH = 202.5;
const OX = 75;
const OY = 79;

const Y = 39.94;
const X_TOP = 12.46;
const MARK_W = 206;
/** The tall frame and the wide band, as in a construction sheet. */
const BOX = { x: 0, y: -36, w: MARK_W, h: 112 };
const BAND = { x: -26, y: 0, w: MARK_W + 52, h: Y };
/** Pairs of vertical guides: the f's stem, and the full stop. */
const GUIDES = [3.11, 13.5, 195.29, 206];
const BOX_R = 3;
/** How far a guide stops short of the frame's ends, so it meets a rounded corner on the curve. */
function inset(x: number) {
  const d = Math.min(x - BOX.x, BOX.x + BOX.w - x);
  return d >= BOX_R ? 0 : BOX_R - Math.sqrt(BOX_R ** 2 - (BOX_R - d) ** 2);
}

/** The measured widths: [left, right, label]. */
const BARS: [number, number, string][] = [
  [30.62, 37.6, "0.67Z"],
  [53.56, 63.94, "Z"],
  [109.96, 115.96, "0.58Z"],
  [173.82, 178.86, "0.49Z"],
];
const BAR_TOP = -14;
const BAR_BOTTOM = 52;

/** A bracket with arrowed ends, open towards the mark. */
function bracket(x0: number, x1: number, y: number, dir: 1 | -1) {
  const t = 4 * dir;
  const a = 1.3;
  const arrow = (x: number) => `M${x - a} ${y + t - 1.6 * dir} L${x} ${y + t} L${x + a} ${y + t - 1.6 * dir}`;
  return `M${x0} ${y + t} V${y} H${x1} V${y + t} ${arrow(x0)} ${arrow(x1)}`;
}
function vbracket(y0: number, y1: number, x: number, dir: 1 | -1) {
  const t = 4 * dir;
  const a = 1.3;
  const arrow = (y: number) => `M${x + t - 1.6 * dir} ${y - a} L${x + t} ${y} L${x + t - 1.6 * dir} ${y + a}`;
  return `M${x + t} ${y0} H${x} V${y1} H${x + t} ${arrow(y0)} ${arrow(y1)}`;
}

const BRACKETS = [
  bracket(0, MARK_W, -46, 1),
  vbracket(0, Y, MARK_W + 40, -1),
  vbracket(X_TOP, Y, -40, 1),
  bracket(3.11, 13.5, BOX.y + BOX.h + 10, -1),
  bracket(195.29, 206, BOX.y + BOX.h + 10, -1),
];

/** Labels, placed over the sheet in its own units, and when each is written in. */
const LABELS: { x: number; y: number; text: string[]; align?: "start" | "end"; hang?: boolean; at: number }[] = [
  { x: MARK_W / 2, y: -52, text: ["5.16Y"], at: 3.05 },
  { x: MARK_W + 46, y: Y / 2, text: ["Y"], align: "start", at: 3.15 },
  { x: -46, y: (X_TOP + Y) / 2, text: ["0.69Y"], align: "end", at: 3.2 },
  ...BARS.map(([a, b, text], i) => ({ x: (a + b) / 2, y: BAR_TOP - 4.5, text: [text], at: 2.75 + i * 0.1 })),
  { x: 8.3, y: BOX.y + BOX.h + 13, text: ["Stem", "Z = 0.26Y"], hang: true, at: 3.3 },
  { x: 200.65, y: BOX.y + BOX.h + 13, text: ["Full stop", "1.03Z"], hang: true, at: 3.4 },
];

/**
 * How fast it draws itself in. The times below are the drawing's own order
 * and spacing; this scales the whole of it, so it takes about two seconds.
 */
const PACE = 0.55;

export default function WordmarkSpec() {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const seen = useInView(host, { once: true, amount: 0.35 });
  const on = reduced || seen;

  const ease = "cubic-bezier(0.65, 0, 0.35, 1)";
  /** A line ruled in: its stroke drawn from one end to the other. */
  const ruled = (delay: number, dur = 0.9): React.CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: on ? 0 : 1,
    transition: reduced ? "none" : `stroke-dashoffset ${dur * PACE}s ${ease} ${delay * PACE}s`,
  });
  const fade = (delay: number, dur = 0.6): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: reduced ? "none" : `opacity ${dur * PACE}s ease ${delay * PACE}s`,
  });
  const line = { fill: "none", stroke: GREEN, pathLength: 1 } as const;
  // One screen pixel, in the sheet's units. The lines are drawn in by their
  // dash, which only measures right in the sheet's own units, so they can't
  // be non-scaling hairlines; this keeps them a pixel wide at any size.
  const [px, setPx] = useState(VW / 1080);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.clientWidth && setPx(VW / el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const hair = { strokeWidth: px };

  return (
    <figure className="f-wide" style={{ marginTop: "clamp(4px, 1.5vw, 20px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div
        ref={host}
        style={{
          position: "relative",
          containerType: "inline-size",
          aspectRatio: "16 / 9",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          role="img"
          aria-label="The Fortuna wordmark as a construction sheet: the letters in outline over a hatch, inside a frame and a band one f tall, with guides on the f's stem and the full stop. The mark is 5.16 times its height wide, the x-height is 0.69 of it, and the stems, counters and full stop are measured against one stem width, Z."
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <pattern id="wm-hatch" patternUnits="userSpaceOnUse" width="1.4" height="1.4" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="1.4" stroke={GREEN} strokeWidth="0.3" strokeOpacity="0.65" />
            </pattern>
            <pattern id="wm-hatch-dot" patternUnits="userSpaceOnUse" width="1.4" height="1.4" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="1.4" stroke={ORANGE} strokeWidth="0.3" strokeOpacity="0.6" />
            </pattern>
          </defs>
          <g transform={`translate(${OX} ${OY})`}>
            {/* The frame, the band, and the lines across them. */}
            <g>
              <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={BOX_R} {...line} strokeOpacity={0.55} style={{ ...hair, ...ruled(0, 1.1) }} />
              <rect x={BAND.x} y={BAND.y} width={BAND.w} height={BAND.h} rx={3} {...line} strokeOpacity={0.55} style={{ ...hair, ...ruled(0.25, 1.1) }} />
              {GUIDES.map((x, i) => (
                <path key={x} d={`M${x} ${BOX.y + inset(x)} V${BOX.y + BOX.h - inset(x)}`} {...line} strokeOpacity={0.45} style={{ ...hair, ...ruled(0.7 + i * 0.08, 0.7) }} />
              ))}
              <path d={`M${BAND.x} ${X_TOP} H${BAND.x + BAND.w}`} {...line} strokeOpacity={0.45} style={{ ...hair, ...ruled(0.85, 0.9) }} />
            </g>
            {/* The wordmark: each letter traced, then hatched. */}
            <g>
              {GLYPHS.map((g, i) => {
                const at = 1.1 + i * 0.12;
                return (
                  <g key={g.key}>
                    <path d={g.d} fill="url(#wm-hatch)" stroke="none" style={fade(at + 0.55, 0.5)} />
                    <path d={g.d} {...line} style={{ ...hair, ...ruled(at, 0.8) }} />
                  </g>
                );
              })}
              <path d={DOT} fill="url(#wm-hatch-dot)" style={fade(2.35, 0.5)} />
              <path d={DOT} {...line} stroke={ORANGE} style={{ ...hair, ...ruled(1.95, 0.6) }} />
            </g>
            {/* The measurements. */}
            <g>
              {BARS.map(([a, b], i) => (
                <rect
                  key={a}
                  x={a}
                  y={BAR_TOP}
                  width={b - a}
                  height={BAR_BOTTOM - BAR_TOP}
                  fill={GREEN}
                  fillOpacity={0.26}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "50% 0%",
                    transform: on ? "scaleY(1)" : "scaleY(0)",
                    transition: reduced ? "none" : `transform ${0.7 * PACE}s ${ease} ${(2.45 + i * 0.1) * PACE}s`,
                  }}
                />
              ))}
              {BRACKETS.map((d, i) => (
                <path key={i} d={d} {...line} strokeOpacity={0.8} strokeLinejoin="round" strokeLinecap="round" style={{ ...hair, ...ruled(2.65 + i * 0.1, 0.7) }} />
              ))}
            </g>
          </g>
        </svg>
        <div aria-hidden style={{ position: "absolute", inset: 0 }}>
          {LABELS.map((l) => (
            <span
              key={l.text.join() + l.x}
              style={{
                position: "absolute",
                left: `${((OX + l.x) / VW) * 100}%`,
                top: `${((OY + l.y) / VH) * 100}%`,
                transform: `translate(${l.align === "start" ? "0" : l.align === "end" ? "-100%" : "-50%"}, ${l.hang ? "0" : "-50%"})`,
                textAlign: l.align === "start" ? "left" : l.align === "end" ? "right" : "center",
                whiteSpace: "nowrap",
                fontFamily: "var(--f-grotesk)",
                fontSize: "clamp(7px, 1.1cqw, 12px)",
                fontWeight: 500,
                lineHeight: 1.3,
                color: GREEN,
                ...fade(l.at, 0.5),
              }}
            >
              {l.text.map((t) => (
                <span key={t} style={{ display: "block" }}>
                  {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
