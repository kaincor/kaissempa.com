"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The closed cover on screen once the 3D book has loaded, square on: its size
 * and its centre, in CSS px from the top left of the screen as the page
 * opens (scrolled to the top).
 */
export type CoverRect = { w: number; h: number; cx: number; cy: number };

/** The size unit: about a large card's width. */
export const unitFor = (w: number, h: number) => Math.min(w * 0.3, h * 0.25);
/** The MINT wordmark's width, typed at the end and left standing in the hero. */
export const markWidthFor = (w: number, h: number) => unitFor(w, h) * 1.5;

/**
 * The opening of the Mint case study, a short montage of Kai's behind the
 * scenes shots that ends on the magazine itself:
 *
 *   1. a quiet grey screen;
 *   2. one small frame in the middle, held by selection handles, cutting
 *      quickly through faces from the shoots;
 *   3. the frame bursts into a collage of the shoots filling the screen,
 *      drifting in slowly;
 *   4. it all collapses back to the middle, onto the MINT wordmark;
 *   5. the wordmark's frame opens out into the cover, exactly where the 3D
 *      cover sits, and hands over to it.
 *
 * Everything is driven from one clock in a requestAnimationFrame loop that
 * writes transforms straight onto the elements, so React only renders once.
 * The clock holds before step 5 until the 3D book is ready to take over.
 */

const BTS = "/mint/bts/";
const WORDMARK = "/case-studies/mint/aiden-3-wordmark.svg";
const WORDMARK_AR = 880 / 271;
/**
 * The wordmark's letters, each its own file on the full wordmark's canvas so
 * they stack back into place, typed out one after another like the end of a
 * title card: M, then I, then N, then T. `to` is where each one ends, across
 * the 880-wide canvas. The N and T are drawn joined, as one shape, so they
 * are typed as two halves of it, split where the T's crossbar meets the N
 * (`clip`, the part of the shape each shows); they stay joined once both are in.
 */
const NT_SPLIT = 647;
const LETTERS: { src: string; to: number; clip?: string }[] = [
  { src: "/mint/wordmark/m.svg", to: 302.4 },
  { src: "/mint/wordmark/i.svg", to: 385.3 },
  // A hair of overlap between the halves, so no seam shows where they meet.
  {
    src: "/mint/wordmark/nt.svg",
    to: NT_SPLIT,
    clip: `inset(0 ${(((880 - NT_SPLIT) / 880) * 100 - 0.2).toFixed(2)}% 0 0)`,
  },
  {
    src: "/mint/wordmark/nt.svg",
    to: 880,
    clip: `inset(0 0 0 ${((NT_SPLIT / 880) * 100).toFixed(2)}%)`,
  },
];
const MINT_RED = "#b7272b";
const COVER = "/mint/pages/cover.jpg";

/** The cuts in step 2: faces, cropped towards the top where they are. */
const CUTS = [
  "9618",
  "9865",
  "9702",
  "9830",
  "9676",
  "9863",
  "9713",
  "9821",
  "9598",
  "9851",
];

/**
 * The collage. x, y are where each card's centre lands, from -1 to 1 across
 * the screen; w is its width in units of U (see layout); d is its depth,
 * which sets stacking order and how fast it drifts.
 */
