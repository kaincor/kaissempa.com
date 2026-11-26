"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
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
 * It draws itself in once, the frame first and the numbers last, when it
 * comes on screen.
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
].join(" ");

/** Labels, placed over the sheet in its own units. */
const LABELS: { x: number; y: number; text: string[]; align?: "start" | "end"; hang?: boolean }[] = [
  { x: MARK_W / 2, y: -52, text: ["5.16Y"] },
  { x: MARK_W + 46, y: Y / 2, text: ["Y"], align: "start" },
  { x: -46, y: (X_TOP + Y) / 2, text: ["0.69Y"], align: "end" },
  ...BARS.map(([a, b, text]) => ({ x: (a + b) / 2, y: BAR_TOP - 4.5, text: [text] })),
  { x: 8.3, y: BOX.y + BOX.h + 13, text: ["Stem", "Z = 0.26Y"], hang: true },
  { x: 200.65, y: BOX.y + BOX.h + 13, text: ["Full stop", "1.03Z"], hang: true },
];

export default function WordmarkSpec() {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const seen = useInView(host, { once: true, amount: 0.35 });
  const on = reduced || seen;

  // Each layer comes in after the one under it.
  const layer = (delay: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transition: reduced ? "none" : `opacity 0.7s ease ${delay}s`,
  });
  const line = { vectorEffect: "non-scaling-stroke" as const, fill: "none", stroke: GREEN };

  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
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
            <g style={layer(0)}>
              <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={BOX_R} {...line} strokeOpacity={0.55} />
              <rect x={BAND.x} y={BAND.y} width={BAND.w} height={BAND.h} rx={3} {...line} strokeOpacity={0.55} />
            </g>
            <g style={layer(0.2)}>
              <path d={GUIDES.map((x) => `M${x} ${BOX.y + inset(x)} V${BOX.y + BOX.h - inset(x)}`).join(" ")} {...line} strokeOpacity={0.45} />
              <path d={`M${BAND.x} ${X_TOP} H${BAND.x + BAND.w}`} {...line} strokeOpacity={0.45} />
            </g>
            {/* The wordmark itself. */}
            <g style={layer(0.4)}>
              {GLYPHS.map((g) => (
                <path key={g.key} d={g.d} fill="url(#wm-hatch)" stroke={GREEN} strokeWidth={1} style={{ vectorEffect: "non-scaling-stroke" }} />
              ))}
              <path d={DOT} fill="url(#wm-hatch-dot)" stroke={ORANGE} strokeWidth={1} style={{ vectorEffect: "non-scaling-stroke" }} />
            </g>
            {/* The measurements. */}
            <g style={layer(0.65)}>
              {BARS.map(([a, b]) => (
                <rect key={a} x={a} y={BAR_TOP} width={b - a} height={BAR_BOTTOM - BAR_TOP} fill={GREEN} fillOpacity={0.26} />
              ))}
            </g>
            <g style={layer(0.85)}>
              <path d={BRACKETS} {...line} strokeOpacity={0.8} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          </g>
        </svg>
        <div aria-hidden style={{ position: "absolute", inset: 0, ...layer(0.95) }}>
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
