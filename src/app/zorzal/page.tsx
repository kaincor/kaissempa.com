import type { Metadata } from "next";
import { preload } from "react-dom";
import "./theme.css";
import { FACTS, OUTCOME, SECTIONS } from "@/content/zorzal";
import ZorzalHero from "@/components/zorzal/ZorzalHero";
import { SectionBand } from "@/components/zorzal/Blocks";
import FadeIn from "@/components/fortuna/FadeIn";

export const metadata: Metadata = {
  title: "Zorzal Cacao — Cacao Tracker",
  description:
    "Making a supply-chain tool work where the work actually happens: a mobile, Spanish-language cacao tracker for Zorzal Cacao, on a bird sanctuary in the Dominican Republic.",
};

export default function ZorzalPage() {
  // The chapter titles and the navbar are set in Captain Kai Bold (theme.css).
  preload("/zorzal/fonts/CaptainKai-Bold.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <main className="zorzal flex-1">
      <ZorzalHero />

      {/* The facts, Phylissa Li style: a labelled block under the title,
          then the outcome in a line. */}
      <section style={{ background: "#ffe2ce", padding: "clamp(64px, 11vh, 130px) 0 clamp(56px, 8vh, 96px)" }}>
        <div style={{ width: "min(680px, 100% - 40px)", margin: "0 auto" }}>
          <FadeIn>
            <p
              style={{
                margin: "0 0 clamp(28px, 4vh, 40px)",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(22px, 2.8vw, 30px)",
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
                color: "var(--z-wine)",
                textAlign: "center",
                textWrap: "balance",
              }}
            >
              Making a supply-chain tool work where the work actually happens.
            </p>
          </FadeIn>
          <FadeIn>
            <dl
              style={{
                margin: 0,
                display: "grid",
                gridTemplateColumns: "max-content 1fr",
                columnGap: "clamp(16px, 3vw, 32px)",
                rowGap: 12,
                fontFamily: "var(--font-body)",
                fontSize: 15,
                lineHeight: 1.5,
                borderTop: "1px solid var(--z-rule)",
                borderBottom: "1px solid var(--z-rule)",
                padding: "22px 0",
              }}
            >
              {FACTS.map((f) => (
                <div key={f.label} style={{ display: "contents" }}>
                  <dt
                    style={{
                      fontFamily: "var(--font-grotesk)",
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--z-terracotta)",
                      paddingTop: 2,
                    }}
                  >
                    {f.label}
                  </dt>
                  <dd style={{ margin: 0 }}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>
          <FadeIn>
            <p
              style={{
                margin: "clamp(22px, 3vh, 32px) 0 0",
                fontFamily: "var(--font-body)",
                fontSize: "clamp(16px, 1.25vw, 18px)",
                lineHeight: 1.65,
              }}
            >
              <strong style={{ fontWeight: 600 }}>Outcome.</strong> {OUTCOME}
            </p>
          </FadeIn>
        </div>
      </section>

      {SECTIONS.map((s) => (
        <SectionBand key={s.id} section={s} />
      ))}
    </main>
  );
}
