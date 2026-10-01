"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CREAM, FOREST, GREEN, ORANGE } from "./cards";
import { SPLASH_DOTS } from "./dots";
import { easeInOut, lerp, seg } from "./motion";
import { DOT, DOT_BESIDE_F, GLYPHS, ICON_SCALE } from "./wordmark";

/**
 * The reveal again, built the way the Kindred reel is.
 *
 * One card in the middle of the stage and nothing else. It holds each of
 * the five frames for a beat, drifting very slightly larger or smaller as
 * it does, then changes shape for the next: tall for the splash, a poster,
 * a small square for the icon, wide for the flow promo, wide and large for
 * the website. The shape changes in one smooth movement; what is on the
 * card and the colour behind it change in a hard cut at the middle of that
 * movement, so the motion carries the eye across the cut. No springs, no
 * overshoot: everything eases in and out.
 *
 * Inside the card, almost nothing moves — the splash's rings turn and its
 * dots drift, and the website types its word — because in the reference it
 * is the card that does the moving.
 */

/** Each frame's beat, and one time round. */
const BEAT = 1.2;
const LOOP = BEAT * 5;
/** How long before and after a cut the card spends changing shape. */
const BEFORE = 0.14;
const AFTER = 0.26;

/**
 * The five frames. `aspect` is width over height; the card is as large as
 * `h` of the stage's height allows, unless `w` of its width binds first.
 * `r` is the corner as a share of the card's width. `drift` is which way it
 * creeps during its beat.
 */
const SCENES = [
  { key: "splash", bg: GREEN, aspect: 375 / 801, h: 0.8, w: 0.8, r: 0.11, drift: 1 },
  { key: "promo", bg: FOREST, aspect: 1061 / 1263, h: 0.74, w: 0.86, r: 0.035, drift: -1 },
  { key: "icon", bg: CREAM, aspect: 1, h: 0.27, w: 0.42, r: 0.225, drift: 1 },
  { key: "flow", bg: ORANGE, aspect: 1632 / 834, h: 0.56, w: 0.84, r: 0.028, drift: -1 },
  { key: "web", bg: "#6f8b81", aspect: 1583 / 1100, h: 0.68, w: 0.88, r: 0.02, drift: 1 },
] as const;

/** What each card holds, at its own size in its own units. */
const CONTENT = [
  { w: 375, h: 801, top: false },
  { w: 1061, h: 1263, top: false },
  { w: 401, h: 401, top: false },
  { w: 1632, h: 834, top: false },
  // The website is pinned to its top, so its header is never what is cut.
  { w: 1583, h: 1100, top: true },
];

const RINGS = [
  { r: 250.754, o: 1, speed: 26 },
  { r: 331.316, o: 0.8, speed: 21 },
  { r: 411.877, o: 0.6, speed: 17 },
  { r: 492.439, o: 0.5, speed: 14 },
  { r: 573, o: 0.3, speed: 11 },
];

/** The word the website types, and where its headline's third line sits. */
const WORD = "Hospitality";
const WEB_LINE = { x: 787.6, top: 310, size: 69.3, lead: 84.7 };

function rand(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}
const DRIFT = SPLASH_DOTS.map((_, i) => ({
  a: 4 + rand(i, 41) * 6,
  speed: (rand(i, 42) < 0.5 ? -1 : 1) * (0.5 + rand(i, 43) * 0.6),
  ph: rand(i, 44) * 2 * Math.PI,
  squash: 0.5 + rand(i, 45) * 0.8,
}));

type Rect = { w: number; h: number; r: number };
type El = HTMLElement | SVGElement;

