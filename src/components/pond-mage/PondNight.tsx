"use client";

import { useEffect, useRef } from "react";

/**
 * The dusk behind the Pond Mage page: fireflies and a few faint stars, with a
 * shooting star now and then. It sits fixed behind the text, so the page
 * scrolls over it like the far side of the pond; the purple fading lighter
 * down the page is the page's own background (page.tsx), not this.
 *
 * Fireflies, in the page's gold: most dim, about a third of them all but
 * still, the rest wandering very slowly. Every 3.5s a couple, anywhere on
 * screen, swell up bright and fade back.
 *
 * Stars, tiny and still, belong to the dark top of the page and thin out as
 * the reader scrolls down into the lighter purple. The shooting star is the
 * one from Fortuna's North Star sky (fortuna/NightSky.tsx): a shallow dive
 * with a tail that grows out of nothing, every nine seconds or so, in the
 * upper part of the screen, and only while there are stars to fall from.
 *
 * One canvas, never taking pointer events, nothing following the cursor. It
 * stops drawing while the tab is hidden, and with reduced motion it draws a
 * single still frame.
 */

const GOLD = [239, 212, 140] as const;
const STAR = [247, 242, 250] as const;

/** Fireflies and stars on a 1440 x 900 screen; scaled to the screen's area. */
const FIREFLIES = 50;
const STARS = 90;
/** The share of fireflies that barely move. */
const STILL_SHARE = 0.35;

/** A couple light up every this many ms. */
const FLASH_EVERY = 3500;
const FLASH_MS = 2400;

const SHOOT_FIRST = 4000;
const SHOOT_EVERY = 9000;
const SHOOT_MS = 950;
const SHOOT_TAIL = 130;
const SHOOT_REACH = 360;
const SHOOT_PEAK = 0.85;

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
};

type Star = { x: number; y: number; r: number; a: number };

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
    let shoot: { t0: number; x: number; y: number; dx: number; dy: number } | null = null;

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
      flies = Array.from({ length: nFly }, () => {
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
        };
      });
      stars = Array.from({ length: nStar }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 0.7,
        a: 0.18 + Math.random() * 0.4,
      }));
    };

    const draw = (now: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;

      const sl = starLight();
      if (sl > 0.01) {
        for (const s of stars) {
          ctx.fillStyle = `rgba(${STAR}, ${s.a * sl})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, 6.2832);
          ctx.fill();
        }
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
        const d = size * 9;
        ctx.globalAlpha = a;
        ctx.drawImage(glow, f.x + ox - d / 2, f.y + oy - d / 2, d, d);
      }
      ctx.globalAlpha = 1;

      if (shoot) {
        const age = (now - shoot.t0) / SHOOT_MS;
        if (age >= 1) shoot = null;
        else {
          const fade = age < 0.18 ? age / 0.18 : (1 - age) / 0.82;
          const a = SHOOT_PEAK * fade;
          const travel = SHOOT_REACH * age;
          const hx = shoot.x + shoot.dx * travel;
          const hy = shoot.y + shoot.dy * travel;
          const tail = SHOOT_TAIL * Math.min(1, age * 3.5);
          const tx = hx - shoot.dx * tail;
          const ty = hy - shoot.dy * tail;
          const g = ctx.createLinearGradient(tx, ty, hx, hy);
          g.addColorStop(0, `rgba(${STAR}, 0)`);
          g.addColorStop(1, `rgba(${STAR}, ${a})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();
          const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9);
          halo.addColorStop(0, `rgba(${STAR}, ${a * 0.55})`);
          halo.addColorStop(1, `rgba(${STAR}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(hx, hy, 9, 0, 6.2832);
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
      const leftToRight = Math.random() < 0.5;
      const angle = (18 + Math.random() * 16) * (Math.PI / 180);
      shoot = {
        t0: performance.now(),
        x: leftToRight ? Math.random() * w * 0.45 : w - Math.random() * w * 0.45,
        y: 40 + Math.random() * h * 0.4,
        dx: (leftToRight ? 1 : -1) * Math.cos(angle),
        dy: Math.sin(angle),
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
