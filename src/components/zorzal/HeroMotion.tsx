"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Drives the Zorzal hero's depth. It writes three CSS variables on the
 * header, and theme.css turns them into transforms:
 *
 *   --p   scroll progress through the hero, 0 at the top and 1 once it has
 *         scrolled away. The sky, wordmark and landscape move at different
 *         speeds, and the hill tips back as you leave.
 *   --mx  cursor across the hero, -1 (left) to 1 (right), eased
 *   --my  cursor down the hero, -1 (top) to 1 (bottom), eased
 *
 * The cursor only counts while it's over the hero, and eases back to centre
 * when it leaves. Touch screens get the scroll parallax only; reduced motion
 * gets neither.
 */
export default function HeroMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0, p: -1 };
    let raf = 0;

    const tick = () => {
      raf = 0;
      const h = el.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      now.x += (target.x - now.x) * 0.08;
      now.y += (target.y - now.y) * 0.08;
      if (p !== now.p) {
        now.p = p;
        el.style.setProperty("--p", p.toFixed(4));
      }
      el.style.setProperty("--mx", now.x.toFixed(4));
      el.style.setProperty("--my", now.y.toFixed(4));
      if (Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001) {
        raf = requestAnimationFrame(tick);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    if (fine) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }
    kick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <header
      ref={ref}
      className="z-hero"
      style={{
        position: "relative",
        height: "100svh",
        minHeight: 520,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      {children}
    </header>
  );
}
