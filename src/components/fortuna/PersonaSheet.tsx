"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { PersonaSheet as Sheet } from "@/content/fortuna";

/**
 * Sarah's persona sheet, as Figma's "Persona - Job Seeker" frames have it.
 *
 * It starts as a sliver — the top of the sheet, running out into a
 * progressive blur — with a button in the corner whose arrows keep easing
 * outward, to say it opens. Opened, the sheet springs out to its full length
 * and the arrows turn to point inward; closing springs it back. Wider than
 * the text column, as the sheet is a document laid on the page rather than a
 * paragraph in it.
 */

const COLOURS = {
  sheet: "#f2f2f2",
  header: "#ffffff",
  ink: "#111111",
  label: "#3a3a3a",
  tone: { white: "#fefefe", amber: "#ffe1a6", rose: "#ffbbbb" },
  // The button: the case study's own forest, with its orange arrows.
  button: "var(--f-forest)",
  arrow: "var(--f-orange)",
};

/** How much of the sheet shows while it is closed, under its header. */
const SLIVER = "clamp(230px, 26vw, 360px)";

/** The bounce, open and closed. */
const SPRING = { type: "spring", stiffness: 150, damping: 15, mass: 1 } as const;

const text: CSSProperties = {
  margin: 0,
  fontFamily: "var(--f-body)",
  fontSize: "clamp(14px, 1.15vw, 16px)",
  lineHeight: 1.6,
  color: COLOURS.ink,
};

export default function PersonaSheet({ persona: p }: { persona: Sheet }) {
  const reduced = useReducedMotion();
  const id = useId();
  const [open, setOpen] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const sliver = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState({ closed: 0, full: 0 });

  // The sheet's two heights, measured: its whole length, and the sliver.
  useEffect(() => {
    const measure = () => {
      const h = header.current?.offsetHeight ?? 0;
      setHeights({ closed: h + (sliver.current?.offsetHeight ?? 0), full: h + (content.current?.offsetHeight ?? 0) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (content.current) ro.observe(content.current);
    if (sliver.current) ro.observe(sliver.current);
    return () => ro.disconnect();
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Closing from far down the sheet would leave the reader below it; bring
    // its top back into view as it folds up.
    if (!next && card.current) {
      const top = card.current.getBoundingClientRect().top;
      if (top < 0) window.scrollBy({ top: top - 110, behavior: reduced ? "auto" : "smooth" });
    }
  };

  // The card's height, sprung between the sliver and the whole sheet. Set
  // straight to the sliver on first measure; sprung from then on.
  const h = useMotionValue<number | string>(`calc(${SLIVER} + 70px)`);
  const first = useRef(true);
  useEffect(() => {
    if (!heights.full) return;
    const to = open ? heights.full : heights.closed;
    if (first.current || reduced) {
      first.current = false;
      h.set(to);
      return;
    }
    const c = animate(h, to, SPRING);
    return () => c.stop();
  }, [open, heights, reduced, h]);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "min(1180px, calc(100vw - 28px))",
        margin: "clamp(12px, 3vw, 32px) calc(50% - min(590px, 50vw - 14px))",
        textAlign: "left",
      }}
    >
      <motion.div
        ref={card}
        id={id}
        style={{
          height: h,
          position: "relative",
          overflow: "hidden",
          borderRadius: "clamp(16px, 2vw, 26px)",
          background: COLOURS.sheet,
          boxShadow: "0 30px 60px rgba(20, 40, 20, 0.16)",
        }}
      >
        <div
          ref={header}
          style={{
            background: COLOURS.header,
            padding: "clamp(20px, 2.4vw, 34px) clamp(20px, 3.5vw, 50px) clamp(14px, 1.6vw, 22px)",
            fontFamily: "var(--f-body)",
            fontSize: "clamp(12px, 1.1vw, 15px)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: COLOURS.label,
          }}
        >
          {p.label}
        </div>

        {/* The measure for the closed height: an empty block the sliver's size. */}
        <div ref={sliver} aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, width: 1, height: SLIVER, pointerEvents: "none" }} />

        <div ref={content}>
          <Contents p={p} />
        </div>

        {/* The progressive blur the sliver runs out into: blurs stacked in
            bands, each stronger and lower than the last. Only while closed. */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.35 }}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", pointerEvents: "none" }}
        >
          {!open &&
            [1, 3, 6, 11].map((b, i) => (
              <div
                key={b}
                style={{
                  position: "absolute",
                  inset: 0,
                  backdropFilter: `blur(${b}px)`,
                  WebkitBackdropFilter: `blur(${b}px)`,
                  maskImage: `linear-gradient(to bottom, transparent ${i * 20}%, #000 ${i * 20 + 30}%)`,
                  WebkitMaskImage: `linear-gradient(to bottom, transparent ${i * 20}%, #000 ${i * 20 + 30}%)`,
                }}
              />
            ))}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${COLOURS.sheet}cc 100%)` }} />
        </motion.div>

        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? "Collapse Sarah's persona sheet" : "Expand Sarah's persona sheet"}
          style={{
            position: "absolute",
            right: "clamp(14px, 1.8vw, 26px)",
            bottom: "clamp(14px, 1.8vw, 26px)",
            width: "clamp(50px, 5vw, 66px)",
            height: "clamp(50px, 5vw, 66px)",
            borderRadius: "clamp(12px, 1.3vw, 18px)",
            border: "none",
            background: COLOURS.button,
            boxShadow: "0 10px 24px rgba(20, 40, 20, 0.25)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <Arrows inward={open} still={!!reduced} />
        </button>
      </motion.div>
    </motion.div>
  );
}

/**
 * Four arrows to the corners. Closed, they point outward and keep easing a
 * little further out and back; open, they point inward and ease in.
 */
function Arrows({ inward, still }: { inward: boolean; still: boolean }) {
  // One arrow, toward the top-left corner of a 24 box; the others are it turned.
  const out = "M10 10 L4.5 4.5 M4.5 4.5 H9 M4.5 4.5 V9";
  // Inward, the heads stop short of the middle and are kept small, so the
  // four read as arrows meeting rather than a star.
  const inn = "M3.5 3.5 L8.8 8.8 M8.8 8.8 H5.6 M8.8 8.8 V5.6";
  const push = inward ? 1.6 : -1.6;
  return (
    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r} 12 12)`}>
          <motion.path
            d={inward ? inn : out}
            stroke={COLOURS.arrow}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={still ? undefined : { x: [0, push, 0], y: [0, push, 0] }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          />
        </g>
      ))}
    </svg>
  );
}

