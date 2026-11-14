import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { preload } from "react-dom";
import "./theme.css";
import { mobileThemeColor } from "@/lib/theme-color";
import PondScene from "@/components/pond-mage/PondScene";
import FadeIn from "@/components/fortuna/FadeIn";
import SwipeDeck from "@/components/SwipeDeck";
import RoseHeading from "@/components/pond-mage/RoseHeading";
import DropCap from "@/components/pond-mage/DropCap";
import { CREDITS, DESK, DESK_ROSE, LEDE, SECTIONS, type Figure } from "@/content/pond-mage";

/** The night: the render's sky, taken darker so the render glows against it. */
const NIGHT = "#140b17";
/** Kai's lettering colour, for the headings. */
const GOLD = "#efd48c";
/** The thumbnail's purple, for the small labels. */
const LILAC = "#b896c4";
const TEXT = "rgba(240, 232, 244, 0.86)";

export const viewport: Viewport = { themeColor: mobileThemeColor(NIGHT) };

export const metadata: Metadata = {
  title: "The Pond Mage",
  description:
    "A young mage practises her magic by the pond's edge: a 3D scene Kai Ssempa modelled, textured and lit in Blender.",
};

const COLUMN = "min(680px, 100% - 40px)";
const WIDE = "min(1040px, 100% - 40px)";

const label = {
  fontFamily: "var(--font-grotesk)",
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: LILAC,
} as const;

function Fig({ f, sizes }: { f: Figure; sizes: string }) {
  return (
    <figure style={{ margin: 0 }}>
      <Image
        src={f.src}
        alt={f.caption}
        width={f.w}
        height={f.h}
        sizes={sizes}
        quality={85}
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 6 }}
      />
      <figcaption
        style={{ marginTop: 10, fontFamily: "var(--font-body)", fontSize: 13.5, lineHeight: 1.5, color: "rgba(240, 232, 244, 0.58)" }}
      >
        {f.caption}
      </figcaption>
    </figure>
  );
}

