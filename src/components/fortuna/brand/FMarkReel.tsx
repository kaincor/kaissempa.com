"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { clamp01, easeInOut, easeOut, lerp, seg } from "../reel/motion";
import { GLYPHS } from "../reel/wordmark";

/**
 * The f, being drawn. Hairline outlines, close enough that you can't tell
 * what letter it is, while the shape is worked on: squeezed in at the stem,
 * tightened at the crossbar and the hook, and its corners rounded off. Then
 * the camera pulls out to the whole f against its guides, it fills in, and
 * its full stop arrives beside it.
 *
 *    0.0  The top: the hook, in straight lines and corners. It rounds off,
 *         quickly, and the camera starts to drift down towards the foot.
 *    1.8  The bottom: the stem and foot, drafted wide. They squeeze in, and
 *         the camera starts up towards the arm.
 *    3.6  The left arm of the crossbar, closer, drafted long. It tightens,
 *         and the camera starts to pull back.
 *    5.8  Cut wide: the whole f in outline, in the middle, on its guides. It
 *         fills in; the orange dot slides in from the right, and the f steps
 *         left to make room, so the pair ends up in the middle.
 *    9.0  It fades back to outline, and the loop cuts in close again.
 *
 * Every state is the brand's own f, pushed out of shape and eased back. One
 * clock, like the other reels, stopped while it's off screen.
 */

const PERIOD = 9.8;
const GREEN = "#69BD45";
const CREAM = "#F7F5F0";
const ORANGE = "#F58120";
const VW = 160;
const VH = 90;

type P = { x: number; y: number };
/** One cubic piece of the outline, from the last point to `p`. */
type Seg = { c1: P; c2: P; p: P; curve: boolean };
type Shape = { start: P; segs: Seg[] };

/** The f's outline as cubic pieces, so every state of it has the same parts. */
function parse(d: string): Shape {
  const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  let i = 0;
  let cmd = "";
  let cur: P = { x: 0, y: 0 };
  let start: P = { x: 0, y: 0 };
  const segs: Seg[] = [];
  const num = () => parseFloat(tokens[i++]);
  const line = (p: P) => {
    segs.push({ c1: cur, c2: p, p, curve: false });
    cur = p;
  };
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    if (cmd === "M") {
      cur = start = { x: num(), y: num() };
      cmd = "L";
    } else if (cmd === "L") line({ x: num(), y: num() });
    else if (cmd === "H") line({ x: num(), y: cur.y });
    else if (cmd === "V") line({ x: cur.x, y: num() });
    else if (cmd === "C") {
      const c1 = { x: num(), y: num() };
      const c2 = { x: num(), y: num() };
      const p = { x: num(), y: num() };
      segs.push({ c1, c2, p, curve: true });
      cur = p;
    } else if (cmd === "Z") {
      if (cur.x !== start.x || cur.y !== start.y) line(start);
      cmd = "";
    } else i++;
  }
  return { start, segs };
}

const F = parse(GLYPHS[0].d);
/** The stem's middle. */
const STEM = 8.3;
/**
 * The guides the f was drawn against, as points on the f, so they move
 * with it while it's adjusted: the stem's edges and the left arm's end
 * (verticals), and the top of the hook, the crossbar and the baseline.
 */
const GUIDES_X: P[] = [{ x: 3.11, y: 25 }, { x: 13.5, y: 25 }, { x: 0, y: 15 }];
const GUIDES_Y: P[] = [{ x: 17.8, y: 0 }, { x: 8, y: 13.33 }, { x: 8, y: 17.43 }, { x: 8, y: 39.94 }];
/** The middle of the f alone, and of the f with its dot. */
const F_MID = 12.43;
const PAIR_MID = 16.4;

/**
 * The draft, as distances from the finished f:
 * `wide` spreads the stem and flares the foot, `loose` lets the crossbar's
 * arms run long, and `sharp` takes the curves out of the hook and swings it
 * wide, leaving straight lines between the same points.
 */
type Draft = { wide: number; loose: number; sharp: number };

function warp(p: P, d: Draft): P {
  let { x, y } = p;
  // Wide: the lower body spreads about the stem.
  const body = clamp01((y - 9) / 6);
  x = STEM + (x - STEM) * (1 + 0.42 * d.wide * body);
  const hook = clamp01((12 - p.y) / 6) * clamp01((p.x - 9) / 12);
  // The hook swings out and up until its curves come in.
  x += 3.2 * d.sharp * hook;
  y -= 2.2 * d.sharp * hook;
  // Loose: the crossbar's arms run long.
  if (p.y > 12.5 && p.y < 18.5 && p.x < 3.4) x -= 3 * d.loose;
  if (p.y > 12.5 && p.y < 18.5 && p.x > 14) x += 3 * d.loose;
  // Wide: the foot serifs flare.
  if (p.y > 35) x += (p.x < STEM ? -1.6 : 1.6) * d.wide;
  return { x, y };
}