function Contents({ p }: { p: Sheet }) {
  const [situation, needs] = p.notes;
  return (
    <div style={{ padding: "clamp(24px, 4vw, 60px) clamp(20px, 3.5vw, 50px) clamp(90px, 9vw, 120px)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
          gap: "clamp(24px, 3.5vw, 56px)",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 2.5vw, 36px)" }}>
          <div style={{ position: "relative", width: "min(100%, 300px, max(55%, 170px))", aspectRatio: "1", borderRadius: "50%", overflow: "hidden" }}>
            <Image src={p.portrait.src} alt={p.portrait.alt} fill sizes="300px" style={{ objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: "clamp(0px, 1.5vw, 20px)" }}>
            {p.facts.map((f) => (
              <p key={f.label} style={{ ...text, fontSize: "clamp(15px, 1.4vw, 19px)" }}>
                <b style={{ fontWeight: 600 }}>{f.label}:</b> {f.value}
              </p>
            ))}
          </div>
        </div>
        <Note title={situation.title} body={situation.body} />
        <Note title={needs.title} body={needs.body} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
          gap: "clamp(20px, 3vw, 48px)",
          marginTop: "clamp(48px, 7vw, 110px)",
          alignItems: "start",
        }}
      >
        {p.columns.map((c) => (
          <div key={c.title} style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.6vw, 22px)" }}>
            <h4 style={{ ...text, fontSize: "clamp(17px, 1.6vw, 22px)", fontWeight: 600, textAlign: "center", marginBottom: "clamp(6px, 1.5vw, 24px)" }}>{c.title}</h4>
            {c.items.map((item) => (
              <div
                key={item}
                style={{
                  background: COLOURS.tone[c.tone],
                  borderRadius: 10,
                  padding: "clamp(20px, 2.4vw, 34px) clamp(20px, 2.6vw, 40px)",
                  minHeight: "clamp(110px, 11vw, 150px)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <p style={text}>{item}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string[] }) {
  return (
    <div>
      <p style={{ ...text, fontWeight: 600 }}>{title}</p>
      {body.map((line, i) => (line ? <p key={i} style={text}>{line}</p> : <div key={i} style={{ height: "1.6em" }} />))}
    </div>
  );
}
