"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import FortunaWordmark from "../FortunaWordmark";

/**
 * The app icon, before and after: the clover and the f.
 *
 * The clover is three white leaves and an orange dot standing in for the
 * fourth. The f. is the first letter of the wordmark and its full stop. They
 * share one thing, the orange dot, so the change is drawn as that dot
 * travelling: the leaves fold into the middle, the dot drops to the
 * baseline and grows a little, and the f rises in behind it.
 *
 * It plays back and forth on its own while it's on screen. Pressing either
 * side of the switch takes over and stops the loop.
 */

/** The f, from the brand's 1280 icon artwork. */
const F_PATH =
  "M238.846 1132V1061.4L301.846 1047.55L303.923 841.275V561.625H225V470.254L308.769 459.871C324.692 346.35 360.692 281.283 416.077 225.215C488.077 153.226 589.154 120 676.385 120C758.077 120 837 146.304 855 229.368C855 288.897 816.231 333.198 749.769 333.198C698.538 333.198 655.615 298.588 615.462 211.371L612.692 205.141C571.154 257.056 560.077 326.276 563.538 457.795H694.385V561.625H567V841.275L569.077 1037.17L668.077 1061.4V1132H299.769H238.846Z";

/**
 * One leaf, the top-left one: a teardrop with its point in the corner and
 * its round end towards the middle. The others are this one turned a
 * quarter at a time about the centre of the icon.
 */
const LEAF = (() => {
  const cx = 482;
  const cy = 482;
  const r = 112;
  const tip = { x: 236, y: 236 };
  // Where the sides meet the round end: square to the leaf's axis.
  const s = r / Math.SQRT2;
  const a = { x: cx + s, y: cy - s };
  const b = { x: cx - s, y: cy + s };
  // The sides bow outwards on their way to the point.
  const ca = { x: a.x - 22, y: tip.y + 4 };
  const cb = { x: tip.x + 4, y: b.y - 22 };
  return `M${tip.x} ${tip.y} Q${ca.x} ${ca.y} ${a.x} ${a.y} A${r} ${r} 0 0 1 ${b.x} ${b.y} Q${cb.x} ${cb.y} ${tip.x} ${tip.y}Z`;
})();

const GREEN = "#69BD45";
const ORANGE = "#F58120";
/** The clover's dot, in the fourth leaf's place, and the f's full stop. */
const DOT_CLOVER = { cx: 792, cy: 792, r: 112 };
const DOT_F = { cx: 920, cy: 1020, r: 136 };

export default function BrandMark() {
  const reduced = useReducedMotion();
  const host = useRef<HTMLElement>(null);
  const inView = useInView(host, { amount: 0.4 });
  const [f, setF] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!inView || held || reduced) return;
    const id = window.setInterval(() => setF((v) => !v), 3200);
    return () => window.clearInterval(id);
  }, [inView, held, reduced]);

  const ease = [0.65, 0, 0.35, 1] as const;
  const dur = reduced ? 0 : 0.9;
  const pick = (value: boolean) => {
    setHeld(true);
    setF(value);
  };
  const tab = (value: boolean, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={f === value}
      onClick={() => pick(value)}
      style={{
        padding: "9px 18px",
        border: "none",
        borderRadius: 999,
        background: f === value ? "var(--f-forest)" : "transparent",
        color: f === value ? "var(--f-cream)" : "var(--f-forest)",
        fontFamily: "var(--f-grotesk)",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {label}
    </button>
  );

  return (
    <figure
      ref={host}
      className="f-wide"
      style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}
    >
      <div
        style={{
          borderRadius: "clamp(18px, 2.4vw, 32px)",
          background: "rgba(50,68,62,0.06)",
          padding: "clamp(28px, 5vw, 64px) clamp(16px, 4vw, 56px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "clamp(24px, 4vw, 56px)",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg
            viewBox="0 0 1280 1280"
            role="img"
            aria-label={f ? "The Fortuna app icon: a white f and an orange full stop on green" : "The first Fortuna app icon: three white leaves and an orange dot, a four-leaf clover, on green"}
            style={{ width: "min(100%, 300px)", height: "auto", borderRadius: "22%", boxShadow: "0 1px 2px rgba(40,40,30,0.08), 0 22px 48px rgba(40,40,30,0.16)", display: "block" }}
          >
            <rect width="1280" height="1280" fill={GREEN} />
            {[0, 90, 270].map((deg, i) => (
              <g key={deg} transform={`rotate(${deg} 640 640)`}>
                <motion.path
                  d={LEAF}
                  fill="#fff"
                  style={{ transformBox: "fill-box", transformOrigin: "70% 70%" }}
                  initial={false}
                  animate={f ? { scale: 0, opacity: 0, rotate: -40 } : { scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: dur * 0.7, ease, delay: f ? i * 0.06 : 0.25 + i * 0.06 }}
                />
              </g>
            ))}
            <motion.path
              d={F_PATH}
              fill="#fff"
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              initial={false}
              animate={f ? { opacity: 1, scaleY: 1, y: 0 } : { opacity: 0, scaleY: 0.6, y: 60 }}
              transition={{ duration: dur * 0.8, ease, delay: f ? 0.3 : 0 }}
            />
            <motion.circle
              fill={ORANGE}
              initial={false}
              animate={f ? DOT_F : DOT_CLOVER}
              transition={{ duration: dur, ease, delay: f ? 0.1 : 0.15 }}
            />
          </svg>
        </div>
        <div>
          <div role="tablist" aria-label="The app icon, before or after" style={{ display: "inline-flex", padding: 4, borderRadius: 999, background: "rgba(50,68,62,0.08)", marginBottom: 18 }}>
            {tab(false, "The clover")}
            {tab(true, "The f.")}
          </div>
          <div style={{ fontSize: "clamp(30px, 3.4vw, 42px)", lineHeight: 1, marginBottom: 14 }}>
            <FortunaWordmark title="fortuna." />
          </div>
          <p aria-live="polite" style={{ margin: 0, maxWidth: 380, fontFamily: "var(--f-body)", fontSize: "clamp(14px, 1.3vw, 16px)", lineHeight: 1.55, letterSpacing: "-0.015em", color: "var(--f-ink)" }}>
            {f
              ? "The f is the wordmark's first letter, and the orange dot is its full stop. The icon and the name became one mark."
              : "Three white leaves, and an orange dot for the fourth: a four-leaf clover, for a company named after the goddess of luck."}
          </p>
        </div>
      </div>
    </figure>
  );
}
