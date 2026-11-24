"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { Fit } from "./kit";
import { ScreenById, type ScreenId } from "./index";

export type GridItem = { screen: ScreenId; label: string; caption: string };

/**
 * Screens two by two, each on its own panel with a number, a name and a line
 * on what it's doing: the case study showing rather than telling.
 *
 * Wider than the text column, the way a designer lays out a board, and still
 * two across on a phone, where the panels tighten up around the screens.
 * The panels rise in one after another as they come into view, and a screen
 * lifts a little under the pointer.
 */
export default function ScreenGrid({ items, title, dark = false }: { items: GridItem[]; title?: string; dark?: boolean }) {
  const reduced = useReducedMotion();
  const panel: CSSProperties = {
    borderRadius: "clamp(16px, 2.2vw, 28px)",
    background: dark ? "rgba(255,255,255,0.06)" : "rgba(50,68,62,0.06)",
    padding: "clamp(16px, 4vw, 44px) clamp(12px, 3vw, 36px) clamp(16px, 2.6vw, 30px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };
  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      {title && (
        <figcaption
          style={{
            margin: "0 0 clamp(12px, 1.6vw, 18px)",
            fontFamily: "var(--f-grotesk)",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: dark ? "var(--f-green)" : "var(--f-orange)",
            textAlign: "center",
          }}
        >
          {title}
        </figcaption>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "clamp(10px, 2vw, 24px)" }}>
        {items.map((item, i) => (
          <motion.div
            key={item.screen + i}
            style={panel}
            initial={reduced ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.12 }}
          >
            <div className="f-grid-screen" style={{ width: "min(100%, 250px)" }}>
              <Fit>
                <ScreenById id={item.screen} />
              </Fit>
            </div>
            <div style={{ width: "100%", maxWidth: 300, marginTop: "clamp(14px, 2.4vw, 26px)", textAlign: "left" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", fontFamily: "var(--f-grotesk)", fontWeight: 600, fontSize: "clamp(12px, 1.3vw, 14px)", letterSpacing: "-0.01em", color: dark ? "var(--f-cream)" : "var(--f-forest)" }}>
                <span style={{ color: dark ? "var(--f-green)" : "var(--f-orange)", fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </div>
              <p style={{ margin: "5px 0 0", fontFamily: "var(--f-body)", fontSize: "clamp(12px, 1.25vw, 14px)", lineHeight: 1.5, letterSpacing: "-0.015em", color: dark ? "rgba(247,245,240,0.75)" : "var(--f-ink)" }}>
                {item.caption}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </figure>
  );
}
