"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CREAM, FOREST } from "../reel/cards";
import { PHONE_BODY } from "../reel/phone-shape";

/**
 * The phone from the Motion Vectors page's mockup — the forest body with its
 * side buttons, the notch and the speaker — with a screen inside it.
 *
 * Drawn at the mockup's own 415 x 838 and scaled as one piece to whatever
 * width it is given, so everything on the screen is placed in the app's own
 * units (the screen is 375 x 801).
 */
export const PHONE = { w: 415, h: 838 };
export const SCREEN = { x: 20, y: 18, w: 375, h: 801 };

/** How small the phone starts, growing to full size as it scrolls on screen. */
const GROW_FROM = 0.9;

/**
 * `grow` ties the phone's size to the scroll: 90% as its top comes on
 * screen, full size once 90% of it is showing, and back again on the way up.
 * It grows from its base, so whatever sits under it keeps its distance.
 */
export default function PhoneMockup({ width, grow = false, children }: { width: string; grow?: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "0.9 end"] });
  const size = useTransform(scrollYProgress, [0, 1], [GROW_FROM, 1]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setK(el.clientWidth / PHONE.w);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      ref={box}
      style={{
        position: "relative",
        width,
        aspectRatio: `${PHONE.w} / ${PHONE.h}`,
        scale: grow && !reduced ? size : 1,
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PHONE.w,
          height: PHONE.h,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          visibility: k ? "visible" : "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: "6px 4px", borderRadius: 60, boxShadow: "0 40px 80px rgba(20, 30, 27, 0.25)" }} />
        <svg width={PHONE.w} height={PHONE.h} viewBox="0 0 415 837.998" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <path d={PHONE_BODY} fill={FOREST} fillRule="evenodd" clipRule="evenodd" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: SCREEN.x,
            top: SCREEN.y,
            width: SCREEN.w,
            height: SCREEN.h,
            borderRadius: 44,
            overflow: "hidden",
            background: CREAM,
          }}
        >
          {children}
        </div>
        {/* The notch, over the screen. */}
        <div style={{ position: "absolute", left: 107, top: 18, width: 201, height: 30, borderRadius: "0 0 22px 22px", background: FOREST }}>
          <div style={{ position: "absolute", left: 77, top: 11, width: 46, height: 5, borderRadius: 3, background: "#26352f" }} />
        </div>
      </div>
    </motion.div>
  );
}

/** The grid: dot spacing and size, its colour, and its padding around what sits on it. */
const GRID = { pitch: 14, r: 1.25, color: "rgba(50, 68, 62, 0.28)" };
const PAD = "clamp(36px, 6vw, 64px)";
/** How far the dots drift against the page as it scrolls past, px each way. */
const PARALLAX = 180;
/** The grid's own fade, toward its edges. */
const FADE = "radial-gradient(ellipse 70% 62% at 50% 50%, #000 45%, transparent 100%)";
/**
 * The patch behind a caption under the phone: an ellipse around its one line,
 * centred half a line above the grid's bottom padding.
 */
const PATCH = `radial-gradient(ellipse 230px 30px at 50% calc(100% - ${PAD} - 11px), #000 50%, transparent 100%)`;
/** The entrance: how long the dots take to pop in, and when the phone follows. */
const POP = { dots: 0.55, each: 0.16, phoneAt: 0.3 };

/**
 * The dot grid the demos sit on: a designer's canvas, so the phone reads as
 * a mockup of how the app is used rather than a product shot. Faint, and
 * fading out toward its edges. On a phone it runs out to the screen's edges
 * rather than stopping at the text column's.
 *
 * As it comes into view the dots pop in one by one, quickly and in no
 * order, and then what sits on it — the phone — fades in, rising with a
 * bounce and growing into place. The dots drift against the page as it
 * scrolls, for a little depth behind the phone.
 *
 * `captioned` softens the dots behind a caption under the phone, so the line
 * reads clean: the sharp dots are cut away there and a blurred copy of the
 * same grid, in the same place, shows instead. The cut and the patch are
 * masks on the layers' frames, which stay put; only the dots inside them
 * move, so the softening stays behind the caption while the dots drift
 * through it. A blurred copy rather than a backdrop blur, which a phone would
 * recompute on every frame of a scroll.
 *
 * The dots are drawn once into a canvas — every frame of the pop, then never
 * again — and the drift is a transform on it, so scrolling past costs the
 * compositor and nothing else.
 */
