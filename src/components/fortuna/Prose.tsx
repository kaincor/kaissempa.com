import type { CSSProperties, ReactNode } from "react";
import type { Block, Tone } from "@/content/fortuna";

/**
 * The Fortuna case study's typographic kit.
 *
 * Every size, weight, colour and measure here is transcribed from the text and
 * colour styles in Kai's Framer project rather than re-invented — Display 40/1.1
 * at -0.015em, Body 20/1.7 at -0.02em, the callout on Forest at 6% with a 14px
 * radius, and so on. Where Framer states a fixed px size this clamps it instead,
 * because the Framer page was only ever laid out at desktop width.
 */

const TONE_BG: Record<Tone, string> = {
  cream: "var(--f-cream)",
  "cream-deep": "var(--f-cream-deep)",
  card: "var(--f-card)",
  peach: "var(--f-peach)",
  forest: "var(--f-forest)",
};

/** Forest is the one dark band, so it flips the type colours with it. */
function toneIsDark(tone: Tone) {
  return tone === "forest";
}

export function Band({
  tone,
  children,
  id,
  style,
}: {
  tone: Tone;
  children: ReactNode;
  id?: string;
  style?: CSSProperties;
}) {
  const dark = toneIsDark(tone);
  return (
    <section
      id={id}
      style={{
        background: TONE_BG[tone],
        color: dark ? "var(--f-cream)" : "var(--f-forest)",
        padding: "clamp(56px, 9vh, 120px) 24px",
        ...style,
      }}
    >
      <div style={{ maxWidth: "var(--f-measure)", margin: "0 auto" }}>
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      style={{
        margin: "0 0 18px",
        fontFamily: "var(--f-grotesk)",
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1.4,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: dark ? "var(--f-green)" : "var(--f-orange)",
      }}
    >
      {children}
    </p>
  );
}

export function Display({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 28px",
        fontFamily: "var(--f-display)",
        fontWeight: 600,
        fontSize: "clamp(28px, 4.4vw, 40px)",
        lineHeight: 1.1,
        letterSpacing: "-0.015em",
        textWrap: "balance",
      }}
    >
      {children}
    </h2>
  );
}

export function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        margin: "48px 0 16px",
        fontFamily: "var(--f-serif)",
        fontWeight: 600,
        fontSize: "clamp(21px, 2.8vw, 27px)",
        lineHeight: 1.3,
        letterSpacing: "-0.04em",
      }}
    >
      {children}
    </h3>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 18px",
        maxWidth: "var(--f-measure-body)",
        fontFamily: "var(--f-body)",
        fontSize: "clamp(17px, 2vw, 20px)",
        lineHeight: 1.7,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </p>
  );
}

export function Quote({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      style={{
        margin: "36px 0",
        fontFamily: "var(--f-serif)",
        fontStyle: "italic",
        fontWeight: 500,
        fontSize: "clamp(20px, 2.7vw, 26px)",
        lineHeight: 1.5,
        letterSpacing: "-0.02em",
        textWrap: "balance",
        color: dark ? "var(--f-cream)" : "var(--f-forest)",
      }}
    >
      {children}
    </p>
  );
}

export function Callout({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        margin: "32px 0",
        // Forest at 6% on the light bands; on Forest itself that would vanish,
        // so it lifts instead of tints.
        background: dark ? "rgba(247, 245, 240, 0.08)" : "var(--f-callout)",
        borderRadius: 14,
        padding: "26px 38px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--f-body)",
          fontSize: "clamp(17px, 2vw, 20px)",
          lineHeight: 1.6,
          letterSpacing: "-0.02em",
        }}
      >
        {children}
      </p>
    </div>
  );
}

