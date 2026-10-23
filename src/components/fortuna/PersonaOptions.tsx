"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import type { PersonaSheet } from "@/content/fortuna";

/**
 * Three ways to lay out Sarah's persona sheet, for Kai to choose between.
 * The words are the sheet's own and are not touched; only the layout, the
 * order and the picture change — the photograph gives way to the flat
 * illustration from the Figma file, which can run larger than the text
 * column.
 *
 * All three sit on the green band the section already uses, where the
 * illustration's pale trousers still read.
 */

const ILLUSTRATION = { src: "/images/sarah-illustration.webp", w: 1232, h: 1690 };
const INK = "var(--f-forest-deep)";
const CREAM = "#f7f5f0";

/** Each column's own tint on the sheet, kept from the original. */
const TONE = { white: "#ebe9e4", amber: "#c6c6c6", rose: "#999999" } as const;

/** One gentle rise for everything; nothing staged, nothing dealt. */
function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Sarah({ style, sizes }: { style?: CSSProperties; sizes: string }) {
  return (
    <div style={{ position: "relative", aspectRatio: `${ILLUSTRATION.w} / ${ILLUSTRATION.h}`, ...style }}>
      <Image src={ILLUSTRATION.src} alt="Sarah, the job seeker persona" fill sizes={sizes} style={{ objectFit: "contain" }} />
    </div>
  );
}

const h = (size: string): CSSProperties => ({
  margin: 0,
  fontFamily: "var(--f-display)",
  fontWeight: 600,
  fontSize: size,
  lineHeight: 1.15,
  letterSpacing: "-0.01em",
  color: INK,
});

const body: CSSProperties = {
  margin: 0,
  fontFamily: "var(--f-body)",
  fontSize: "var(--f-body-size)",
  lineHeight: 1.55,
  color: INK,
};

function Situation({ p, size = "clamp(20px, 2.2vw, 26px)" }: { p: PersonaSheet; size?: string }) {
  const note = p.notes[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={h(size)}>{note.title}</h3>
      {note.body.map((t) => (
        <p key={t} style={body}>
          {t}
        </p>
      ))}
    </div>
  );
}

