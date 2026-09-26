"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import PersonaDecks from "./PersonaDecks";
import type { PersonaSheet } from "@/content/fortuna";

/**
 * The persona sheet from the research, rebuilt.
 *
 * Not the PNG. A screenshot of a deliverable is unreadable on a phone,
 * unselectable, invisible to search and impossible to animate; rebuilt, it is
 * all four and it reflows into the case study's measure instead of sitting in
 * it as a foreign object. The colours, the wording and the proportions are the
 * artefact's own — sampled from the file rather than matched by eye.
 *
 * It arrives a piece at a time. Everything on it is on the same clock, spaced
 * so the reader's eye is led across it in the order the sheet is meant to be
 * read: who she is, what her situation is, then what she wants and what stops
 * her.
 */

/**
 * The sheet has no fill any more — it is an outline on the green band, so
 * everything written on it has to work against the band rather than against a
 * grey ground. The old body grey measured 3.78:1 there; the band's own deep
 * forest is 5.11 and is what the rest of the section already uses.
 */
const SHEET = {
  stroke: "#f2f2f2",
  ink: "var(--f-forest-deep)",
};

/**
 * Where the outline gives out.
 *
 * It holds across the top and down both sides as far as the cards, then trails
 * away — so there is no bottom edge, and the frame reads as something the
 * cards are dealt out of rather than a box they are shut inside.
 */
const FRAME_FADE =
  "linear-gradient(to bottom, #000 0%, #000 44%, rgba(0,0,0,0.35) 72%, transparent 92%)";

/** Seconds between one piece of the sheet arriving and the next. */
const STEP = 0.09;

/** One piece of the sheet, arriving in its turn. */
function Rise({
  at,
  still,
  children,
}: {
  at: number;
  still: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.55,
        ease: [0.22, 0.61, 0.24, 1],
        delay: at * STEP,
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Persona({ persona }: { persona: PersonaSheet }) {
  const reduced = useReducedMotion();

  // One running counter, so the whole sheet shares a single arrival order
  // rather than each column restarting its own.
  let beat = 0;
  const next = () => beat++;
  const still = !!reduced;

  return (
    <div
      style={{
        position: "relative",
        marginTop: "clamp(30px, 4.5vh, 56px)",
        color: SHEET.ink,
        textAlign: "left",
        fontFamily: "var(--f-body)",
      }}
    >
      {/* The outline. Its own layer, because the mask that fades it out would
          otherwise take the contents of the sheet with it. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: `2px solid ${SHEET.stroke}`,
          borderRadius: 12,
          maskImage: FRAME_FADE,
          WebkitMaskImage: FRAME_FADE,
          pointerEvents: "none",
        }}
      />
      <div style={{ padding: "clamp(20px, 3.4vw, 34px)" }}>
        {/* Who she is, then her situation. Two columns where there is room for
            two — the sheet's own three do not survive a 620px measure, and the
            long situation note is the one that needs the width. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "clamp(18px, 3vw, 32px)",
            alignItems: "start",
          }}
        >
          <Rise at={next()} still={still}>
            <div
              style={{
                position: "relative",
                // As wide as the column it sits in, up to a cap. The cap is
                // what keeps the gutter: without it the portrait would grow
                // until the two halves touched and the sheet would stop
                // reading as two columns.
                width: "min(100%, 246px)",
                aspectRatio: "1",
                borderRadius: "50%",
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <Image
                src={persona.portrait.src}
                alt={persona.portrait.alt}
                fill
                sizes="246px"
                style={{ objectFit: "cover" }}
              />
            </div>

            <dl style={{ margin: 0, fontSize: 14, lineHeight: 1.75 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <dt style={{ fontWeight: 600 }}>Name:</dt>
                <dd style={{ margin: 0 }}>{persona.name}</dd>
              </div>
              {persona.facts.map((f) => (
                <div key={f.label} style={{ display: "flex", gap: 6 }}>
                  <dt style={{ fontWeight: 600 }}>{f.label}:</dt>
                  <dd style={{ margin: 0 }}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Rise>

          <div style={{ display: "grid", gap: "clamp(16px, 2.4vw, 24px)" }}>
            {persona.notes.map((n) => (
              <Rise key={n.title} at={next()} still={still}>
                <h4
                  style={{
                    margin: "0 0 6px",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {n.title}
                </h4>
                {n.body.map((para) => (
                  <p
                    key={para}
                    style={{
                      margin: "0 0 8px",
                      fontSize: 14,
                      lineHeight: 1.6,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {para}
                  </p>
                ))}
              </Rise>
            ))}
          </div>
        </div>

        <PersonaDecks columns={persona.columns} />
      </div>
    </div>
  );
}
