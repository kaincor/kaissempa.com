import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { IM_Fell_English, IM_Fell_English_SC } from "next/font/google";
import { mobileThemeColor } from "@/lib/theme-color";
import FadeIn from "@/components/fortuna/FadeIn";
import BoxOpen from "@/components/motw/BoxOpen";
import { LEDE, RENDERS, SECTIONS, SPELLS, TEAM, type Block } from "@/content/mark-of-the-witch";

// IM Fell, the face the cards are set in: a seventeenth-century type,
// close to what a witch-finder's pamphlet would have been printed in.
const fell = IM_Fell_English({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const fellSC = IM_Fell_English_SC({ weight: "400", subsets: ["latin"], display: "swap" });

/** The cards' old paper, and the box's ink and red. */
const PAPER = "#ece2c9";
const PAPER_DEEP = "#e0d2b2";
const INK = "#1d1a14";
const RED = "#9d2c28";

export const viewport: Viewport = { themeColor: mobileThemeColor(PAPER) };

export const metadata: Metadata = {
  title: "Mark of the Witch",
  description:
    "A social deduction card game set in a fourteenth-century witch hunt. Kai Ssempa made its box and renders with a team of five.",
};

const COLUMN = "min(640px, 100% - 40px)";
const WIDE = "min(1080px, 100% - 40px)";

const caption = { margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, fontStyle: "italic", color: "rgba(29, 26, 20, 0.66)" } as const;

function cardByName(name: string) {
  return SPELLS.find((s) => s.name === name)!;
}

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case "p":
      return <p style={{ margin: "0 0 1em" }}>{b.text}</p>;
    case "pull":
      return (
        <p style={{ margin: "clamp(28px, 5vh, 48px) 0", textAlign: "center", fontFamily: fellSC.style.fontFamily, fontSize: "clamp(26px, 3.4vw, 40px)", color: RED, letterSpacing: "0.04em" }}>
          {b.text}
        </p>
      );
    case "cards":
      return (
        <figure style={{ margin: "clamp(20px, 3vh, 32px) 0 1.2em" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(10px, 2vw, 22px)" }}>
            {b.names.map((n, i) => (
              <div key={n} className="motw-lift" style={{ position: "relative", width: "min(30%, 190px)", aspectRatio: "673 / 942", rotate: `${(i - 1) * 4}deg`, translate: `0 ${i === 1 ? -8 : 0}px` }}>
                <Image src={cardByName(n).src} alt={n} fill sizes="190px" style={{ objectFit: "contain" }} />
              </div>
            ))}
          </div>
          <figcaption style={{ ...caption, textAlign: "center", marginTop: 18 }}>{b.caption}</figcaption>
        </figure>
      );
    case "figure":
      return (
        <figure style={{ margin: "1.4em 0" }}>
          <Image src={b.src} alt={b.caption} width={b.w} height={b.h} sizes="680px" style={{ width: "100%", height: "auto", display: "block" }} />
          <figcaption style={caption}>{b.caption}</figcaption>
        </figure>
      );
    case "pair":
      return (
        <figure style={{ margin: "clamp(24px, 4vh, 40px) 0 1.2em" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(14px, 3vw, 32px)", alignItems: "end" }}>
            {b.items.map((it, i) => (
              <Image
                key={it.src}
                src={it.src}
                alt={i ? "The printed box front" : "An earlier cover"}
                width={it.w}
                height={it.h}
                sizes="(max-width: 700px) 46vw, 320px"
                style={{ width: "100%", height: "auto", display: "block", rotate: `${i ? 1.5 : -1.5}deg`, filter: "drop-shadow(0 12px 18px rgba(29, 22, 12, 0.3))" }}
              />
            ))}
          </div>
          <figcaption style={{ ...caption, marginTop: 20 }}>{b.caption}</figcaption>
        </figure>
      );
    case "renders":
      return null;
    case "placeholder":
      return (
        <div
          style={{
            margin: "1.4em 0 0",
            padding: "clamp(36px, 7vh, 64px) 24px",
            border: `1.5px dashed rgba(157, 44, 40, 0.55)`,
            borderRadius: 6,
            textAlign: "center",
            fontStyle: "italic",
            color: "rgba(29, 26, 20, 0.7)",
            background: "rgba(255, 250, 235, 0.35)",
          }}
        >
          {b.text}
        </div>
      );
  }
}

export default function MarkOfTheWitchPage() {
  return (
    <main
      className={`flex-1 ${fell.className}`}
      style={{ background: `linear-gradient(to bottom, ${PAPER} 0%, ${PAPER} 70%, ${PAPER_DEEP} 100%)`, color: INK }}
    >
      {/* The navbar sits outside the page's wrapper, so its face goes on :root. */}
      <style>{`
        :root { --motw-fell-sc: ${fellSC.style.fontFamily}; }
        body { background-color: ${PAPER_DEEP}; }
        .motw-lift { transition: translate 0.35s cubic-bezier(0.22, 1, 0.36, 1), rotate 0.35s cubic-bezier(0.22, 1, 0.36, 1); filter: drop-shadow(0 8px 12px rgba(29, 22, 12, 0.28)); }
        @media (hover: hover) { .motw-lift:hover { translate: 0 -12px !important; rotate: 0deg !important; } }
      `}</style>
      <h1 className="sr-only">Mark of the Witch</h1>

      <BoxOpen spells={SPELLS}>
        <Image src="/mark-of-the-witch/lettering.svg" alt="" width={555} height={334} style={{ width: "min(300px, 56vw)", height: "auto" }} />
      </BoxOpen>

      <section style={{ padding: "clamp(56px, 10vh, 120px) 0 clamp(24px, 4vh, 40px)" }}>
        <div style={{ width: COLUMN, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ margin: 0, textAlign: "center", fontSize: "clamp(20px, 2.1vw, 25px)", lineHeight: 1.45, textWrap: "balance" }}>{LEDE}</p>
          </FadeIn>
          <div aria-hidden="true" style={{ margin: "clamp(36px, 6vh, 56px) auto 0", width: 120, borderTop: `1px solid ${RED}`, opacity: 0.6 }} />
        </div>
      </section>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} style={{ padding: "clamp(32px, 6vh, 64px) 0" }}>
          <div style={{ width: COLUMN, margin: "0 auto", fontSize: "clamp(17px, 1.3vw, 19px)", lineHeight: 1.6 }}>
            <FadeIn>
              <h2 style={{ margin: "0 0 16px", fontFamily: fellSC.style.fontFamily, fontWeight: 400, fontSize: "clamp(30px, 3vw, 40px)", lineHeight: 1.15, color: RED }}>
                {s.title}
              </h2>
            </FadeIn>
            {s.blocks.map((b, i) =>
              b.kind === "renders" ? null : (
                <FadeIn key={i}>
                  <BlockView b={b} />
                </FadeIn>
              ),
            )}
          </div>
          {s.blocks.some((b) => b.kind === "renders") ? (
            <div
              style={{
                width: WIDE,
                margin: "clamp(20px, 3vh, 32px) auto 0",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                gap: "clamp(10px, 1.6vw, 18px)",
              }}
            >
              {RENDERS.map((r, i) => (
                <FadeIn key={r.src}>
                  <Image
                    src={r.src}
                    alt={`Render ${i + 1} of the Mark of the Witch box and cards`}
                    width={r.w}
                    height={r.h}
                    sizes="(max-width: 700px) 100vw, 360px"
                    quality={82}
                    style={{ width: "100%", height: "auto", aspectRatio: "4 / 3", objectFit: "cover", display: "block", borderRadius: 4 }}
                  />
                </FadeIn>
              ))}
            </div>
          ) : null}
        </section>
      ))}

      <section style={{ padding: "clamp(32px, 6vh, 64px) 0 clamp(80px, 14vh, 160px)" }}>
        <div style={{ width: COLUMN, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ margin: "0 0 16px", fontFamily: fellSC.style.fontFamily, fontWeight: 400, fontSize: "clamp(24px, 2.4vw, 30px)", color: RED }}>The coven</h2>
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: "clamp(16px, 3vw, 32px)", rowGap: 8, fontSize: 16.5 }}>
              {TEAM.map((t) => (
                <div key={t.name} style={{ display: "contents" }}>
                  <dt style={{ fontFamily: fellSC.style.fontFamily }}>{t.name}</dt>
                  <dd style={{ margin: 0, fontStyle: "italic", color: "rgba(29, 26, 20, 0.75)" }}>{t.part}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
