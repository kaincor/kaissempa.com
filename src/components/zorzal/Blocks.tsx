import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import FadeIn from "@/components/fortuna/FadeIn";
import Parallax from "@/components/fortuna/Parallax";
import type { Block, Figure, Section, Tone } from "@/content/zorzal";
import { SIZES } from "@/content/zorzal-images";
import { Chart } from "./Charts";

/**
 * The Zorzal case study's kit: section bands, chapter titles, and the blocks
 * inside them. Colours come from Kai's Zorzal art — the wordmark's wine, the
 * landscape's deep teal and terracotta, the clouds' cream — and are defined
 * once in src/app/zorzal/theme.css.
 */

const TONE: Record<Tone, { bg: string; ink: string; muted: string; rule: string }> = {
  cream: { bg: "var(--z-cream)", ink: "var(--z-ink)", muted: "var(--z-muted)", rule: "var(--z-rule)" },
  sand: { bg: "var(--z-sand)", ink: "var(--z-ink)", muted: "var(--z-muted)", rule: "var(--z-rule)" },
  forest: { bg: "var(--z-forest)", ink: "var(--z-cream)", muted: "rgba(254, 252, 240, 0.72)", rule: "rgba(254, 252, 240, 0.22)" },
};

/** Running text: the measure, and the inline **bold** / *italic* markup. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} style={{ fontWeight: 600 }}>
            {p.slice(2, -2)}
          </strong>
        ) : p.startsWith("*") ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          p
        ),
      )}
    </>
  );
}

const MEASURE = "min(680px, 100% - 40px)";
const WIDE = "min(1040px, 100% - 28px)";

const body: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "clamp(16px, 1.25vw, 18px)",
  lineHeight: 1.72,
  letterSpacing: "-0.01em",
  margin: "0 0 1.15em",
};

/**
 * Scroll depth for the page below the hero, in pixels each way (see
 * fortuna/Parallax). Running text stays put so it reads steadily; the
 * pictures and pull quotes float a little against it, quotes most. Each
 * drift stays under the block's own top and bottom margin (28px at the
 * least) so nothing slides into its neighbour. Galleries drift per item
 * instead (GALLERY_DRIFT), which staggers phones and photos in depth.
 */
const DRIFT: Partial<Record<Block["t"], number>> = {
  img: 22,
  quote: 26,
  motion: 14,
  placeholder: 18,
  chart: 10,
};
const GALLERY_DRIFT = [14, 30, 20];

export function SectionBand({ section }: { section: Section }) {
  const tone = TONE[section.tone];
  return (
    <section
      id={section.id}
      style={{
        background: tone.bg,
        color: tone.ink,
        padding: "clamp(64px, 10vh, 120px) 0",
        ["--z-band-muted" as string]: tone.muted,
        ["--z-band-rule" as string]: tone.rule,
      }}
    >
      {section.part ? <Part>{section.part}</Part> : null}
      <FadeIn>
        <ChapterTitle icon={section.icon} dark={section.tone === "forest"}>
          {section.title}
        </ChapterTitle>
      </FadeIn>
      {section.blocks.map((b, i) => {
        const view = <BlockView block={b} dark={section.tone === "forest"} />;
        const drift = DRIFT[b.t];
        return <FadeIn key={i}>{drift ? <Parallax drift={drift}>{view}</Parallax> : view}</FadeIn>;
      })}
    </section>
  );
}

/** "Phase one", "Phase two": a quiet label over the section it opens. */
function Part({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        width: MEASURE,
        margin: "0 auto clamp(28px, 4vh, 44px)",
        fontFamily: "var(--font-grotesk)",
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        textAlign: "center",
        color: "var(--z-terracotta)",
      }}
    >
      {children}
    </p>
  );
}

/**
 * A chapter title with its icon to the left. The icon is a stand-in until
 * Kai's hand-drawn stamps arrive: the rough dark square with one coloured
 * dot from his drawings, with the animal named underneath.
 */
function ChapterTitle({ icon, dark, children }: { icon: string; dark: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        width: MEASURE,
        margin: "0 auto clamp(26px, 3.5vh, 38px)",
        display: "flex",
        alignItems: "center",
        gap: "clamp(14px, 2vw, 20px)",
      }}
    >
      <Parallax drift={9}>
        <IconStandIn label={icon} dark={dark} />
      </Parallax>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-captain), var(--font-serif)",
          fontWeight: 700,
          fontSize: "clamp(25px, 3.1vw, 36px)",
          lineHeight: 1.12,
          letterSpacing: "0.01em",
          textWrap: "balance",
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function IconStandIn({ label, dark }: { label: string; dark: boolean }) {
  return (
    <div
      title={`Chapter icon to come: ${label}`}
      aria-hidden="true"
      style={{
        flex: "0 0 auto",
        position: "relative",
        width: "clamp(46px, 5vw, 58px)",
        aspectRatio: "1",
        borderRadius: "22% 18% 24% 16%",
        background: dark ? "var(--z-cream)" : "var(--z-ink)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "16%",
          right: "16%",
          width: "18%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: "var(--z-terracotta)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-grotesk)",
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: "0.04em",
          lineHeight: 1.1,
          textAlign: "center",
          padding: "0 4px",
          color: dark ? "var(--z-ink)" : "var(--z-cream)",
          opacity: 0.7,
        }}
      >
        {label.split(",")[0]}
      </span>
    </div>
  );
}