export function DotField({ children, captioned = false }: { children: ReactNode; captioned?: boolean }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const sharp = useRef<HTMLCanvasElement>(null);
  const soft = useRef<HTMLCanvasElement>(null);
  const seen = useInView(box, { once: true, amount: 0.25 });
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "end start"] });
  // Down the page as the page goes up: the dots move slower than it, so they
  // read as further away.
  const drift = useTransform(scrollYProgress, [0, 1], [-PARALLAX, PARALLAX]);

  useEffect(() => {
    const c = sharp.current;
    const b = soft.current;
    if (!c || !seen) return;
    const ctx = c.getContext("2d")!;
    const ctx2 = b?.getContext("2d");
    const end = POP.dots + POP.each;
    let dots: [number, number, number][] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    // Sized to the canvas as laid out; a dot on the centre line both ways.
    const layout = (pop: boolean) => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      for (const el of [c, b]) {
        if (!el) continue;
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      dots = [];
      for (let y = (h / 2) % GRID.pitch; y < h; y += GRID.pitch)
        for (let x = (w / 2) % GRID.pitch; x < w; x += GRID.pitch) dots.push([x, y, pop ? Math.random() * POP.dots : 0]);
    };
    const paint = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = GRID.color;
      ctx.beginPath();
      for (const [x, y, at] of dots) {
        const u = (t - at) / POP.each;
        if (u <= 0) continue;
        // A pop: up past its size and back.
        const k = u >= 1 ? 1 : 1 + 0.6 * Math.sin(Math.PI * u) * (1 - u) - (1 - u) ** 3;
        const r = GRID.r * Math.max(0, k);
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
      if (ctx2) {
        ctx2.setTransform(1, 0, 0, 1, 0, 0);
        ctx2.clearRect(0, 0, c.width, c.height);
        ctx2.drawImage(c, 0, 0);
      }
    };

    let raf = 0;
    let popping = !reduced;
    layout(popping);
    if (popping) {
      const start = performance.now();
      const frame = (now: number) => {
        const t = (now - start) / 1000;
        paint(t);
        if (t < end) raf = requestAnimationFrame(frame);
        else popping = false;
      };
      raf = requestAnimationFrame(frame);
    } else paint(end);

    // A new size redraws the grid at it, settled, rather than stretching it.
    let lastW = w;
    let lastH = h;
    const ro = new ResizeObserver(() => {
      if (popping || (c.clientWidth === lastW && c.clientHeight === lastH)) return;
      layout(false);
      paint(end);
      lastW = w;
      lastH = h;
    });
    ro.observe(c);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [seen, reduced]);

  const layer = "absolute top-0 bottom-0 left-0 right-0 overflow-hidden max-sm:left-[calc(50%-50vw)] max-sm:right-[calc(50%-50vw)]";
  const canvas = { position: "absolute", left: 0, top: -PARALLAX, width: "100%", height: `calc(100% + ${PARALLAX * 2}px)`, y: reduced ? 0 : drift } as const;

  return (
    <div
      ref={box}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: `${PAD} 0`,
        margin: "8px 0",
      }}
    >
      <div
        aria-hidden="true"
        className={layer}
        style={{
          maskImage: captioned ? `${FADE}, ${PATCH}` : FADE,
          WebkitMaskImage: captioned ? `${FADE}, ${PATCH}` : FADE,
          maskComposite: captioned ? "subtract" : undefined,
          WebkitMaskComposite: captioned ? "source-out" : undefined,
        }}
      >
        <motion.canvas ref={sharp} style={canvas} />
      </div>
      {captioned && (
        <div aria-hidden="true" className={layer} style={{ opacity: 0.75, maskImage: PATCH, WebkitMaskImage: PATCH }}>
          <motion.canvas ref={soft} style={{ ...canvas, filter: "blur(1.6px)" }} />
        </div>
      )}
      <motion.div
        style={{ position: "relative" }}
        initial={reduced ? false : { opacity: 0, y: 44, scale: 0.88 }}
        animate={seen || reduced ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{
          type: "spring",
          stiffness: 140,
          damping: 13,
          mass: 1,
          delay: POP.phoneAt,
          opacity: { duration: 0.45, delay: POP.phoneAt },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
