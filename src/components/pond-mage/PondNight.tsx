"use client";

import { useEffect, useRef } from "react";
import { BIG_STARS, METEOR, SMALL_STARS, type Mark } from "./sky-marks";

/**
 * The dusk behind the Pond Mage page: fireflies and a few faint stars, with a
 * shooting star now and then. It sits fixed behind the text, so the page
 * scrolls over it like the far side of the pond; the purple fading lighter
 * down the page is the page's own background (page.tsx), not this.
 *
 * Fireflies, in the page's gold, each one of Kai's marks on a soft glow
 * (every mark is used, shuffled, before any repeats; the stars likewise): most dim, about a third of them all but
 * still, the rest wandering very slowly. Every 3.5s a couple, anywhere on
 * screen, swell up bright and fade back.
 *
 * Stars are Kai's own, drawn by hand in Figma (sky-marks.ts): a few
 * scribbled crosses and asterisks among many little looped dots, in his
 * orange (#C44311) with a soft, warmer glow, drawn far thinner than his strokes. They twinkle
 * slowly, belong to the dark top of the page, and thin out as the reader
 * scrolls down into the lighter purple. Every nine seconds or so, while
 * there are stars, Kai's meteor falls across the upper part of the screen:
 * its trail draws out behind the glowing head, then the whole thing fades.
 *
 * One canvas, never taking pointer events, nothing following the cursor. It
 * stops drawing while the tab is hidden, and with reduced motion it draws a
 * single still frame.
 */

const GOLD = [239, 212, 140] as const;
/** Kai's colour for the stars and meteor in Figma (#C44311), with a warmer glow. */
const STAR = [196, 67, 17] as const;
const STAR_GLOW = "rgba(236, 112, 52, 0.8)";

/** Fireflies and stars on a 1440 x 900 screen; scaled to the screen's area. */
const FIREFLIES = 50;
const STARS = 60;
/** The share of fireflies that barely move. */
const STILL_SHARE = 0.35;

/** A couple light up every this many ms. */
const FLASH_EVERY = 3500;
const FLASH_MS = 2400;

const SHOOT_FIRST = 4000;
const SHOOT_EVERY = 9000;
const SHOOT_MS = 1500;
/** How far the head travels, and the meteor's height on screen, in px. */
const SHOOT_REACH = 300;
const METEOR_H = 150;
const SHOOT_PEAK = 0.9;


type Fly = {
  x: number;
  y: number;
  /** Drift, px per second, and a slow wobble on top of it. */
  vx: number;
  vy: number;
  wobble: number;
  phase: number;
  speed: number;
  /** Resting strength and size, and how it breathes. */
  base: number;
  r: number;
  breathe: number;
  /** When it last flashed, or -1. */
  flash: number;
  /** One of Kai's marks, in gold, drawn at FLY_ROOM times its resting size. */
  img: HTMLCanvasElement;
  half: number;
};

/** Fireflies' marks are drawn this much bigger than they rest, so a flash can swell them crisply. */
const FLY_ROOM = 1.8;

type Star = { x: number; y: number; img: HTMLCanvasElement; half: number; a: number; phase: number; speed: number };

/**
 * One of Kai's marks, drawn once into its own little canvas: the stroke much
 * thinner than his, in the star colour, with a glow round it.
 */
function sprite(
  m: Mark,
  size: number,
  line: number,
  glow: number,
  dpr: number,
  rot = 0,
  colour = `rgb(${STAR})`,
  glowColour = STAR_GLOW,
) {
  const [w, h, , d] = m;
  const k = size / Math.max(w, h);
  const pad = glow * 1.6 + line;
  const side = Math.ceil((Math.hypot(w, h) * k + pad * 2) * dpr);
  const c = document.createElement("canvas");
  c.width = c.height = side;
  const g = c.getContext("2d")!;
  g.translate(side / 2, side / 2);
  g.rotate(rot);
  g.scale(dpr * k, dpr * k);
  g.translate(-w / 2, -h / 2);
  const path = new Path2D(d);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.lineWidth = line / k;
  g.strokeStyle = colour;
  g.shadowColor = glowColour;
  g.shadowBlur = glow * dpr;
  g.stroke(path);
  g.shadowBlur = 0;
  g.stroke(path);
  return c;
}

