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

/** Sampled from the source file rather than guessed. */
const SHEET = {
  strip: "#ffffff",
  ground: "#f2f2f2",
  ink: "#1f1f1f",
  quiet: "#4a4a4a",
};

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
        marginTop: "clamp(30px, 4.5vh, 56px)",
        borderRadius: 14,
        overflow: "hidden",
        background: SHEET.ground,
        color: SHEET.ink,
        textAlign: "left",
        fontFamily: "var(--f-body)",
        // Lifts the artefact off the band. It is a document sitting on the
        // page, not another panel of it.
        boxShadow: "0 18px 44px rgba(31, 43, 38, 0.16)",
      }}
    >
      <div
        style={{
          background: SHEET.strip,
          padding: "12px clamp(16px, 3vw, 28px)",
          fontFamily: "var(--f-grotesk)",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: SHEET.ink,
        }}
      >
        {persona.eyebrow}
      </div>

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
                      color: SHEET.quiet,
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