const COLLAGE: {
  src: string;
  ar: number;
  x: number;
  y: number;
  w: number;
  d: number;
}[] = [
  { src: "9863", ar: 2 / 3, x: -0.58, y: -0.98, w: 0.5, d: 0.3 },
  { src: "9598", ar: 2 / 3, x: -0.82, y: -0.56, w: 0.62, d: 0.6 },
  { src: "9636", ar: 3 / 2, x: -0.33, y: -0.66, w: 1.1, d: 0.9 },
  { src: "9702", ar: 2 / 3, x: 0.16, y: -0.74, w: 0.58, d: 0.5 },
  { src: "9851", ar: 3 / 2, x: 0.7, y: -0.62, w: 1.15, d: 0.8 },
  { src: "9618", ar: 2 / 3, x: -0.9, y: 0.06, w: 0.6, d: 0.7 },
  { src: "9869", ar: 3 / 2, x: -0.12, y: -0.3, w: 0.62, d: 0.4 },
  { src: "9701", ar: 3 / 2, x: -0.47, y: -0.02, w: 0.95, d: 1.0 },
  { src: "9830", ar: 3 / 4, x: 0.4, y: -0.24, w: 0.45, d: 0.45 },
  { src: "9676", ar: 2 / 3, x: 0.1, y: 0.32, w: 0.5, d: 0.35 },
  { src: "9865", ar: 2 / 3, x: 0.53, y: 0.12, w: 0.64, d: 0.95 },
  { src: "9726", ar: 3 / 2, x: 0.93, y: 0.16, w: 0.9, d: 0.6 },
  { src: "9782", ar: 3 / 2, x: -0.7, y: 0.66, w: 1.0, d: 0.8 },
  { src: "9713", ar: 2 / 3, x: -0.2, y: 0.62, w: 0.58, d: 0.6 },
  { src: "9790", ar: 3 / 2, x: 0.3, y: 0.7, w: 0.98, d: 0.9 },
  { src: "9821", ar: 2 / 3, x: 0.85, y: 0.72, w: 0.56, d: 0.5 },
];

/** Small labels pinned among the photos. Placeholder words for Kai to change. */
const CHIPS = [
  { text: "Casting", x: -0.6, y: -0.36 },
  { text: "Styling", x: 0.62, y: -0.4 },
  { text: "Shooting", x: -0.86, y: 0.4 },
  { text: "Editing", x: 0.42, y: 0.42 },
];