function Items({ items, marker = "—" }: { items: string[]; marker?: string }) {
  return (
    <ul style={{ ...body, listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((t) =>
        marker ? (
          <li key={t} style={{ display: "grid", gridTemplateColumns: "1.1em 1fr", gap: 6 }}>
            <span aria-hidden="true" style={{ opacity: 0.6 }}>
              {marker}
            </span>
            <span>{t}</span>
          </li>
        ) : (
          <li key={t}>{t}</li>
        ),
      )}
    </ul>
  );
}

/**
 * A · Editorial. Sarah large and to one side, bleeding past the text column
 * and off the edge of the screen; her situation beside her; then goals,
 * needs and frustrations as three plain columns under a rule. No cards — it
 * reads like a magazine profile.
 */
export function PersonaEditorial({ p }: { p: PersonaSheet }) {
  return (
    <div style={{ width: "min(1180px, 100vw)", marginInline: "calc(50% - min(590px, 50vw))", display: "flex", flexDirection: "column", gap: "clamp(32px, 5vw, 64px)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "clamp(24px, 5vw, 72px)" }}>
        <Rise style={{ flex: "1 1 340px", marginLeft: "clamp(-120px, -6vw, 0px)" }}>
          <Sarah sizes="(max-width: 700px) 90vw, 560px" style={{ width: "100%", maxWidth: 560 }} />
        </Rise>
        <Rise delay={0.12} style={{ flex: "1 1 360px", padding: "0 20px", textAlign: "left" }}>
          <Situation p={p} size="clamp(24px, 2.8vw, 34px)" />
        </Rise>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "clamp(24px, 4vw, 48px)", padding: "0 20px", textAlign: "left" }}>
        {p.columns.map((c, i) => (
          <Rise key={c.title} delay={0.1 * i} style={{ borderTop: `2px solid ${INK}`, paddingTop: 16 }}>
            <h3 style={{ ...h("clamp(18px, 1.8vw, 22px)"), marginBottom: 14 }}>{c.title}</h3>
            <Items items={c.items} />
          </Rise>
        ))}
      </div>
    </div>
  );
}

/**
 * B · Persona card. The sheet as a real document, made larger: one wide
 * cream card, Sarah in a panel down its left side, her situation to the
 * right, and goals, needs and frustrations along the bottom, each topped
 * with the tint it had on the original sheet.
 */
export function PersonaCard({ p }: { p: PersonaSheet }) {
  return (
    <Rise style={{ width: "min(1120px, calc(100vw - 28px))", marginInline: "calc(50% - min(560px, 50vw - 14px))" }}>
      <div style={{ background: CREAM, borderRadius: 24, padding: "clamp(18px, 3vw, 36px)", boxShadow: "0 30px 60px rgba(20, 40, 20, 0.18)", textAlign: "left" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(20px, 3vw, 40px)" }}>
          <div style={{ flex: "0 1 300px", minWidth: 220, background: "#e5e5e5", borderRadius: 16, padding: "24px 20px 0", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <Sarah sizes="300px" style={{ width: "100%", maxWidth: 260 }} />
          </div>
          <div style={{ flex: "1 1 360px", alignSelf: "center" }}>
            <Situation p={p} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "clamp(14px, 2vw, 22px)", marginTop: "clamp(20px, 3vw, 36px)" }}>
          {p.columns.map((c) => (
            <div key={c.title} style={{ background: "#fff", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ height: 8, background: TONE[c.tone] }} />
              <div style={{ padding: "16px 18px 18px" }}>
                <h3 style={{ ...h("18px"), marginBottom: 12 }}>{c.title}</h3>
                <Items items={c.items} marker="•" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Rise>
  );
}

/**
 * C · Annotated. Sarah standing tall in the middle, with what she wants on
 * one side of her and what she needs on the other, and what stops her
 * written along the bottom — the sheet read as notes about a person rather
 * than a form. Her situation leads in above. Stacks on a phone.
 */
export function PersonaAnnotated({ p }: { p: PersonaSheet }) {
  const [goals, needs, frustrations] = p.columns;
  const note = (c: PersonaSheet["columns"][number], align: "left" | "right") => (
    <div style={{ textAlign: align }}>
      <h3 style={{ ...h("clamp(18px, 1.8vw, 22px)"), marginBottom: 12 }}>
        {align === "right" ? null : <span aria-hidden="true" style={{ display: "inline-block", width: 28, height: 2, background: INK, verticalAlign: "middle", marginRight: 10 }} />}
        {c.title}
        {align === "right" ? <span aria-hidden="true" style={{ display: "inline-block", width: 28, height: 2, background: INK, verticalAlign: "middle", marginLeft: 10 }} /> : null}
      </h3>
      <Items items={c.items} marker={align === "right" ? "" : "—"} />
    </div>
  );
  return (
    <div style={{ width: "min(1180px, 100vw - 28px)", marginInline: "calc(50% - min(590px, 50vw - 14px))", display: "flex", flexDirection: "column", gap: "clamp(28px, 4vw, 48px)" }}>
      <Rise style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <Situation p={p} />
      </Rise>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", alignItems: "center", gap: "clamp(20px, 3vw, 40px)" }}>
        <Rise delay={0.1}>{note(goals, "right")}</Rise>
        <Rise delay={0.05} style={{ display: "flex", justifyContent: "center" }}>
          <Sarah sizes="(max-width: 700px) 70vw, 420px" style={{ width: "100%", maxWidth: 420 }} />
        </Rise>
        <Rise delay={0.15}>{note(needs, "left")}</Rise>
      </div>
      <Rise delay={0.2} style={{ maxWidth: 820, margin: "0 auto", width: "100%", textAlign: "left" }}>
        <div style={{ borderTop: `2px solid ${INK}`, paddingTop: 16 }}>
          <h3 style={{ ...h("clamp(18px, 1.8vw, 22px)"), marginBottom: 14 }}>{frustrations.title}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", columnGap: 40 }}>
            <Items items={frustrations.items.slice(0, 2)} />
            <Items items={frustrations.items.slice(2)} />
          </div>
        </div>
      </Rise>
    </div>
  );
}
