"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
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
  cream: "var(--f-cream)",
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
          return (
            <FortunaWordmark
              key={i}
              dot={node.dot}
              color={node.tone ? `var(--f-${node.tone})` : undefined}
              title="fortuna"
            />
          );
        if ("br" in node) return <br key={i} />;
        const slant = node.italic ? { fontStyle: "italic" as const } : null;
        if (node.fill)
          return (
            <FillWord
              key={i}
              text={node.text}
              color={TONE_COLOR[node.tone ?? ""] ?? "var(--f-orange)"}
              go={filled}
              duration={fillDuration}
            />
          );
        return (
          <span
            key={i}
            style={{
              ...slant,
              ...(node.tone === "dim"
                ? { opacity: 0.5 }
                : node.tone
                  ? { color: TONE_COLOR[node.tone] }
                  : null),
            }}
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
  // A line with nothing to fill does not need a second copy of itself sitting
  // invisibly on top of it. Callers reach for this component for the effect;
  // when the manuscript drops the `fill` token it should cost nothing.
  const fillable =
    typeof nodes !== "string" &&
    nodes.some((n) => typeof n !== "string" && "fill" in n && n.fill);
  if (!fillable) return <Run nodes={nodes} ghost={false} />;

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
              <FortunaWordmark
                dot={node.dot}
                color={node.tone ? `var(--f-${node.tone})` : undefined}
                title={ghost ? undefined : "fortuna"}
              />
            </span>
          );
        // A break has to happen in both passes or the overlay stops lining up
        // with the line underneath it from that point on.
        if ("br" in node) return <br key={i} />;
        const slant = node.italic ? { fontStyle: "italic" as const } : null;
        if (node.fill)
          return (
            <span
              key={i}
              style={{
                ...slant,
                color: ghost
                  ? (TONE_COLOR[node.tone ?? ""] ?? "var(--f-orange)")
                  : "inherit",
              }}
            >
              {node.text}
            </span>
          );
        return (
          <span
            key={i}
            style={{
              ...slant,
              ...(ghost
                ? { color: "transparent" }
                : node.tone === "dim"
                  ? { opacity: 0.5 }
                  : node.tone
                    ? { color: TONE_COLOR[node.tone] }
                    : null),
            }}
          >
            {node.text}
          </span>
        );
      })}
    </>
  );
}

/**
 * A run that fills word by word, in reading order, scrubbed by the scroll.
 *
 * The first version of this clipped the whole paragraph with one rectangle
 * travelling left to right. That is correct only when the filled run starts
 * at the paragraph's left edge, which this one does not: it begins mid-line
 * after "but rather" and carries over onto the next line. A single vertical
 * edge sweeping the block reaches the *second* line's opening words — which
 * sit hard against the left margin — long before it reaches the first line's
 * fragment, so the run lit up from its middle outwards.
 *
 * So the sweep is handed to the words themselves. Each takes a slice of the
 * progress in the order it is read, which is the one order a line break
 * cannot disturb, and fills across its own width inside that slice. The
 * result still reads as one continuous front travelling through the
 * sentence, and it starts on the first word and ends on the last wherever
 * those happen to fall.
 *
 * Slices are weighted by how many characters a word carries rather than by
 * its measured width. Close enough that the front does not visibly change
 * pace, and it needs no layout pass — so nothing reflows after first paint
 * and there is nothing to re-measure on resize.
 */
function FillChunk({
  text,
  color,
  from,
  to,
  progress,
  italic,
}: {
  text: string;
  color: string;
  from: number;
  to: number;
  progress: MotionValue<number>;
  italic?: boolean;
}) {
  const clip = useTransform(
    progress,
    [from, to],
    ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
  );
  return (
    <span
      style={{
        position: "relative",
        // Its own box, so the coloured copy on top of it is guaranteed to
        // occupy exactly the same space. This is what the whole-line overlay
        // could never promise \u2014 a word cannot wrap inside itself.
        display: "inline-block",
        fontStyle: italic ? "italic" : undefined,
      }}
    >
      {text}
      <motion.span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color,
          clipPath: clip,
          pointerEvents: "none",
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}

/** Splits a run into words and spaces, keeping both. */
function words(text: string) {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function FillRun({
  text,
  color,
  progress,
  italic,
}: {
  text: string;
  color: string;
  progress: MotionValue<number>;
  italic?: boolean;
}) {
  const parts = words(text);
  const total = parts.reduce((n, t) => n + t.length, 0);
  // Each word's slice of the run: a prefix sum of the lengths, built as a
  // value rather than tallied into a variable as the list is walked.
  const edges = parts.reduce<number[]>(
    (acc, t) => [...acc, acc[acc.length - 1] + t.length],
    [0],
  );
  const spans = parts.map((t, i) => ({
    text: t,
    from: edges[i] / total,
    to: edges[i + 1] / total,
  }));

  return (
    <>
      {spans.map((s, i) =>
        // Spaces carry no ink, so there is nothing to reveal in them \u2014 but
        // they still take their share of the run so the front keeps its pace
        // across the gaps.
        s.text.trim() === "" ? (
          <span key={i}>{s.text}</span>
        ) : (
          <FillChunk
            key={i}
            text={s.text}
            color={color}
            from={s.from}
            to={s.to}
            progress={progress}
            italic={italic}
          />
        ),
      )}
    </>
  );
}

/**
 * A paragraph whose filling runs are scrubbed by the reader's scroll.
 *
 * `FillLine` floods on a boolean, which is right where something else decides
 * the moment \u2014 the pin landing, the billboard standing up. Here the reader
 * decides: the colour arrives under their thumb as they pull the line up the
 * screen, and reverses if they scroll back.
 *
 * The window is the paragraph's own travel from low on the screen to the
 * upper third, so the run is full well before it leaves \u2014 a fill still
 * finishing at the top of the viewport reads as lag, not as control.
 */
export function ScrollFillLine({ nodes }: { nodes: Rich }) {
  const mark = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: mark,
    offset: ["start 0.92", "end 0.42"],
  });

  if (typeof nodes === "string") return <>{nodes}</>;

  return (
    <span ref={mark} style={{ display: "block" }}>
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
        if (node.fill)
          return (
            <FillRun
              key={i}
              text={node.text}
              color={TONE_COLOR[node.tone ?? ""] ?? "var(--f-orange)"}
              progress={scrollYProgress}
              italic={node.italic}
            />
          );
        return (
          <span
            key={i}
            style={{
              ...(node.italic ? { fontStyle: "italic" } : null),
              ...(node.tone === "dim"
                ? { opacity: 0.5 }
                : node.tone
                  ? { color: TONE_COLOR[node.tone] }
                  : null),
            }}
          >
            {node.text}
          </span>
        );
      })}
    </span>
  );
}