/** Timeline, in ms. */
const T = {
  cutsIn: 450,
  burst: 2050,
  collapse: 3800,
  /** Once the collapse has finished, so the two wordmarks never overlap. */
  markIn: 4450,
  /** When each letter after the M is typed. */
  typeI: 4800,
  typeN: 5050,
  typeT: 5260,
  cursorOff: 5560,
  /** Waits here until the 3D cover's size is known. */
  open: 5750,
  /** The cover has opened out over the wordmark; it drops to its place below. */
  drop: 6350,
  reveal: 7150,
  fadeOut: 7450,
  done: 7650,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const prog = (t: number, a: number, dur: number) => clamp01((t - a) / dur);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outExpo = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
const inCubic = (k: number) => k * k * k;
const inOutCubic = (k: number) =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const outBack = (k: number) => {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};

type Props = {
  /** The 3D cover's size on screen, or null while the book is loading. */
  cover: CoverRect | null;
  /** The cover is dropping away: bring the hero's wordmark back in. */
  onDrop: () => void;
  /** The cover card is in place over the 3D one: show the canvas. */
  onReveal: () => void;
  /** The montage is over and can be removed. */
  onDone: () => void;
};

export default function MintIntro({ cover, onDrop, onReveal, onDone }: Props) {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  const coverRef = useRef(cover);
  const cb = useRef({ onDrop, onReveal, onDone });
  useEffect(() => {
    coverRef.current = cover;
    cb.current = { onDrop, onReveal, onDone };
  });

  useEffect(() => {
    const set = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  const U = vp ? unitFor(vp.w, vp.h) : 0;

  const cuts = useRef<(HTMLImageElement | null)[]>([]);
  const cutFrame = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const endMark = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLDivElement | null)[]>([]);
  const cursor = useRef<HTMLSpanElement>(null);
  const endCover = useRef<HTMLImageElement>(null);
  const handles = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  /**
   * Where the montage is, kept apart from the animation loop below, which is
   * set up afresh whenever the window changes size. A resize only re-lays it
   * out; it carries on from where it was instead of starting over.
   */
  const clock = useRef({
    t: 0,
    started: false,
    dropped: false,
    revealed: false,
    finished: false,
  });

  // Hold on the grey until the photos are in, so no cut lands on a blank.
  // Loaded once, however often the layout changes.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const srcs = [...new Set([...CUTS, ...COLLAGE.map((c) => c.src)])].map(
      (s) => `${BTS}${s}.jpg`,
    );
    let cancelled = false;
    Promise.race([
      Promise.all(
        [...srcs, COVER, ...LETTERS.map((l) => l.src)].map(
          (s) =>
            new Promise<void>((res) => {
              const im = new Image();
              im.onload = im.onerror = () => res();
              im.src = s;
            }),
        ),
      ),
      new Promise<void>((res) => setTimeout(res, 4000)),
    ]).then(() => {
      if (cancelled) return;
      clock.current.started = true;
      // With reduced motion, the montage is left out: straight to the cover.
      if (reduced) clock.current.t = T.open;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Every card in the collage, photos first, then the wordmark card, the
  // counter and the labels, each with where it lands and its depth.
  const all = useMemo(
    () => [
      ...COLLAGE.map((c) => ({ x: c.x, y: c.y, d: c.d })),
      { x: 0, y: 0, d: 1.3 }, // wordmark card
      { x: 0.02, y: 0.88, d: 1.1 }, // frame counter
      ...CHIPS.map((c) => ({ x: c.x, y: c.y, d: 1.2 })),
    ],
    [],
  );
  // Nearest the middle fly out first and are taken back last.
  const order = useMemo(() => {
    const byDist = all
      .map((c, i) => ({ i, r: Math.hypot(c.x, c.y) }))
      .sort((a, b) => a.r - b.r);
    const o = new Array(all.length);
    byDist.forEach((e, k) => (o[e.i] = k));
    return o as number[];
  }, [all]);

  useEffect(() => {
    if (!vp) return;
    let raf = 0;
    let last = 0;
    const c = clock.current;
    let { t } = c;
    let { dropped, revealed, finished } = c;

    const W = vp.w;
    const H = vp.h;
    const markW = markWidthFor(W, H);
    const markH = markW / WORDMARK_AR;
    const cutW = U * 0.55;
    const cutH = cutW * 1.25;

    const setHandles = (w: number, h: number, a: number) => {
      const el = handles.current;
      if (!el) return;
      el.style.width = `${w + 22}px`;
      el.style.height = `${h + 22}px`;
      el.style.opacity = String(a);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      if (!c.started) return;
      t = Math.max(t, c.t);
      const holding = t >= T.open && !coverRef.current;
      if (!holding) t += dt;
      if (holding) t = T.open;

      // 2. The cuts.
      const pop = outBack(prog(t, T.cutsIn, 260));
      const grow = lerp(1, 1.12, prog(t, T.cutsIn, T.burst - T.cutsIn));
      const gone = prog(t, T.burst, 200);
      const cf = cutFrame.current;
      if (cf) {
        const s =
          t < T.cutsIn ? 0 : lerp(0.4, 1, pop) * grow * (1 + gone * 0.4);
        cf.style.transform = `translate(-50%, -50%) scale(${s})`;
        cf.style.opacity = String(t < T.cutsIn ? 0 : 1 - gone);
      }
      const span = (T.burst - T.cutsIn) / CUTS.length;
      const showing = Math.min(
        CUTS.length - 1,
        Math.floor((t - T.cutsIn) / span),
      );
      cuts.current.forEach((im, i) => {
        if (im) im.style.opacity = i === showing ? "1" : "0";
      });

      // 3 and 4. The collage, out and back.
      const dolly = prog(t, T.burst, T.collapse - T.burst);
      const zoom = 1 + 0.07 * dolly;
      all.forEach((c, i) => {
        const el = cards.current[i];
        if (!el) return;
        const out = outExpo(prog(t, T.burst + order[i] * 32, 750));
        const back = inCubic(
          prog(t, T.collapse + (all.length - 1 - order[i]) * 14, 420),
        );
        // Each card drifts outwards as the collage dollies in, straight away
        // from the middle towards its nearest edge or corner, further the
        // nearer it is. The wordmark card in the middle holds its place and
        // just grows.
        const r = Math.hypot(c.x, c.y);
        const ox = r ? c.x / r : 0;
        const oy = r ? c.y / r : 0;
        const push = c.d * U * 0.14 * dolly;
        const tx = (c.x * W * 0.48 * zoom + ox * push) * out * (1 - back);
        const ty = (c.y * H * 0.48 * zoom + oy * push) * out * (1 - back);
        const s = lerp(0.15, 1, out) * zoom * lerp(1, 0.12, back);
        el.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${s})`;
        el.style.opacity = String(
          clamp01(out * 5) * (1 - clamp01((back - 0.6) / 0.4)),
        );
      });
      if (counter.current) {
        const k = prog(t, T.burst, T.collapse - T.burst);
        counter.current.textContent = String(Math.round(lerp(9598, 9869, k)));
      }

      // 4 and 5. The wordmark, then the cover opening out from it.
      const e = end.current;
      if (e) {
        const appear = prog(t, T.markIn, 300);
        const open = inOutCubic(prog(t, T.open, T.drop - T.open));
        // Then down from the middle to where the 3D cover waits, below the
        // wordmark, mostly under the bottom of the screen.
        const fall = inOutCubic(prog(t, T.drop, T.reveal - T.drop));
        const cv = coverRef.current;
        // How much of the wordmark is typed, as a share of its width. Each
        // letter lands at once; the frame slides out to take it in, staying
        // centred, as text does when it is typed centred.
        const typed =
          t >= T.typeT ? 3 : t >= T.typeN ? 2 : t >= T.typeI ? 1 : 0;
        const since = t - [T.markIn, T.typeI, T.typeN, T.typeT][typed];
        const from = typed === 0 ? LETTERS[0].to : LETTERS[typed - 1].to;
        const ext =
          lerp(from, LETTERS[typed].to, outExpo(clamp01(since / 160))) / 880;
        const typedW = markW * ext;
        const w = cv ? lerp(typedW, cv.w, open) : typedW;
        const h = cv ? lerp(markH, cv.h, open) : markH;
        e.style.width = `${w}px`;
        e.style.height = `${h}px`;
        const dx = cv ? (cv.cx - W / 2) * fall : 0;
        const dy = cv ? (cv.cy - H / 2) * fall : 0;
        e.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${lerp(0.6, 1, outBack(appear))})`;
        e.style.opacity = String(
          clamp01(appear * 3) * (1 - prog(t, T.fadeOut, T.done - T.fadeOut)),
        );
        const em = endMark.current;
        if (em) {
          em.style.opacity = String(1 - prog(t, T.open, 250));
          em.style.left = `${(w - typedW) / 2}px`;
          em.style.top = `${(h - markH) / 2}px`;
        }
        letters.current.forEach((l, i) => {
          if (l) l.style.opacity = i <= typed ? "1" : "0";
        });
        const cu = cursor.current;
        if (cu) {
          cu.style.left = `${typedW + markH * 0.08}px`;
          cu.style.opacity = t < T.cursorOff ? "1" : "0";
        }
        if (endCover.current)
          endCover.current.style.opacity = String(prog(t, T.open + 50, 300));
        if (t >= T.markIn)
          setHandles(
            w,
            h,
            (1 - prog(t, T.drop - 150, 200)) * clamp01(appear * 3),
          );
      }
      if (t >= T.cutsIn && t < T.burst) {
        setHandles(cutW * pop * grow, cutH * pop * grow, 1);
      } else if (t >= T.burst && t < T.markIn) {
        setHandles(0, 0, 0);
      }

      if (!dropped && t >= T.drop) {
        dropped = true;
        cb.current.onDrop();
      }
      if (!revealed && t >= T.reveal) {
        revealed = true;
        cb.current.onReveal();
      }
      if (!finished && t >= T.done) {
        finished = true;
        if (root.current) root.current.style.pointerEvents = "none";
        cb.current.onDone();
      }
      Object.assign(c, { t, dropped, revealed, finished });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [vp, U, all, order]);

  if (!vp) return null;
  const centred: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(0)",
    opacity: 0,
    willChange: "transform, opacity",
  };
  const shot: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    maxWidth: "none",
    objectFit: "cover",
  };
  const mark = (color: string, src = WORDMARK): React.CSSProperties => ({
    background: color,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  });

  // Each card's z, in the same order as `all`.
  const zs = [
    ...COLLAGE.map((c) => Math.round(c.d * 10)),
    13,
    11,
    ...CHIPS.map(() => 12),
  ];
  const collage = [
    ...COLLAGE.map((c) => (
      <div
        key={c.src}
        style={{
          width: c.w * U,
          height: (c.w * U) / c.ar,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BTS}${c.src}.jpg`} alt="" style={shot} />
      </div>
    )),
    // The wordmark card at the heart of it, like a sticker on the pile.
    <div
      key="mark"
      style={{
        width: U * 0.82,
        height: U * 0.82,
        background: MINT_RED,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "78%",
          height: `${78 / WORDMARK_AR}%`,
          ...mark("#f6efe2"),
        }}
      />
    </div>,
    <div
      key="counter"
      style={{
        padding: `${U * 0.05}px ${U * 0.08}px`,
        background: "rgba(246, 239, 226, 0.92)",
        color: MINT_RED,
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        lineHeight: 1,
      }}
    >
      <div
        style={{ fontSize: U * 0.07, letterSpacing: "0.04em", opacity: 0.8 }}
      >
        FRAME
      </div>
      <span
        ref={counter}
        style={{
          fontSize: U * 0.24,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        9598
      </span>
    </div>,
    ...CHIPS.map((c) => (
      <div
        key={c.text}
        style={{
          whiteSpace: "nowrap",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontSize: Math.max(11, U * 0.06),
          color: "#2a2623",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{ width: 5, height: 5, borderRadius: 1, background: MINT_RED }}
        />
        {c.text}
      </div>
    )),
  ];

  return (
    <div
      ref={root}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 2 }}
    >
      {collage.map((node, i) => (
        <div
          key={i}
          ref={(el) => {
            cards.current[i] = el;
          }}
          style={{ ...centred, zIndex: zs[i] }}
        >
          {node}
        </div>
      ))}

      <div
        ref={cutFrame}
        style={{
          ...centred,
          width: U * 0.55,
          height: U * 0.55 * 1.25,
          zIndex: 20,
          overflow: "hidden",
        }}
      >
        {CUTS.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s}
            ref={(el) => {
              cuts.current[i] = el;
            }}
            src={`${BTS}${s}.jpg`}
            alt=""
            style={{ ...shot, objectPosition: "50% 25%", opacity: 0 }}
          />
        ))}
      </div>

      <div ref={end} style={{ ...centred, zIndex: 20 }}>
        <div
          ref={endMark}
          style={{
            position: "absolute",
            width: markWidthFor(vp.w, vp.h),
            height: markWidthFor(vp.w, vp.h) / WORDMARK_AR,
          }}
        >
          {LETTERS.map((l, i) => (
            <div
              key={i}
              ref={(el) => {
                letters.current[i] = el;
              }}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                clipPath: l.clip,
                ...mark(MINT_RED, l.src),
              }}
            />
          ))}
          {/* The typing cursor: a small block sat on the baseline. */}
          <span
            ref={cursor}
            style={{
              position: "absolute",
              bottom: 0,
              width: (markWidthFor(vp.w, vp.h) / WORDMARK_AR) * 0.2,
              height: (markWidthFor(vp.w, vp.h) / WORDMARK_AR) * 0.2,
              background: MINT_RED,
            }}
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={endCover}
          src={COVER}
          alt=""
          style={{ ...shot, opacity: 0 }}
        />
      </div>

      {/* Selection handles, like the frame is picked in a design tool. */}
      <div
        ref={handles}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0,
          zIndex: 21,
          pointerEvents: "none",
        }}
      >
        {[
          { left: 0, top: 0 },
          { right: 0, top: 0 },
          { left: 0, bottom: 0 },
          { right: 0, bottom: 0 },
        ].map((p, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              width: 5,
              height: 5,
              background: MINT_RED,
              ...p,
            }}
          />
        ))}
      </div>
    </div>
  );
}
