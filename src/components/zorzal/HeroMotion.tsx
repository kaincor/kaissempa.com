"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Drives the Zorzal hero's scroll parallax. It writes one CSS variable on the
 * header, --p, the scroll progress through the hero (0 at the top, 1 once it
 * has scrolled away), and theme.css turns it into transforms: the sky, the
 * wordmark and the hill move at different speeds, and the hill tips back as
 * you leave. Reduced motion leaves --p at 0.
 */
export default function HeroMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = -1;
    const tick = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (el.offsetHeight || 1)));
      if (p !== last) {
        last = p;
        el.style.setProperty("--p", p.toFixed(4));
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
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
