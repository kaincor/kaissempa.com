"use client";

import { motion } from "motion/react";
import FortunaWordmark from "./FortunaWordmark";
import type { Rich, Token } from "@/content/fortuna";

/**
 * Inline runs that can flood with colour on cue.
 *
 * The same thing Prose's `Inline` does, plus the `fill` token. It lives apart
 * from both callers because two places now need it — the billboard, when it
 * finishes standing up, and the globe's caption, when the pin lands — and a
 * second copy is how the two quietly drift apart.
 */

const TONE_COLOR: Record<string, string> = {
  orange: "var(--f-orange)",
  green: "var(--f-green)",
  brown: "var(--f-brown)",
};

/**
 * A word that starts the colour of the sentence and is then flooded with its
 * own, left to right.
 *
 * Two copies of the same word stacked exactly, the coloured one revealed by a
 * clip. Animating the colour itself would cross-fade the whole word at once;
 * clipping makes it fill, which is what reads as ink arriving.
 */
export function FillWord({
  text,
  color,
  go,
  duration = 0.75,
}: {
  text: string;
  color: string;
  go: boolean;
  duration?: number;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {text}
      <motion.span
        aria-hidden="true"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={go ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration, ease: [0.33, 0, 0.2, 1] }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color,
          // `pre-wrap`, not `pre`: the overlay has to break at exactly the same
          // places as the text underneath it, and `pre` refuses to wrap at all.
          whiteSpace: "pre-wrap",
          pointerEvents: "none",
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export default function FillInline({
  nodes,
  filled,
  fillDuration,
}: {
  nodes: Rich;
  filled: boolean;
  fillDuration?: number;
}) {
  if (typeof nodes === "string") return <>{nodes}</>;
  return (
    <>
      {nodes.map((node: Token, i) => {
        if (typeof node === "string") return <span key={i}>{node}</span>;
        if ("wordmark" in node)
          return <FortunaWordmark key={i} dot={node.dot} title="fortuna" />;
        if (node.fill)
          return (
            <FillWord
              key={i}
              text={node.text}
              color={TONE_COLOR[node.tone] ?? "var(--f-orange)"}
              go={filled}
              duration={fillDuration}
            />
          );
        return (
          <span
            key={i}
            style={
              node.tone === "dim"
                ? { opacity: 0.5 }
                : { color: TONE_COLOR[node.tone] }
            }
          >
            {node.text}
          </span>
        );
      })}
    </>
  );
}

/**
 * A whole clause that floods with colour, rather than a single word.
 *
 * `FillWord` stacks its coloured copy on the word itself as an inline-block,
 * which is fine for one word and wrong for a sentence: the copy is laid out in
 * its own box, so it breaks at different places than the line underneath it
 * and the two drift apart — measured on the globe's caption, the overlay wrapped
 * a line earlier and printed "2022." across the middle of the sentence.
 *
 * So the overlay is the whole line instead. Same width, same alignment, same
 * text, so it wraps identically by construction; everything that is not being
 * filled is painted invisible, and the clip travels across the lot.
 */
export function FillLine({
  nodes,
  filled,
  duration = 0.9,
}: {
  nodes: Rich;
  filled: boolean;
  duration?: number;
}) {
  return (
    <span style={{ position: "relative", display: "block" }}>
      <Run nodes={nodes} ghost={false} />
      <motion.span
        aria-hidden="true"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={filled ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration, ease: [0.33, 0, 0.2, 1] }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <Run nodes={nodes} ghost />
      </motion.span>
    </span>
  );
}

/**
 * One pass of the tokens. `ghost` is the overlay: it has to occupy exactly the
 * same space as the real line — so the wordmark is hidden rather than removed,
 * and plain text is made transparent rather than dropped — while the filled
 * runs are the only thing that actually paints.
 */
function Run({ nodes, ghost }: { nodes: Rich; ghost: boolean }) {
  if (typeof nodes === "string")
    return <span style={ghost ? { color: "transparent" } : undefined}>{nodes}</span>;
  return (
    <>
      {nodes.map((node: Token, i) => {
        if (typeof node === "string")
          return (
            <span key={i} style={ghost ? { color: "transparent" } : undefined}>
              {node}
            </span>
          );
        if ("wordmark" in node)
          return (
            <span key={i} style={ghost ? { visibility: "hidden" } : undefined}>
              <FortunaWordmark dot={node.dot} title={ghost ? undefined : "fortuna"} />
            </span>
          );
        if (node.fill)
          return (
            <span
              key={i}
              style={{
                color: ghost
                  ? (TONE_COLOR[node.tone] ?? "var(--f-orange)")
                  : "inherit",
              }}
            >
              {node.text}
            </span>
          );
        return (
          <span
            key={i}
            style={
              ghost
                ? { color: "transparent" }
                : node.tone === "dim"
                  ? { opacity: 0.5 }
                  : { color: TONE_COLOR[node.tone] }
            }
          >
            {node.text}
          </span>
        );
      })}
    </>
  );
}