function BlockView({ block: b, dark }: { block: Block; dark: boolean }) {
  switch (b.t) {
    case "p":
      return (
        <p
          style={{
            ...body,
            width: MEASURE,
            marginInline: "auto",
            ...(b.small ? { fontSize: 14, color: "var(--z-band-muted)", fontStyle: "italic" } : null),
          }}
        >
          <Rich text={b.text} />
        </p>
      );
    case "h3":
      return (
        <h3 style={{ width: MEASURE, margin: "1.6em auto 0.6em", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 22 }}>
          <Rich text={b.text} />
        </h3>
      );
    case "quote":
      return (
        <blockquote
          style={{
            width: MEASURE,
            margin: "clamp(28px, 5vh, 52px) auto",
            padding: "clamp(20px, 3vh, 30px) 0",
            borderTop: "1px solid var(--z-band-rule)",
            borderBottom: "1px solid var(--z-band-rule)",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(21px, 2.4vw, 27px)",
            lineHeight: 1.4,
            letterSpacing: "-0.015em",
            textAlign: "center",
            color: dark ? "var(--z-apricot)" : "var(--z-wine)",
          }}
        >
          <Rich text={b.text} />
        </blockquote>
      );
    case "list":
      return (
        <ul style={{ ...body, width: MEASURE, marginInline: "auto", paddingLeft: "1.2em" }}>
          {b.items.map((it) => (
            <li key={it} style={{ marginBottom: "0.4em" }}>
              <Rich text={it} />
            </li>
          ))}
        </ul>
      );
    case "img":
      return (
        <figure style={{ width: b.wide ? WIDE : MEASURE, margin: "clamp(28px, 5vh, 48px) auto" }}>
          <Shot fig={b} sizes={b.wide ? "(max-width: 1040px) 100vw, 1040px" : "680px"} />
          {b.caption ? <Caption>{b.caption}</Caption> : null}
        </figure>
      );
    case "gallery":
      return (
        <figure style={{ width: WIDE, margin: "clamp(28px, 5vh, 48px) auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(min(${b.items.some((i) => i.phone) ? 200 : 260}px, 100%), 1fr))`,
              // Rows sit further apart than columns: when the grid stacks on a
              // phone, neighbours drift by different amounts and need the room.
              gap: "48px clamp(14px, 2vw, 24px)",
              alignItems: "center",
            }}
          >
            {b.items.map((f, i) => (
              <Parallax key={f.src} drift={GALLERY_DRIFT[i % GALLERY_DRIFT.length]}>
                <Shot fig={f} sizes="(max-width: 700px) 100vw, 520px" />
                {f.caption ? <Caption>{f.caption}</Caption> : null}
              </Parallax>
            ))}
          </div>
          {b.caption ? <Caption>{b.caption}</Caption> : null}
        </figure>
      );
    case "motion":
      return (
        <div
          style={{
            width: WIDE,
            margin: "clamp(28px, 5vh, 48px) auto",
            minHeight: "clamp(180px, 24vw, 300px)",
            borderRadius: 18,
            border: "1.5px dashed var(--z-band-rule)",
            display: "grid",
            placeContent: "center",
            gap: 10,
            padding: "28px clamp(20px, 5vw, 64px)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-grotesk)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--z-terracotta)",
            }}
          >
            {b.label ?? "✱ Motion graphic"}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.55, color: "var(--z-band-muted)", maxWidth: 560 }}>
            {b.text}
          </span>
        </div>
      );
    case "chart":
      return <Chart kind={b.kind} caption={b.caption} dark={dark} />;
    case "placeholder":
      // A photo still to come: a plain white card with black text.
      return (
        <figure
          style={{
            width: MEASURE,
            margin: "clamp(28px, 5vh, 48px) auto",
            aspectRatio: b.aspect ?? "4 / 3",
            background: "#ffffff",
            color: "#000000",
            borderRadius: 12,
            boxShadow: "0 14px 34px rgba(40, 20, 10, 0.12)",
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 16,
          }}
        >
          {b.text}
        </figure>
      );
  }
}

function Shot({ fig, sizes }: { fig: Figure; sizes: string }) {
  if (fig.phone) return <Phone fig={fig} />;
  const [w, h] = SIZES[fig.src] ?? [1600, 1000];
  return (
    <Image
      src={fig.src}
      alt={fig.alt}
      width={w}
      height={h}
      sizes={sizes}
      style={{ width: "100%", height: "auto", borderRadius: 12, boxShadow: "0 18px 40px rgba(40, 20, 10, 0.14)" }}
    />
  );
}

/** A plain phone: dark bezel, rounded screen, the screenshot inside. */
function Phone({ fig }: { fig: Figure }) {
  return (
    <div
      style={{
        width: "min(100%, 260px)",
        margin: "0 auto",
        aspectRatio: "9 / 19.5",
        padding: "3.2%",
        borderRadius: "15% / 7%",
        background: "#1d1815",
        boxShadow: "0 22px 44px rgba(40, 20, 10, 0.22)",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "12% / 5.6%", overflow: "hidden", background: "#eee" }}>
        <Image src={fig.src} alt={fig.alt} fill sizes="260px" style={{ objectFit: "cover", objectPosition: "top" }} />
      </div>
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <figcaption
      style={{
        marginTop: 12,
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.5,
        textAlign: "center",
        color: "var(--z-band-muted)",
      }}
    >
      {children}
    </figcaption>
  );
}
