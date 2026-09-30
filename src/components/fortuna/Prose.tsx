import type { CSSProperties, ReactNode } from "react";
import FortunaWordmark from "./FortunaWordmark";
import BillboardCallout from "./BillboardCallout";
import { ScrollFillLine } from "./FillText";
import FadeIn from "./FadeIn";
import MiamiGlobe from "./MiamiGlobe";
import BandRise from "./BandRise";
import GoalList from "./GoalList";
import Persona from "./Persona";
import Reel from "./reel/Reel";
import NightSky from "./NightSky";
import { hasFill } from "@/content/fortuna";
import type { Align, Block, Rich, Token, Tone } from "@/content/fortuna";

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
  forest: "var(--f-forest)",
  green: "var(--f-green)",
};

/**
 * Running type per band.
 *
 * Green is why this is a table rather than a light/dark flag. It is neither:
 * cream on it is 2.15:1 and the page's own ink is 2.64:1, so it needs a colour
 * that appears nowhere else — forest taken deep enough to clear AA.
 */
const TONE_INK: Record<Tone, string> = {
  cream: "var(--f-ink)",
  "cream-deep": "var(--f-ink)",
  card: "var(--f-ink)",
  forest: "var(--f-cream)",
  green: "var(--f-forest-deep)",
};

/**
 * The accent: list numerals, the "needs a title" tag. Orange carries it on
 * cream and green carries it on forest, but on a green band both vanish, so
 * there the numerals simply join the running type.
 */
const TONE_ACCENT: Record<Tone, string> = {
  cream: "var(--f-orange)",
  "cream-deep": "var(--f-orange)",
  card: "var(--f-orange)",
  forest: "var(--f-green)",
  green: "var(--f-forest-deep)",
};

/**
 * Moving a block within its column, as opposed to the text within the block.
 * A paragraph is narrower than the column, so `text-align` alone leaves the
 * box itself sitting on the left whatever the words inside it are doing.
 */
function blockAlign(align: Align) {
  if (align === "center") return { marginInline: "auto" };
  if (align === "right") return { marginLeft: "auto", marginRight: 0 };
  return null;
}

/**
 * How far the star field hangs past the band's top edge.
 *
 * Far enough to carry on behind the heading and the line under it, and to run
 * out in the gap before the numbered goals start. Measured on the rendered
 * page rather than guessed: the intro line's baseline sits about 120px below
 * the band's top and the list begins about 50px after that.
 */
const SKY_DROP = "100%";

/** Forest is the one band dark enough to flip a component's whole treatment. */
function toneIsDark(tone: Tone) {
  return tone === "forest";
}

const TONE_COLOR: Record<string, string> = {
  orange: "var(--f-orange)",
  green: "var(--f-green)",
  brown: "var(--f-brown)",
  cream: "var(--f-cream)",
};

/**
 * Renders a run of inline tokens.
 *
 * "dim" is opacity rather than a lighter colour on purpose: it has to sit back
 * from whatever it is inside without leaving the palette, and half strength of
 * the running colour does that at any tone.
 */
/**
 * Colour and slant for one run. Shared so the plain renderer and the filling
 * one cannot disagree about what a token looks like.
 */
export function runStyle(node: {
  tone?: string;
  italic?: boolean;
}): CSSProperties {
  return {
    ...(node.tone === "dim"
      ? { opacity: 0.5 }
      : node.tone
        ? { color: TONE_COLOR[node.tone] }
        : null),
    ...(node.italic ? { fontStyle: "italic" } : null),
  };
}

export function Inline({ nodes }: { nodes: Rich }) {
  if (typeof nodes === "string") return <>{nodes}</>;
  return (
    <>
      {nodes.map((node: Token, i) => {
        if (typeof node === "string") return <span key={i}>{node}</span>;
        if ("wordmark" in node)
          return (
            <FortunaWordmark
              key={i}
              dot={node.dot}
              color={node.tone ? `var(--f-${node.tone})` : undefined}
              title="fortuna"
            />
          );
        if ("br" in node) return <br key={i} />;
        return (
          <span key={i} style={runStyle(node)}>
            {node.text}
          </span>
        );
      })}
    </>
  );
}