export default function PondMagePage() {
  // The headings and the navbar are set in Kaisteel (theme.css).
  preload("/pond-mage/fonts/Kaisteel-Regular.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <main className="flex-1" style={{ background: NIGHT, color: TEXT }}>
      {/* The render, as large as the screen allows at its own 16:9. */}
      <section style={{ position: "relative" }}>
        <div
          style={{
            position: "relative",
            width: "min(100%, calc(100svh * 16 / 9))",
            aspectRatio: "16 / 9",
            margin: "0 auto",
          }}
        >
          <PondScene priority />
          {/* Lets the render's foot settle into the page. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "14%",
              background: `linear-gradient(to bottom, transparent, ${NIGHT})`,
              pointerEvents: "none",
            }}
          />
        </div>
      </section>

      <section style={{ padding: "clamp(48px, 8vh, 96px) 0 clamp(40px, 6vh, 72px)" }}>
        <div style={{ width: COLUMN, margin: "0 auto" }}>
          <FadeIn>
            <h1 className="sr-only">The Pond Mage</h1>
            <p
              style={{
                margin: "0 0 clamp(28px, 4vh, 40px)",
                fontFamily: "var(--pm-kaisteel)",
                fontWeight: 400,
                fontSize: "clamp(22px, 2.6vw, 30px)",
                lineHeight: 1.3,
                color: GOLD,
                textAlign: "center",
                textWrap: "balance",
              }}
            >
              {LEDE}
            </p>
          </FadeIn>
          {/* A single rule under the line. */}
          <div aria-hidden="true" style={{ borderTop: "1px solid rgba(184, 150, 196, 0.28)" }} />
        </div>
      </section>

      {SECTIONS.map((s) => {
        const many = (s.figures?.length ?? 0) > 1;
        return (
          <section key={s.id} id={s.id} style={{ padding: "clamp(36px, 6vh, 64px) 0" }}>
            <div style={{ width: COLUMN, margin: "0 auto" }}>
              <FadeIn>
                <h2
                  style={{
                    margin: "0 0 18px",
                    fontFamily: "var(--pm-kaisteel)",
                    fontWeight: 400,
                    fontSize: "clamp(30px, 3vw, 38px)",
                    lineHeight: 1.2,
                    color: GOLD,
                  }}
                >
                  {s.rose ? <RoseHeading text={s.title} rose={s.rose} /> : s.title}
                </h2>
              </FadeIn>
              {s.body.map((p, i) => (
                <FadeIn key={i}>
                  <p style={{ margin: i === 0 ? "calc(0.955 * 1.65em) 0 1em" : "0 0 1em", fontFamily: "var(--font-body)", fontSize: "clamp(16px, 1.25vw, 18px)", lineHeight: 1.65 }}>
                    {i === 0 ? <DropCap text={p} /> : p}
                  </p>
                </FadeIn>
              ))}
            </div>
            {s.deck ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "clamp(24px, 4vh, 40px) 0 8px" }}>
                <SwipeDeck
                  cards={s.deck.map((d) => ({ src: `/pond-mage/lagunita/${d.src}.jpg`, alt: d.alt }))}
                  sizes="(max-width: 640px) 70vw, 340px"
                  radius={10}
                  shadow="0 18px 40px rgba(0, 0, 0, 0.55)"
                  label="Kai's photos of Lake Lagunita"
                  style={{ width: "min(64vw, 320px)", aspectRatio: "3 / 4" }}
                />
              </div>
            ) : null}
            {s.figures ? (
              <div
                style={{
                  width: WIDE,
                  margin: "clamp(20px, 3vh, 32px) auto 0",
                  display: "grid",
                  gridTemplateColumns: many ? "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" : "1fr",
                  gap: "clamp(18px, 2.4vw, 28px)",
                  alignItems: "start",
                }}
              >
                {s.figures.map((f) => (
                  <FadeIn key={f.src}>
                    <Fig f={f} sizes={many ? "(max-width: 700px) 100vw, 520px" : "(max-width: 1080px) 100vw, 1040px"} />
                  </FadeIn>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}

      {/* At the desk: the hours, in photos. */}
      <section style={{ padding: "clamp(36px, 6vh, 64px) 0" }}>
        <div style={{ width: COLUMN, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ margin: "0 0 18px", fontFamily: "var(--pm-kaisteel)", fontWeight: 400, fontSize: "clamp(30px, 3vw, 38px)", lineHeight: 1.2, color: GOLD }}>
              <RoseHeading text="At the desk" rose={DESK_ROSE} />
            </h2>
          </FadeIn>
        </div>
        <div
          style={{
            width: WIDE,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(46%, 150px), 1fr))",
            gap: 10,
          }}
        >
          {DESK.map((d) => (
            <FadeIn key={d.src}>
              <Image
                src={`/pond-mage/desk/${d.src}.jpg`}
                alt="Kai's screen, with the Pond Mage open in Blender"
                width={d.w}
                height={d.h}
                sizes="(max-width: 700px) 50vw, 200px"
                quality={80}
                style={{ width: "100%", aspectRatio: "9 / 16", objectFit: "cover", display: "block", borderRadius: 6 }}
              />
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ padding: "clamp(36px, 6vh, 64px) 0" }}>
        <div style={{ width: WIDE, margin: "0 auto" }}>
          <FadeIn>
            <Fig f={{ src: "/pond-mage/final.jpg", w: 1920, h: 1080, caption: "The final render." }} sizes="(max-width: 1080px) 100vw, 1040px" />
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: "clamp(24px, 4vh, 48px) 0 clamp(72px, 12vh, 140px)" }}>
        <div style={{ width: COLUMN, margin: "0 auto", fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.6 }}>
          <FadeIn>
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: "clamp(16px, 3vw, 32px)", rowGap: 12 }}>
              {CREDITS.map((c) => (
                <div key={c.label} style={{ display: "contents" }}>
                  <dt style={{ ...label, paddingTop: 2 }}>{c.label}</dt>
                  <dd style={{ margin: 0 }}>
                    {c.items.map((it, i) => (
                      <span key={it.href}>
                        {i ? ", " : null}
                        <a href={it.href} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(184, 150, 196, 0.6)" }}>
                          {it.name}
                        </a>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
