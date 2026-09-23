"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import FortunaWordmark from "./FortunaWordmark";
import type { Rich, Token } from "@/content/fortuna";

/**
 * The pull-out, raised like a billboard.
 *
 * It starts lying flat in the page's own plane, hinged along its bottom edge,
 * where it is edge-on to the reader and so takes up no height and shows
 * nothing. Reaching the screen swings it upright. The text is painted on the
 * board and comes up with it rather than arriving separately, which is the
 * point — one object moving, not a box and its contents negotiating.
 *
 * Timed rather than scrubbed. A scroll-linked version ties the pace of the
 * animation to the pace of the reader, so a fast scroll makes it snap and a
 * slow one makes it crawl; a billboard has its own speed.
 */

/** Degrees it lies back at rest. 90 is flat, and flat is invisible. */
const LAID_FLAT = 90;
/** How near the viewer the hinge reads. Short, so the throw is dramatic. */
const PERSPECTIVE = 1100;

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
function FillWord({ text, color, go }: { text: string; color: string; go: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {text}
      <motion.span
        aria-hidden="true"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={go ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        transition={{ duration: 0.75, ease: [0.33, 0, 0.2, 1] }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color,
          whiteSpace: "pre",
          pointerEvents: "none",
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}

function Inline({ nodes, filled }: { nodes: Rich; filled: boolean }) {
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

export default function BillboardCallout({
  text,
  align = "left",
  delay = 0,
}: {
  text: Rich;
  align?: "left" | "center";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  // The fill waits for the board to arrive rather than running on a guessed
  // delay, so the two stay in step if the spring is ever retuned.
  const [filled, setFilled] = useState(false);

  return (
    <motion.div
      initial={reduced ? false : { rotateX: LAID_FLAT }}
      whileInView={{ rotateX: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      onAnimationComplete={() => setFilled(true)}
      transition={{
        type: "spring",
        stiffness: 74,
        damping: 12,
        mass: 0.9,
        delay,
      }}
      style={{
        margin: "32px 0",
        background: "var(--f-callout)",
        borderRadius: 14,
        padding: "26px 38px",
        transformPerspective: PERSPECTIVE,
        // Hinged along the bottom edge, so it stands up off the page rather
        // than spinning about its middle.
        transformOrigin: "center bottom",
        willChange: "transform",
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
        <Inline nodes={text} filled={reduced ? true : filled} />
      </p>
    </motion.div>
  );
}
