"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import FortunaWordmark from "./FortunaWordmark";
import type { Rich, Token } from "@/content/fortuna";

/**
 * The tinted pull-out, read into view a word at a time.
 *
 * Two movements that do different jobs. The box arrives on its own once it is
 * on screen — a fade and a short rise, so it announces itself as a thing. The
 * words inside are then tied to the scroll position rather than to a timer, so
 * the reader sets the pace and the sentence assembles under them as they come
 * down the page.
 *
 * Words are never hidden outright, only dimmed. A line that appears from
 * nothing reflows as it arrives; one that fades up from faint holds its shape,
 * so the box never changes size and nothing below it moves.
 */
const FLOOR = 0.16;
/** Share of the scroll window one word takes to come up, as a fraction. */
const OVERLAP = 0.22;

type Unit = {
  text?: string;
  wordmark?: boolean;
  tone?: string;
  /** Position among the visible words, or -1 for the gaps between them. */
  word: number;
};

/**
 * Flattens rich text into word-sized pieces, keeping each piece's tone and
 * numbering the ones that actually read as words.
 *
 * Whitespace is preserved as its own unit rather than trimmed away, because
 * the pieces are laid back out as inline spans and the spaces between them are
 * the only thing keeping the sentence apart.
 */
function toUnits(rich: Rich): { units: Unit[]; words: number } {
  const nodes: Token[] = typeof rich === "string" ? [rich] : rich;
  const units: Unit[] = [];
  let words = 0;
  const push = (u: Omit<Unit, "word">, counts: boolean) => {
    units.push({ ...u, word: counts ? words++ : -1 });
  };
  for (const node of nodes) {
    if (typeof node === "string") {
      for (const w of node.split(/(\s+)/)) {
        if (w) push({ text: w }, !!w.trim());
      }
    } else if ("wordmark" in node) {
      push({ wordmark: true }, true);
    } else {
      for (const w of node.text.split(/(\s+)/)) {
        if (w) push({ text: w, tone: node.tone }, !!w.trim());
      }
    }
  }
  return { units, words };
}

const TONE_COLOR: Record<string, string> = {
  orange: "var(--f-orange)",
  green: "var(--f-green)",
  brown: "var(--f-brown)",
};

function Word({
  unit,
  progress,
  start,
  end,
  reduced,
}: {
  unit: Unit;
  progress: MotionValue<number>;
  start: number;
  end: number;
  reduced: boolean;
}) {
  const opacity = useTransform(progress, [start, end], [FLOOR, 1], {
    clamp: true,
  });
  const style = {
    opacity: reduced ? 1 : opacity,
    color: unit.tone ? TONE_COLOR[unit.tone] : undefined,
    // Whitespace units have to keep their space or the sentence runs together.
    whiteSpace: "pre" as const,
  };
  return (
    <motion.span style={style}>
      {unit.wordmark ? <FortunaWordmark title="fortuna" /> : unit.text}
    </motion.span>
  );
}

export default function RevealCallout({
  text,
  align = "left",
}: {
  text: Rich;
  align?: "left" | "center";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { units, words } = toUnits(text);

  // Starts once the box is comfortably on screen and finishes before it leaves,
  // so the last word lands while the sentence is still being looked at.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.35"],
  });

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        margin: "32px 0",
        background: "var(--f-callout)",
        borderRadius: 14,
        padding: "26px 38px",
        willChange: "transform",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--f-body)",
          fontSize: "clamp(17px, 2vw, 20px)",
          lineHeight: 1.6,
          letterSpacing: "-0.02em",
          textAlign: align,
        }}
      >
        {units.map((unit, i) => {
          // Gaps inherit the position of the word before them, so a space
          // never lags behind the word it follows.
          const at =
            words > 1 ? Math.max(0, unit.word) / (words - 1) : 0;
          const start = Math.max(0, at * (1 - OVERLAP));
          return (
            <Word
              key={i}
              unit={unit}
              progress={scrollYProgress}
              start={start}
              end={Math.min(1, start + OVERLAP)}
              reduced={!!reduced}
            />
          );
        })}
      </p>
    </motion.div>
  );
}
