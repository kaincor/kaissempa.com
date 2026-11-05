"use client";

import { useEffect, useRef } from "react";
import { edge } from "./DaySky";

/**
 * A shooting star across the Zorzal day sky every few seconds, the same
 * glint as Fortuna's night sky (fortuna/NightSky.tsx): a shallow dive, in
 * fast and out slow, its tail growing out of nothing. It starts somewhere
 * random inside the starry band and only runs while the hero is on screen
 * and the tab is visible. Reduced motion gets none.
 */
const EVERY = 3750;
const FIRST = 1750;
const MS = 950;
const TAIL = 130;
const REACH = 360;
const PEAK = 0.9;

export default function ShootingStars() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fire = () => {
      const w = el.clientWidth;
      // The band's box: as wide as the hero, its height tied to the width
      // the same way DaySky sizes it.
      const boxH = Math.min(el.clientHeight, w * 0.625);
      const leftToRight = Math.random() < 0.5;
      const fx = leftToRight ? Math.random() * 0.55 : 0.45 + Math.random() * 0.55;
      const fy = Math.random() * edge(fx) * 0.6;
      const angle = (18 + Math.random() * 16) * (Math.PI / 180);
      const dx = (leftToRight ? 1 : -1) * Math.cos(angle);
      const dy = Math.sin(angle);

      const s = document.createElement("span");
      s.setAttribute("aria-hidden", "true");
      s.style.cssText = [
        "position:absolute",
        `left:${fx * w}px`,
        `top:${fy * boxH}px`,
        `width:${TAIL}px`,
        "height:1.6px",
        "border-radius:1px",
        "background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95))",
        "box-shadow:0 0 4px rgba(255,255,255,0.8)",
        "transform-origin:100% 50%",
        "pointer-events:none",
      ].join(";");
      el.appendChild(s);

      // The span's right end is the head. Rotate the whole streak to point
      // along its path, then slide it; the tail grows in over the first third.
      const rot = Math.atan2(dy, dx);
      const at = (t: number) => {
        const travel = REACH * t;
        const tail = Math.min(1, t * 3.5);
        return `translate(${-TAIL + dx * travel}px, ${dy * travel}px) rotate(${rot}rad) scaleX(${tail})`;
      };
      const a = s.animate(
        [
          { transform: at(0), opacity: 0 },
          { transform: at(0.18), opacity: PEAK, offset: 0.18 },
          { transform: at(0.5), opacity: PEAK * 0.6, offset: 0.5 },
          { transform: at(1), opacity: 0 },
        ],
        { duration: MS, easing: "linear" },
      );
      a.onfinish = () => s.remove();
    };

    const schedule = (wait: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (onScreen && document.visibilityState === "visible") fire();
        schedule(EVERY * (0.8 + Math.random() * 0.4));
      }, wait);
    };

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
    });
    io.observe(el);
    schedule(FIRST);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  return <div ref={host} aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} />;
}