function draw(shape: Shape, d: Draft) {
  const at = (p: P) => warp(p, d);
  let prev = at(shape.start);
  let out = `M${prev.x.toFixed(3)} ${prev.y.toFixed(3)}`;
  const anchors: P[] = [prev];
  const handles: [P, P][] = [];
  for (const s of shape.segs) {
    const p = at(s.p);
    // Sharp: each handle pulled back into its own anchor.
    const c1 = s.curve ? lerpP(at(s.c1), prev, d.sharp) : prev;
    const c2 = s.curve ? lerpP(at(s.c2), p, d.sharp) : p;
    out += `C${c1.x.toFixed(3)} ${c1.y.toFixed(3)} ${c2.x.toFixed(3)} ${c2.y.toFixed(3)} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
    if (s.curve) handles.push([prev, c1], [p, c2]);
    anchors.push(p);
    prev = p;
  }
  return { d: out + "Z", anchors, handles };
}

const lerpP = (a: P, b: P, u: number): P => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });

type Cam = { s: number; x: number; y: number };
/** A camera centred on (cx, cy) in the f's units, at scale s. */
const look = (cx: number, cy: number, s: number): Cam => ({ s, x: VW / 2 - cx * s, y: VH / 2 - cy * s });
const camT = (c: Cam) => `translate(${c.x.toFixed(3)} ${c.y.toFixed(3)}) scale(${c.s.toFixed(4)})`;

/**
 * The four shots: where each looks, how far it pulls out while it holds,
 * and how hard it eases (higher settles sooner). The wide shot starts on
 * the f alone; it pans over for the dot later.
 */
const SHOTS = [
  { from: 0, to: 1.8, a: look(16.2, 5.4, 4.6), b: look(15.6, 5.9, 4.25), ease: 3, next: "down" },
  { from: 1.8, to: 3.6, a: look(9, 33.5, 4.1), b: look(9, 33, 3.9), ease: 5, next: "arm" },
  { from: 3.6, to: 5.8, a: look(1.6, 15.4, 6.6), b: look(2.2, 15.2, 6.0), ease: 3, next: "out" },
  { from: 5.8, to: PERIOD, a: look(F_MID, 20, 1.72), b: look(F_MID, 20, 1.5), ease: 1, next: "" },
];

/** Where each close-up's camera heads at the end of its shot, in the f's units. */
const HEADING: Record<string, P> = { down: { x: 9 - 16.2, y: 33.5 - 5.4 }, arm: { x: 1.6 - 9, y: 15.4 - 33.5 } };
/** How far it gets before the cut, in screen units: just enough to read. */
const SWEEP = 12;

/**
 * The draft at time t: each fix eases in during its own shot, then stays
 * fixed. It starts halfway to the finished f, so it reads as refining.
 */
const DRAFT = 0.5;
function draftAt(t: number): Draft {
  return {
    sharp: DRAFT * (1 - easeInOut(seg(t, 0.15, 1.05))),
    wide: DRAFT * (1 - easeInOut(seg(t, 1.95, 2.95))),
    loose: DRAFT * (1 - easeInOut(seg(t, 3.85, 5.25))),
  };
}

/**
 * The dot, beside the f as in the wordmark, but sitting right on the
 * baseline guide (39.94), as if the line were the floor it rests on.
 */
const DOT = { x: 27.43, y: 39.94 - 5.37, r: 5.37 };

export default function FMarkReel() {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const q = (k: string) => root.querySelector<SVGElement>(`[data-k="${k}"]`)!;
    const group = q("g");
    const outline = q("line");
    const fill = q("fill");
    const marks = q("marks");
    const arms = q("arms");
    const guides = q("guides");
    const dot = q("dot");

    let visible = false;
    const render = (t: number) => {
      const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[3];
      const wide = shot === SHOTS[3];
      // Each close-up pulls out quickly at the cut and eases off, but never
      // all the way to still: a little of the move keeps going to the end.
      // The wide shot drifts out evenly, as the reference does.
      const lin = seg(t, shot.from, shot.to);
      const u = wide ? lin : 0.82 * (1 - Math.pow(1 - lin, shot.ease)) + 0.18 * lin;
      // Then, late in the shot, the camera sets off for the next part of the
      // f, and we cut before it gets there: only the start of each move shows.
      // It starts early and builds gently, so it is still slow at the cut.
      const go = Math.pow(lin, 1.5);
      // Off the arm, a quick pull-out in the last moments, accelerating into
      // the cut to the whole f.
      const whip = shot.next === "out" ? Math.pow(seg(t, shot.to - 0.32, shot.to), 2) : 0;
      const out = shot.next === "out" ? Math.exp(-0.38 * go - 0.35 * whip) : 1;
      const c: Cam = { s: Math.exp(lerp(Math.log(shot.a.s), Math.log(shot.b.s), u)) * out, x: 0, y: 0 };
      const head = HEADING[shot.next];
      const len = head ? Math.hypot(head.x, head.y) : 1;
      const sx = head ? (head.x / len) * ((SWEEP * go) / c.s) : 0;
      const sy = head ? (head.y / len) * ((SWEEP * go) / c.s) : 0;
      // Wide, the f starts in the middle, then steps left to make room for its dot.
      const pan = wide ? (PAIR_MID - F_MID) * easeInOut(seg(t, 7.55, 8.4)) : 0;
      const cx = lerp((VW / 2 - shot.a.x) / shot.a.s, (VW / 2 - shot.b.x) / shot.b.s, u) + pan + sx;
      const cy = lerp((VH / 2 - shot.a.y) / shot.a.s, (VH / 2 - shot.b.y) / shot.b.s, u) + sy;
      c.x = VW / 2 - cx * c.s;
      c.y = VH / 2 - cy * c.s;
      group.setAttribute("transform", camT(c));

      const draft = wide ? { wide: 0, loose: 0, sharp: 0 } : draftAt(t);
      const f = draw(F, draft);
      outline.setAttribute("d", f.d);
      fill.setAttribute("d", f.d);

      // Close up, the points and handles being worked on.
      const r = 0.55 / c.s;
      marks.setAttribute(
        "d",
        wide ? "" : f.anchors.map((p) => `M${(p.x - r).toFixed(3)} ${(p.y - r).toFixed(3)}h${(2 * r).toFixed(3)}v${(2 * r).toFixed(3)}h${(-2 * r).toFixed(3)}Z`).join(""),
      );
      arms.setAttribute(
        "d",
        wide ? "" : f.handles.filter(([a, b]) => Math.hypot(a.x - b.x, a.y - b.y) > 0.05).map(([a, b]) => `M${a.x.toFixed(3)} ${a.y.toFixed(3)}L${b.x.toFixed(3)} ${b.y.toFixed(3)}`).join(""),
      );
      // The guides, throughout, moving with the f as it's adjusted.
      guides.setAttribute("opacity", (0.5 * (1 - seg(t, 9.0, 9.7))).toFixed(3));
      guides.setAttribute(
        "d",
        [
          ...GUIDES_X.map((p) => `M${(c.x + warp(p, draft).x * c.s).toFixed(2)} 0V${VH}`),
          ...GUIDES_Y.map((p) => `M0 ${(c.y + warp(p, draft).y * c.s).toFixed(2)}H${VW}`),
        ].join(""),
      );

      // Wide: the outline fills in, and the dot slides in from the right.
      // At the end it all goes back to a faint outline.
      const fade = seg(t, 9.0, 9.7);
      outline.setAttribute("stroke-opacity", (wide ? lerp(0.95, 0.4, fade) : 0.9).toFixed(3));
      fill.setAttribute("fill-opacity", (wide ? easeOut(seg(t, 6.5, 7.1)) * (1 - fade) : 0).toFixed(3));
      const offRight = (VW + DOT.r * c.s + 2 - c.x) / c.s;
      const slide = 1 - Math.pow(1 - seg(t, 7.2, 8.15), 3);
      dot.setAttribute("r", (wide && t >= 7.2 ? DOT.r : 0).toFixed(3));
      dot.setAttribute("cx", lerp(offRight, DOT.x, slide).toFixed(3));
      dot.setAttribute("cy", DOT.y.toFixed(3));
      dot.setAttribute("opacity", (1 - fade).toFixed(3));
    };

    // Held still: the finished f, filled, with its dot.
    if (reduced) {
      render(8.6);
      return;
    }
    render(0);

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
      render(time);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  const hair = { vectorEffect: "non-scaling-stroke" } as const;
  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div
        ref={host}
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          borderRadius: "clamp(16px, 2.2vw, 28px)",
          overflow: "hidden",
          background: CREAM,
          boxShadow: "0 1px 2px rgba(40,40,30,0.06), 0 18px 44px rgba(40,40,30,0.10)",
        }}
      >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="The f of the Fortuna logo, being drawn: close-ups of its outline as the stem is squeezed in, the crossbar and hook tightened and the corners rounded, then the whole f on its guides, filling in green, with its orange full stop beside it."
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        >
          <path data-k="guides" fill="none" stroke={GREEN} strokeWidth={1} strokeDasharray="2 3" style={hair} opacity={0} />
          <g data-k="g">
            <path data-k="fill" fill={GREEN} fillOpacity={0} />
            <path data-k="arms" fill="none" stroke={GREEN} strokeOpacity={0.45} strokeWidth={1} style={hair} />
            <path data-k="line" fill="none" stroke={GREEN} strokeWidth={1.25} strokeLinejoin="round" style={hair} />
            <path data-k="marks" fill={CREAM} stroke={GREEN} strokeWidth={1} style={hair} />
            <circle data-k="dot" cx={DOT.x} cy={DOT.y} r={0} fill={ORANGE} />
          </g>
        </svg>
      </div>
    </figure>
  );
}