/** The four goals, and any other ordered run. Numbers sit in the margin. */
export function List({
  items,
  ordered,
  dark,
}: {
  items: string[];
  ordered?: boolean;
  dark?: boolean;
}) {
  return (
    <ol
      style={{
        listStyle: "none",
        margin: "0 0 18px",
        padding: 0,
        maxWidth: "var(--f-measure-body)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {items.map((item, i) => (
        <li
          key={item}
          style={{
            display: "grid",
            gridTemplateColumns: "28px 1fr",
            alignItems: "baseline",
            fontFamily: "var(--f-body)",
            fontSize: "clamp(17px, 2vw, 20px)",
            lineHeight: 1.6,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontFamily: "var(--f-grotesk)",
              fontWeight: 700,
              fontSize: 14,
              color: dark ? "var(--f-green)" : "var(--f-orange)",
            }}
          >
            {ordered ? `${i + 1}.` : "—"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** One numbered stage of the employer flow: title, arrow chain, prose. */
export function Step({
  n,
  title,
  flow,
  text,
  dark,
}: {
  n: number;
  title: string;
  flow?: string;
  text: string[];
  dark?: boolean;
}) {
  return (
    <div
      style={{
        margin: "40px 0",
        borderLeft: `2px solid ${dark ? "var(--f-green)" : "var(--f-orange)"}`,
        paddingLeft: "clamp(18px, 3vw, 30px)",
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          fontFamily: "var(--f-grotesk)",
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: dark ? "var(--f-green)" : "var(--f-orange)",
        }}
      >
        Step {n}
      </p>
      <h4
        style={{
          margin: "0 0 10px",
          fontFamily: "var(--f-serif)",
          fontWeight: 600,
          fontSize: "clamp(19px, 2.3vw, 22px)",
          lineHeight: 1.2,
          letterSpacing: "-0.04em",
        }}
      >
        {title}
      </h4>
      {flow ? (
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: "var(--f-grotesk)",
            fontWeight: 500,
            fontSize: "clamp(13px, 1.6vw, 15px)",
            lineHeight: 1.55,
            letterSpacing: "-0.01em",
            color: dark ? "rgba(247,245,240,0.72)" : "var(--f-muted)",
          }}
        >
          {flow}
        </p>
      ) : null}
      {text.map((t) => (
        <Body key={t}>{t}</Body>
      ))}
    </div>
  );
}

/**
 * A slot where a visual is going to live.
 *
 * Deliberately obvious. These stand in for the notes the doc leaves to itself —
 * "draw up framework", "show this visually" — and the point of showing them is
 * that the shape of the finished case study stays legible while it is written.
 * They should not survive to launch.
 */
export function Figure({ note, dark }: { note: string; dark?: boolean }) {
  return (
    <div
      role="note"
      style={{
        margin: "32px 0",
        border: `1px dashed ${dark ? "rgba(247,245,240,0.4)" : "var(--f-ring)"}`,
        borderRadius: 14,
        padding: "34px 28px",
        textAlign: "center",
        fontFamily: "var(--f-grotesk)",
        fontWeight: 500,
        fontSize: 14,
        letterSpacing: "-0.01em",
        color: dark ? "rgba(247,245,240,0.66)" : "var(--f-muted)",
      }}
    >
      {note}
    </div>
  );
}

export function renderBlock(block: Block, i: number, dark: boolean) {
  switch (block.kind) {
    case "text":
      return <Body key={i}>{block.text}</Body>;
    case "quote":
      return (
        <Quote key={i} dark={dark}>
          {block.text}
        </Quote>
      );
    case "callout":
      return (
        <Callout key={i} dark={dark}>
          {block.text}
        </Callout>
      );
    case "subheading":
      return <Subheading key={i}>{block.text}</Subheading>;
    case "list":
      return (
        <List key={i} items={block.items} ordered={block.ordered} dark={dark} />
      );
    case "step":
      return (
        <Step
          key={i}
          n={block.n}
          title={block.title}
          flow={block.flow}
          text={block.text}
          dark={dark}
        />
      );
    case "figure":
      return <Figure key={i} note={block.note} dark={dark} />;
  }
}

export { toneIsDark };