export default function KindredReel({ label }: { label?: string }) {
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 1200, H: 800 });
  const els = useRef<Record<string, El>>({});
  const last = useRef<Record<string, string>>({});
  const clock = useRef(0);
  const onScreen = useInView(stage, { amount: 0.3 });

  const reg = useCallback(
    (key: string) => (el: El | null) => {
      if (el) els.current[key] = el;
      else delete els.current[key];
    },
    [],
  );

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setSize({ W: el.clientWidth, H: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(
    (t: number) => {
      const { W, H } = size;
      const e = els.current;
      const cache = last.current;
      const css = (key: string, prop: string, value: string) => {
        const el = e[key];
        if (!el) return;
        const k = key + "|" + prop;
        if (cache[k] === value) return;
        cache[k] = value;
        (el.style as unknown as Record<string, string>)[prop] = value;
      };
      const attr = (key: string, name: string, value: string) => {
        const el = e[key];
        if (!el) return;
        const k = key + "@" + name;
        if (cache[k] === value) return;
        cache[k] = value;
        el.setAttribute(name, value);
      };

      // The card's shape for a frame at a moment in (or just outside) its
      // beat: its own size, crept a few percent one way across the beat.
      const shape = (i: number, local: number): Rect => {
        const s = SCENES[i];
        const h = Math.min(s.h * H, (s.w * W) / s.aspect);
        const k = 1 + s.drift * 0.07 * (local / BEAT - 0.5);
        return { w: h * s.aspect * k, h: h * k, r: s.r * h * s.aspect * k };
      };
      const blend = (a: Rect, b: Rect, u: number): Rect => ({
        w: lerp(a.w, b.w, u),
        h: lerp(a.h, b.h, u),
        r: lerp(a.r, b.r, u),
      });

      const i = Math.floor(t / BEAT) % SCENES.length;
      const local = t - i * BEAT;
      let rect = shape(i, local);
      if (local < AFTER) {
        const prev = (i + SCENES.length - 1) % SCENES.length;
        rect = blend(shape(prev, local + BEAT), rect, easeInOut((local + BEFORE) / (BEFORE + AFTER)));
      } else if (local > BEAT - BEFORE) {
        const next = (i + 1) % SCENES.length;
        rect = blend(rect, shape(next, local - BEAT), easeInOut((local - (BEAT - BEFORE)) / (BEFORE + AFTER)));
      }

      css("stage", "background", SCENES[i].bg);
      css("card", "transform", `translate(${((W - rect.w) / 2).toFixed(1)}px, ${((H - rect.h) / 2).toFixed(1)}px)`);
      css("card", "width", `${rect.w.toFixed(1)}px`);
      css("card", "height", `${rect.h.toFixed(1)}px`);
      css("card", "borderRadius", `${rect.r.toFixed(1)}px`);

      // What is on the card: the current frame only, covering it.
      CONTENT.forEach((c, j) => {
        const on = j === i;
        css(`c-${j}`, "display", on ? "block" : "none");
        if (!on) return;
        const s = Math.max(rect.w / c.w, rect.h / c.h);
        const x = (rect.w - c.w * s) / 2;
        const y = c.top ? 0 : (rect.h - c.h * s) / 2;
        css(`c-${j}`, "transform", `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(5)})`);
      });

      // The splash's rings and dots.
      if (i === 0) {
        RINGS.forEach((ring, j) => attr(`ring-${j}`, "transform", `rotate(${(t * ring.speed).toFixed(2)} 187 364)`));
        DRIFT.forEach((d, j) => {
          const a = d.ph + t * d.speed * 2 * Math.PI * 0.5;
          attr(`dot-${j}`, "transform", `translate(${(d.a * Math.cos(a)).toFixed(2)} ${(d.a * d.squash * Math.sin(a)).toFixed(2)})`);
        });
      }

      // The website types the kind of work, and underlines it.
      if (i === 4) {
        const n = Math.floor(seg(local, 0.25, 0.75) * WORD.length + 1e-6);
        const el = e["word"];
        if (el && cache["word#"] !== String(n)) {
          cache["word#"] = String(n);
          el.textContent = WORD.slice(0, n);
        }
        css("under", "opacity", seg(local, 0.8, 0.95).toFixed(3));
        const typing = local > 0.2 && local < 0.75;
        css("caret", "opacity", typing || Math.floor(local * 2.6) % 2 === 0 ? "1" : "0.15");
      }
    },
    [size],
  );

  useEffect(() => {
    if (reduced) {
      draw(BEAT * 1.5);
      return;
    }
    draw(clock.current);
    if (!onScreen) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      clock.current = (clock.current + dt) % LOOP;
      draw(clock.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduced, draw]);

  const layer = { position: "absolute", left: 0, top: 0, transformOrigin: "0 0", display: "none" } as const;
  const fDot = DOT_BESIDE_F;

  return (
    <div
      ref={stage}
      aria-label="Fortuna's splash screen, swipe promo, app icon, flow promo and website, one after another"
      role="img"
      style={{
        position: "relative",
        height: "min(100svh, 150vw)",
        maxHeight: 980,
        minHeight: 520,
        overflow: "hidden",
        background: GREEN,
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginTop: "clamp(40px, 7vh, 80px)",
      }}
    >
      <div ref={reg("stage")} style={{ position: "absolute", inset: 0 }} />

      <div
        ref={reg("card")}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          overflow: "hidden",
          background: CREAM,
          boxShadow: "0 30px 70px rgba(20, 30, 27, 0.2)",
        }}
      >
        {/* The splash, live. */}
        <div ref={reg("c-0")} style={{ ...layer, width: 375, height: 801, background: CREAM }}>
          <svg width="375" height="801" viewBox="0 0 375 801" fill="none" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
            {RINGS.map((ring, j) => (
              <circle key={j} ref={reg(`ring-${j}`)} cx="187" cy="364" r={ring.r} opacity={ring.o} stroke="#32443E" strokeOpacity="0.12" strokeWidth="2" strokeDasharray="8 8" />
            ))}
            {SPLASH_DOTS.map(([x, y, r, fill, o], j) => (
              <circle key={j} ref={reg(`dot-${j}`)} cx={x} cy={y} r={r} fill={fill} fillOpacity={o} />
            ))}
            <g transform="translate(104 364)" fill={GREEN}>
              {GLYPHS.map((g) => (
                <path key={g.key} d={g.d} />
              ))}
              <path d={DOT} fill={ORANGE} />
            </g>
          </svg>
        </div>

        <div ref={reg("c-1")} style={{ ...layer, width: 1061, height: 1263 }}>
          <Image src="/fortuna/kindred/promo.webp" alt="" width={1061} height={1263} unoptimized draggable={false} />
        </div>

        {/* The icon, live: the wordmark's own f and full stop. */}
        <div ref={reg("c-2")} style={{ ...layer, width: 401, height: 401, background: GREEN }}>
          <svg width="401" height="401" viewBox="0 0 401 401" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
            <g transform={`translate(70.49 37.59) scale(${ICON_SCALE})`}>
              <path d={GLYPHS[0].d} fill="#fff" />
              <path d={DOT} fill={ORANGE} transform={`translate(${fDot} 0)`} />
            </g>
          </svg>
        </div>

        <div ref={reg("c-3")} style={{ ...layer, width: 1632, height: 834 }}>
          <Image src="/fortuna/kindred/flow.webp" alt="" width={1632} height={834} unoptimized draggable={false} />
        </div>

        <div ref={reg("c-4")} style={{ ...layer, width: 1583, height: 1100 }}>
          <Image src="/fortuna/kindred/web.webp" alt="" width={1583} height={1100} unoptimized draggable={false} />
          <div
            style={{
              position: "absolute",
              left: WEB_LINE.x - 500,
              top: WEB_LINE.top,
              width: 1000,
              textAlign: "center",
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: WEB_LINE.size,
              lineHeight: `${WEB_LINE.lead}px`,
              letterSpacing: "-0.02em",
              color: ORANGE,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ position: "relative", display: "inline-block", verticalAlign: "top", height: WEB_LINE.lead }}>
              <span ref={reg("word")} />
              <span ref={reg("under")} style={{ position: "absolute", left: 0, right: 0, top: 80, height: 6, borderRadius: 3, background: GREEN, opacity: 0 }} />
            </span>
            <span ref={reg("caret")} style={{ display: "inline-block", width: 5, height: 60, marginLeft: 4, background: ORANGE, verticalAlign: "-8px" }} />
          </div>
        </div>
      </div>

      {label && <ReelLabel text={label} />}
    </div>
  );
}

/** Which version a reel is, while the two are side by side for choosing. */
export function ReelLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        top: 18,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(20, 30, 27, 0.32)",
        color: "#fff",
        fontFamily: "var(--f-grotesk)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

