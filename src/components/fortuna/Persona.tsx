import Image from "next/image";
import PanelRow from "./PanelRow";
import SlideIn from "./SlideIn";
import type { Persona as PersonaData } from "@/content/fortuna";

/**
 * The research persona: who Sarah is, then what she wants and what stops her.
 *
 * Server-rendered apart from the two panel rows. The portrait, the facts, the
 * bio and the goals never change, so none of them should cost the reader any
 * JavaScript; only the rows that respond to a pointer are client components.
 *
 * Three treatments for three kinds of content, deliberately. The goals are two
 * short phrases and are simply shown. The needs and frustrations are four
 * longer sentences each, and sixteen lines of someone else's research laid out
 * flat is a wall — as panels, they become four labels the reader chooses
 * between.
 */

/** Held small enough that the 375px source still covers a 2× screen. */
const PORTRAIT = "clamp(132px, 17vw, 186px)";

export default function Persona({ persona }: { persona: PersonaData }) {
  return (
    <div style={{ textAlign: "left", marginTop: "clamp(34px, 5vh, 62px)" }}>
      {/* Portrait and bio. The portrait leads on a phone and sits to the right
          on a desktop, which is the order the mockup sets and also the order
          the sentence runs: this is who she is, here is her face. */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap-reverse",
          gap: "clamp(20px, 3.5vw, 44px)",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <SlideIn>
            <h3
              style={{
                margin: "0 0 16px",
                // The sans, not the display face. This is a label on a
                // research artefact rather than a heading in the argument.
                fontFamily: "var(--f-body)",
                fontWeight: 500,
                fontSize: "clamp(21px, 2.4vw, 27px)",
                letterSpacing: "-0.03em",
              }}
            >
              {persona.name}
            </h3>
          </SlideIn>

          {persona.bio.map((para, i) => (
            <SlideIn key={para} delay={0.14 + i * 0.16}>
              <p
                style={{
                  margin: "0 0 14px",
                  maxWidth: "46ch",
                  fontFamily: "var(--f-body)",
                  fontSize: "var(--f-body-size)",
                  lineHeight: 1.7,
                  letterSpacing: "-0.02em",
                }}
              >
                {para}
              </p>
            </SlideIn>
          ))}
        </div>

        <SlideIn delay={0.06} from={34} style={{ flex: "0 0 auto" }}>
          <div
            style={{
              width: PORTRAIT,
              aspectRatio: "1",
              borderRadius: "50%",
              // The cream ring is what lifts her off the green; without it the
              // photograph's own edge is the only boundary and it reads as a
              // hole punched in the band.
              border: "6px solid var(--f-cream)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Image
              src={persona.portrait.src}
              alt={persona.portrait.alt}
              fill
              sizes="186px"
              style={{ objectFit: "cover" }}
            />
          </div>
        </SlideIn>
      </div>

      <Group title="Goals">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12,
          }}
        >
          {persona.goals.map((g) => (
            <p
              key={g}
              style={{
                margin: 0,
                background: "var(--f-cream)",
                color: "var(--f-forest-deep)",
                borderRadius: 16,
                padding: "22px 24px",
                fontFamily: "var(--f-body)",
                fontSize: "var(--f-body-size)",
                lineHeight: 1.55,
                letterSpacing: "-0.02em",
              }}
            >
              {g}
            </p>
          ))}
        </div>
      </Group>

      <Group title="Needs">
        <PanelRow items={persona.needs} ramp="--f-need" label="Needs" />
      </Group>

      <Group title="Frustrations">
        <PanelRow
          items={persona.frustrations}
          ramp="--f-frus"
          label="Frustrations"
        />
      </Group>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: "clamp(26px, 4vh, 44px)" }}>
      <h4
        style={{
          margin: "0 0 12px",
          fontFamily: "var(--f-grotesk)",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: 0.75,
        }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}