const ALL_MARKS = [...BIG_STARS, ...SMALL_STARS];
const isBig = (m: Mark) => BIG_STARS.includes(m);

/**
 * n of Kai's marks, every one of them used before any comes round again,
 * shuffled each time through, so the sky has as much variety as it can.
 */
function deal(n: number): Mark[] {
  const out: Mark[] = [];
  while (out.length < n) {
    const pack = [...ALL_MARKS];
    for (let i = pack.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pack[i], pack[j]] = [pack[j], pack[i]];
    }
    out.push(...pack);
  }
  return out.slice(0, n);
}

/** The meteor, drawn once at its screen size, plain and mirrored. */
function meteorSprite(dpr: number, mirror: boolean) {
  const k = METEOR_H / METEOR.h;
  const pad = 14;
  const W = METEOR.w * k + pad * 2;
  const H = METEOR.h * k + pad * 2;
  const c = document.createElement("canvas");
  c.width = Math.ceil(W * dpr);
  c.height = Math.ceil(H * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  if (mirror) {
    g.translate(W, 0);
    g.scale(-1, 1);
  }
  g.translate(pad, pad);
  g.scale(k, k);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = `rgb(${STAR})`;
  for (const glow of [7, 0]) {
    g.shadowColor = STAR_GLOW;
    g.shadowBlur = glow * dpr;
    for (const [x, y, sw, d] of METEOR.strokes) {
      g.save();
      g.translate(x, y);
      // Far thinner than in Figma: the trail a hair, the head a little bolder.
      g.lineWidth = Math.max(0.9, sw * 0.12) / k;
      g.stroke(new Path2D(d));
      g.restore();
    }
  }
  const hx = pad + (mirror ? METEOR.w - METEOR.head[0] : METEOR.head[0]) * k;
  const hy = pad + METEOR.head[1] * k;
  // The direction the meteor falls, tail to head.
  const tx = pad + (mirror ? 0 : METEOR.w) * k;
  const len = Math.hypot(hx - tx, hy - pad);
  return { img: c, W, H, hx, hy, dx: (hx - tx) / len, dy: (hy - pad) / len, len };
}

export default function PondNight() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let flies: Fly[] = [];
    let stars: Star[] = [];
    let raf = 0;
    let last = performance.now();
    let flashTimer = 0;
    let shootTimer = 0;
    let shoot: { t0: number; x: number; y: number; m: ReturnType<typeof meteorSprite> } | null = null;
    let meteors: ReturnType<typeof meteorSprite>[] = [];
    // A scratch canvas, where the meteor's trail is faded behind its head.
    const scratch = document.createElement("canvas");
    const sctx = scratch.getContext("2d")!;

    // One soft glow, drawn once and stamped for every firefly.
    const glow = document.createElement("canvas");
    const G = 64;
    glow.width = glow.height = G;
    const gctx = glow.getContext("2d")!;
    const rg = gctx.createRadialGradient(G / 2, G / 2, 0, G / 2, G / 2, G / 2);
    rg.addColorStop(0, `rgba(${GOLD}, 1)`);
    rg.addColorStop(0.12, `rgba(${GOLD}, 0.85)`);
    rg.addColorStop(0.35, `rgba(${GOLD}, 0.22)`);
    rg.addColorStop(1, `rgba(${GOLD}, 0)`);
    gctx.fillStyle = rg;
    gctx.fillRect(0, 0, G, G);

    /** How far down the page the reader is, 0 to 1. */
    const depth = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    /** Stars belong to the dark top of the page. */
    const starLight = () => Math.max(0, 1 - depth() * 1.6);

    const setup = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (w * h) / (1440 * 900);
      const nFly = Math.round(Math.min(70, Math.max(24, FIREFLIES * area)));
      const nStar = Math.round(Math.min(130, Math.max(40, STARS * area)));
      const flyMarks = deal(nFly);
      flies = Array.from({ length: nFly }, (_, i) => {
        const m = flyMarks[i];
        const rest = isBig(m) ? 9 + Math.random() * 4 : 6 + Math.random() * 3;
        const img = sprite(m, rest * FLY_ROOM, 0.9 * FLY_ROOM, 3 * FLY_ROOM, dpr, Math.random() * 6.28, `rgb(${GOLD})`, `rgba(${GOLD}, 0.9)`);
        const calm = Math.random() < STILL_SHARE;
        const angle = Math.random() * Math.PI * 2;
        const v = calm ? 0 : 2 + Math.random() * 7;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v * 0.6,
          wobble: calm ? 1.5 + Math.random() * 3 : 6 + Math.random() * 14,
          phase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.35,
          base: 0.14 + Math.random() * 0.3,
          r: 1 + Math.random() * 1.3,
          breathe: 0.25 + Math.random() * 0.5,
          flash: -1,
          img,
          half: img.width / dpr / FLY_ROOM / 2,
        };
      });
      const starMarks = deal(nStar);
      stars = Array.from({ length: nStar }, (_, i) => {
        const m = starMarks[i];
        const big = isBig(m);
        const img = big
          ? sprite(m, 9 + Math.random() * 8, 0.95, 4, dpr, (Math.random() - 0.5) * 0.7)
          : // Big enough that every one shows as Kai's little scribbled loop, not a dot.
            sprite(m, 5.5 + Math.random() * 4, 0.85, 2.5, dpr, Math.random() * 6.28);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          img,
          half: img.width / dpr / 2,
          a: big ? 0.55 + Math.random() * 0.35 : 0.3 + Math.random() * 0.45,
          phase: Math.random() * 6.28,
          speed: 0.3 + Math.random() * 0.6,
        };
      });
      meteors = [meteorSprite(dpr, false), meteorSprite(dpr, true)];
      scratch.width = meteors[0].img.width;
      scratch.height = meteors[0].img.height;
    };

    const draw = (now: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;

      const sl = starLight();
      if (sl > 0.01) {
        for (const s of stars) {
          // A slow twinkle.
          ctx.globalAlpha = s.a * sl * (0.72 + 0.28 * Math.sin(t * s.speed + s.phase));
          ctx.drawImage(s.img, s.x - s.half, s.y - s.half, s.half * 2, s.half * 2);
        }
        ctx.globalAlpha = 1;
      }

      for (const f of flies) {
        if (!still) {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          // Round the edges, so they drift off one side and back on the other.
          if (f.x < -20) f.x += w + 40;
          else if (f.x > w + 20) f.x -= w + 40;
          if (f.y < -20) f.y += h + 40;
          else if (f.y > h + 20) f.y -= h + 40;
        }
        const ox = Math.sin(t * f.speed + f.phase) * f.wobble;
        const oy = Math.cos(t * f.speed * 0.8 + f.phase * 1.3) * f.wobble * 0.7;
        let a = f.base * (1 - f.breathe * 0.5 + f.breathe * 0.5 * Math.sin(t * f.speed * 2 + f.phase));
        let size = f.r;
        if (f.flash >= 0) {
          const age = (now - f.flash) / FLASH_MS;
          if (age >= 1) f.flash = -1;
          else {
            // Up quickly, a moment at the top, then a long fade.
            const k = age < 0.2 ? age / 0.2 : age < 0.32 ? 1 : 1 - (age - 0.32) / 0.68;
            const e = k * k * (3 - 2 * k);
            a = a + (1 - a) * e;
            size = f.r * (1 + 1.6 * e);
          }
        }
        const x = f.x + ox;
        const y = f.y + oy;
        // The soft glow behind, as before, and Kai's mark in gold on it.
        const d = size * 9;
        ctx.globalAlpha = a * 0.7;
        ctx.drawImage(glow, x - d / 2, y - d / 2, d, d);
        const sz = f.half * (size / f.r) ** 0.6;
        ctx.globalAlpha = Math.min(1, a * 1.7);
        ctx.drawImage(f.img, x - sz, y - sz, sz * 2, sz * 2);
      }
      ctx.globalAlpha = 1;

      if (shoot) {
        const age = (now - shoot.t0) / SHOOT_MS;
        if (age >= 1) shoot = null;
        else {
          const m = shoot.m;
          // In quickly, gone slowly; easing off as it falls.
          const fade = age < 0.12 ? age / 0.12 : Math.pow(1 - (age - 0.12) / 0.88, 1.4);
          const go = 1 - Math.pow(1 - age, 2);
          const hx = shoot.x + m.dx * SHOOT_REACH * go;
          const hy = shoot.y + m.dy * SHOOT_REACH * go;
          // The trail draws out behind the head, from nothing to its full length.
          const tail = m.len * Math.min(1, 0.08 + age * 1.9);
          const S = scratch.width / m.W;
          sctx.globalCompositeOperation = "source-over";
          sctx.clearRect(0, 0, scratch.width, scratch.height);
          sctx.drawImage(m.img, 0, 0);
          sctx.globalCompositeOperation = "destination-in";
          const gr = sctx.createLinearGradient(m.hx * S, m.hy * S, (m.hx - m.dx * tail) * S, (m.hy - m.dy * tail) * S);
          gr.addColorStop(0, "rgba(0,0,0,1)");
          gr.addColorStop(0.35, "rgba(0,0,0,0.75)");
          gr.addColorStop(1, "rgba(0,0,0,0)");
          sctx.fillStyle = gr;
          sctx.fillRect(0, 0, scratch.width, scratch.height);
          ctx.globalAlpha = SHOOT_PEAK * fade;
          ctx.drawImage(scratch, hx - m.hx, hy - m.hy, m.W, m.H);
          ctx.globalAlpha = 1;
          // The head's glow.
          const a = SHOOT_PEAK * fade;
          const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
          halo.addColorStop(0, `rgba(${STAR}, ${a * 0.6})`);
          halo.addColorStop(0.4, `rgba(236, 112, 52, ${a * 0.3})`);
          halo.addColorStop(1, "rgba(236, 112, 52, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(hx, hy, 14, 0, 6.2832);
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      // Capped, so a tab coming back from the background doesn't jump them.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(now, dt);
      raf = requestAnimationFrame(tick);
    };

    const flash = () => {
      const n = 2 + (Math.random() < 0.4 ? 1 : 0);
      const now = performance.now();
      for (let i = 0; i < n; i++) {
        const f = flies[Math.floor(Math.random() * flies.length)];
        // A little apart, so a pair doesn't read as one blink.
        if (f && f.flash < 0) f.flash = now + i * (150 + Math.random() * 350);
      }
    };

    const fire = () => {
      if (starLight() < 0.25) return;
      // Kai's meteor falls to the left; mirrored, it falls to the right.
      const leftToRight = Math.random() < 0.5;
      const m = meteors[leftToRight ? 1 : 0];
      shoot = {
        t0: performance.now(),
        x: leftToRight ? w * (0.08 + Math.random() * 0.45) : w * (0.47 + Math.random() * 0.45),
        y: 30 + Math.random() * h * 0.22,
        m,
      };
    };

    setup();
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setup();
        if (still) draw(performance.now(), 0);
      }, 150);
    };
    window.addEventListener("resize", onResize);

    let onScroll: (() => void) | null = null;
    if (still) {
      draw(performance.now(), 0);
      // The stars still thin out down the page; redraw on scroll, no loop.
      onScroll = () => draw(performance.now(), 0);
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      raf = requestAnimationFrame((n) => {
        last = n;
        tick(n);
      });
      flashTimer = window.setInterval(() => {
        if (document.visibilityState === "visible") flash();
      }, FLASH_EVERY);
      const scheduleShoot = (wait: number) => {
        shootTimer = window.setTimeout(() => {
          if (document.visibilityState === "visible") fire();
          scheduleShoot(SHOOT_EVERY * (0.8 + Math.random() * 0.4));
        }, wait);
      };
      scheduleShoot(SHOOT_FIRST);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(flashTimer);
      clearTimeout(shootTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: -1, pointerEvents: "none" }}
    />
  );
}
