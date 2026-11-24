"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Fit } from "./kit";
import { ScreenById, type ScreenId } from "./index";

export type Pair = { before: ScreenId; after: ScreenId; label: string; beforeCaption: string; afterCaption: string };

/**
 * The same four moments, before and after the interview became a video
 * resume, behind one switch. Before is the wireframes, greyscale as they
 * were; after is what shipped. Flipping it turns every screen over at once,
 * a beat apart, so the change reads as one decision rather than four.
 */
export default function BeforeAfter({ pairs }: { pairs: Pair[] }) {
  const reduced = useReducedMotion();
  const [after, setAfter] = useState(false);
  const tab = (on: boolean, label: string, value: boolean) => (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={() => setAfter(value)}
      style={{
        padding: "10px 20px",
        border: "none",
        borderRadius: 999,
        background: on ? "var(--f-forest)" : "transparent",
        color: on ? "var(--f-cream)" : "var(--f-forest)",
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
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "clamp(16px, 2.4vw, 26px)" }}>
        <div role="tablist" aria-label="Before or after the video resume" style={{ display: "inline-flex", padding: 4, borderRadius: 999, background: "rgba(50,68,62,0.08)" }}>
          {tab(!after, "Before: the interview", false)}
          {tab(after, "After: the video resume", true)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "clamp(10px, 2vw, 24px)" }}>
        {pairs.map((p, i) => (
          <div
            key={p.label}
            style={{
              borderRadius: "clamp(16px, 2.2vw, 28px)",
              background: after ? "rgba(105,189,69,0.12)" : "rgba(50,68,62,0.06)",
              transition: "background 0.5s ease",
              padding: "clamp(16px, 4vw, 44px) clamp(12px, 3vw, 36px) clamp(16px, 2.6vw, 30px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: "min(100%, 250px)", perspective: 1200 }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={after ? p.after : p.before}
                  initial={reduced ? { opacity: 0 } : { rotateY: -90, opacity: 0.4 }}
                  animate={reduced ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { rotateY: 90, opacity: 0.4 }}
                  transition={{ duration: 0.28, ease: "easeInOut", delay: reduced ? 0 : i * 0.06 }}
                >
                  <Fit>
                    <ScreenById id={after ? p.after : p.before} />
                  </Fit>
                </motion.div>
              </AnimatePresence>
            </div>
            <div style={{ width: "100%", maxWidth: 300, marginTop: "clamp(14px, 2.4vw, 26px)" }} aria-live="polite">
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", fontFamily: "var(--f-grotesk)", fontWeight: 600, fontSize: "clamp(12px, 1.3vw, 14px)", color: "var(--f-forest)" }}>
                <span style={{ color: "var(--f-orange)" }}>{String(i + 1).padStart(2, "0")}</span>
                {p.label}
              </div>
              <p style={{ margin: "5px 0 0", fontFamily: "var(--f-body)", fontSize: "clamp(12px, 1.25vw, 14px)", lineHeight: 1.5, letterSpacing: "-0.015em", color: "var(--f-ink)" }}>
                {after ? p.afterCaption : p.beforeCaption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