export function Band({
  tone,
  children,
  id,
  rise,
  sky,
  full,
  tight,
  ink,
  style,
}: {
  tone: Tone;
  children: ReactNode;
  id?: string;
  /** Sweep this colour up over the band above instead of butting against it. */
  rise?: boolean;
  /** Put a star field in the swept colour. Only meaningful alongside `rise`. */
  sky?: boolean;
  /** Hold the whole screen, with the content centred in it. */
  full?: boolean;
  /** Close the band right up around its content. */
  tight?: boolean;
  /** Override the band's running text colour. Numerals follow it. */
  ink?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      id={id}
      style={{
        // The riser hangs off the top edge, so the band has to be its origin.
        position: "relative",
        // And its own stacking context. The column below is lifted above the
        // riser, and without this that z-index is measured against the whole
        // page rather than against this band — which put the globe, sitting in
        // a lifted column two sections up, on top of the green sweeping over
        // it. Isolating each band keeps those z-indexes local.
        isolation: "isolate",
        background: TONE_BG[tone],
        color: ink ?? TONE_INK[tone],
        // An overridden ink takes the numerals with it: an accent chosen to
        // sit against the default text colour has no reason to work against
        // a different one.
        ["--f-accent" as string]: ink ?? TONE_ACCENT[tone],
        // Asymmetric when tight: close at the top so the heading sits high in
        // the band, open at the bottom so the next section is not crowded.
        padding: tight
          ? "clamp(17px, 2.4vh, 31px) 0 clamp(76px, 11vh, 150px)"
          : "clamp(56px, 9vh, 120px) 0",
        // `svh`, not `vh`: on a phone `vh` is the tallest the viewport ever
        // gets, so a 100vh band is cut off by the address bar until the reader
        // scrolls it away.
        ...(full
          ? {
              minHeight: "100svh",
              display: "flex",
              alignItems: "center",
            }
          : null),
        ...style,
      }}
    >
      {rise ? (
        <BandRise color={TONE_BG[tone]} drop={sky ? SKY_DROP : "1px"}>
          {sky ? <NightSky /> : null}
        </BandRise>
      ) : null}
      {/* The column carries the boundary rather than padding on the band, so
          the margin scales with the viewport instead of sitting at one value.
          The 28px subtraction is only a floor for very narrow screens, where
          the measure's own minimum would otherwise be wider than the glass. */}
      <div
        style={{
          width: "min(var(--f-measure), 100% - 28px)",
          margin: "0 auto",
          // Above the riser. An absolutely positioned block paints over static
          // in-flow content in the same stacking context, so once the tongue
          // hangs down over the band it would otherwise cover the words.
          position: "relative",
          zIndex: 1,
        }}
      >
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

export function Display({
  children,
  align = "left",
  color,
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
  color?: string;
}) {
  return (
    <h2
      style={{
        margin: "0 0 28px",
        textAlign: align,
        color,
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

export function Subheading({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <h3
      style={{
        margin: "48px 0 16px",
        textAlign: align,
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

/**
 * A short centred rule. Two of these bracket a line that has to sit apart from
 * the argument around it — the mark a printed page uses for the same job,
 * rather than a box, which would make it a component instead of a pause.
 */
function Rule() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 84,
        height: 1,
        margin: "0 auto",
        background: "currentColor",
        opacity: 0.28,
      }}
    />
  );
}

export function Body({
  children,
  align = "left",
  rules = false,
}: {
  children: ReactNode;
  align?: Align;
  rules?: boolean;
}) {
  if (rules) {
    return (
      <div style={{ margin: "clamp(46px, 7vh, 82px) 0" }}>
        <Rule />
        <p
          style={{
            margin: "clamp(22px, 3.2vh, 34px) auto",
            maxWidth: "var(--f-measure-body)",
            textAlign: "center",
            fontFamily: "var(--f-body)",
            fontSize: "var(--f-body-size)",
            lineHeight: 1.7,
            letterSpacing: "-0.02em",
          }}
        >
          {children}
        </p>
        <Rule />
      </div>
    );
  }

  return (
    <p
      style={{
        margin: "0 0 18px",
        maxWidth: "var(--f-measure-body)",
        // Aligning the text is not enough — the paragraph is narrower than
        // the column it sits in, so the box has to move as well.
        ...blockAlign(align),
        textAlign: align,
        fontFamily: "var(--f-body)",
        fontSize: "var(--f-body-size)",
        lineHeight: 1.7,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </p>
  );
}

export function Quote({
  children,
  dark,
  align = "left",
  color,
  rules = false,
}: {
  children: ReactNode;
  dark?: boolean;
  align?: Align;
  color?: string;
  rules?: boolean;
}) {
  // The same rules a ruled finding gets. Its own margin rather than the
  // quote's, so the space belongs to the rules and the quote keeps sitting
  // the distance it always did from the line above it.
  if (rules) {
    return (
      <div style={{ margin: "clamp(46px, 7vh, 82px) 0" }}>
        <Rule />
        <Quote dark={dark} align={align} color={color}>
          {children}
        </Quote>
        <Rule />
      </div>
    );
  }

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
        textAlign: align,
        // Inherits the band's ink unless a tone is named; neither the cream
        // nor the page ink is right on green.
        color: color ?? (dark ? "var(--f-cream)" : undefined),
      }}
    >
      {children}
    </p>
  );
}

export function Callout({
  children,
  dark,
  align = "left",
}: {
  children: ReactNode;
  dark?: boolean;
  align?: Align;
}) {
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
          fontSize: "var(--f-body-size)",
          lineHeight: 1.6,
          letterSpacing: "-0.02em",
          textAlign: align,
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
  align = "left",
}: {
  items: string[];
  ordered?: boolean;
  align?: "left" | "center" | "right";
}) {
  return (
    <ol
      style={{
        listStyle: "none",
        margin: "0 0 18px",
        padding: 0,
        // Centring a block that already fills the column moves nothing, so a
        // centred list shrinks to its longest row first. The rows themselves
        // stay left: the numerals sit in a gutter, and centring each one would
        // leave the digits ragged.
        maxWidth: "var(--f-measure-body)",
        ...(align === "left" ? null : { width: "fit-content", ...blockAlign(align) }),
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
            fontSize: "var(--f-body-size)",
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
              color: "var(--f-accent)",
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

/**
 * How long the billboard waits per place in its section.
 *
 * Only the billboard still counts places. Everything else arrives on the
 * page's shared queue in FadeIn; the billboard has its own stand-up and waits
 * for the heading and paragraph above it, because it is the loudest thing in
 * its section and should not be what the eye catches on the way in.
 */
const STEP = 0.34;

/**
 * Blocks that bring their own entrance, and so are left out of the page's.
 *
 * The globe has its rise and pin, the persona its dealt cards, the goals their
 * fade, the billboard its stand-up. Wrapping any of them in a fade as well
 * would give the reader two entrances for one object.
 */
function ownsEntrance(block: Block) {
  return (
    block.kind === "globe" ||
    block.kind === "persona" ||
    block.kind === "reveal" ||
    (block.kind === "list" && block.emphasis === true) ||
    (block.kind === "callout" && block.reveal === true)
  );
}

export function renderBlock(
  block: Block,
  i: number,
  dark: boolean,
  align: Align = "left",
  reveal = false,
  /** Position in the section's arrival order, heading included. */
  order = 0,
) {
  const node = blockNode(block, i, dark, align, order);
  // Everything else arrives on the page's shared queue: on its own when it
  // reaches the screen, a beat behind anything that reached it at the same
  // moment. See FadeIn.
  return reveal && !ownsEntrance(block) ? <FadeIn key={i}>{node}</FadeIn> : node;
}

function blockNode(
  block: Block,
  i: number,
  dark: boolean,
  align: Align,
  order: number,
) {
  switch (block.kind) {
    case "text":
      return (
        <Body key={i} align={align} rules={block.rules}>
          {hasFill(block.text) ? (
            <ScrollFillLine nodes={block.text} />
          ) : (
            <Inline nodes={block.text} />
          )}
        </Body>
      );
    case "quote":
      return (
        <Quote
          key={i}
          dark={dark}
          align={align}
          rules={block.rules}
          color={block.tone ? `var(--f-${block.tone})` : undefined}
        >
          <Inline nodes={block.text} />
        </Quote>
      );
    case "callout":
      // The revealing one is a client component; the plain one stays static so
      // a page full of pull-outs does not become a page full of scroll
      // listeners. Reveal is opt-in per callout.
      return block.reveal ? (
        <BillboardCallout
          key={i}
          text={block.text}
          align={align}
          delay={order * STEP}
        />
      ) : (
        <Callout key={i} dark={dark} align={align}>
          <Inline nodes={block.text} />
        </Callout>
      );
    case "subheading":
      return (
        <Subheading key={i} align={align}>
          {block.text}
        </Subheading>
      );
    case "list":
      return block.emphasis ? (
        <GoalList key={i} items={block.items} align={block.align ?? align} />
      ) : (
        <List
          key={i}
          items={block.items}
          ordered={block.ordered}
          align={block.align ?? align}
        />
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
    case "globe":
      return <MiamiGlobe key={i} caption={block.caption} />;
    case "persona":
      return <Persona key={i} persona={block.persona} />;
    case "reveal":
      return <Reel key={i} />;
  }
}

export { toneIsDark };
