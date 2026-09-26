"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Goals, needs and frustrations as three decks that get dealt out.
 *
 * Each column starts as a pile at the top of its slot, cards squared up only
 * roughly — a few degrees either way, the way a hand actually looks when it is
 * put down. Scrolling deals them: one card at a time, across the three piles,
 * each sliding down into the place it would occupy anyway and straightening as
 * it goes, with its shadow deepening while it is off the pile and settling
 * again when it lands.
 *
 * The cards stay in normal flow. That is what makes this tractable: the layout
 * already knows where every card belongs and how tall each one is, so the only
 * thing to work out is where each card came FROM, which is its own distance
 * from the top of its column. Positioning them absolutely would mean measuring
 * and maintaining all of that by hand.
 */

/** Cards that stay put. The top of each pile is already where it belongs. */
const STUCK = 0;

/** How far a card can be out of true on the pile, and once it has landed. */
const THROWN = 7;
const SETTLED = 1.4;

const CARD_BG: Record<string, string> = {
  white: "#ffffff",
  amber: "#ffe1a6",
  rose: "#ffbbbb",
};

/** Deterministic, so a card does not pick a new angle on every render. */
function wobble(seed: number, spread: number) {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return ((n - Math.floor(n)) * 2 - 1) * spread;
}

export default function PersonaDecks({
  columns,
}: {
  columns: { title: string; tone: string; items: string[] }[];
}) {
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrap,
    // Begins as the decks clear the bottom of the screen and finishes well
    // before they leave the top, so the whole hand is dealt while it is being
    // looked at rather than on the way past.
    offset: ["start 0.92", "start 0.28"],
  });

  /** Each card's distance from the top of its column, once laid out. */
  const [tops, setTops] = useState<number[][]>(() => columns.map(() => []));
  const cards = useRef<(HTMLDivElement | null)[][]>(columns.map(() => []));

  const measure = useCallback(() => {
    setTops(
      cards.current.map((col) => {
        // Relative to the first card, not to `offsetParent`. The column is not
        // positioned, so offsetTop is measured against the band — which made
        // every card fly nine hundred pixels up to the top of the section
        // instead of the hundred or so back to its own pile.
        const base = col[0]?.offsetTop ?? 0;
        return col.map((el) => (el ? el.offsetTop - base : 0));
      }),
    );
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // One dealing order across all three piles: the first card of each, then the
  // second of each, and so on. That is what makes it read as one dealer going
  // round rather than three columns animating on their own.
  const rows = Math.max(...columns.map((c) => c.items.length));
  const dealt = columns.reduce((n, c) => n + Math.max(0, c.items.length - 1), 0);

  return (
    <motion.div
      ref={wrap}
      initial={reduced ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{
        marginTop: "clamp(26px, 4vw, 42px)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))",
        gap: "clamp(14px, 2.2vw, 22px)",
        alignItems: "start",
      }}
    >
      {columns.map((col, ci) => (
        <div key={col.title}>
          <h4
            style={{
              margin: "0 0 12px",
              textAlign: "center",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {col.title}
          </h4>

          <div style={{ display: "grid", gap: 12 }}>
            {col.items.map((item, i) => (
              <Card
                key={item}
                ref={(el) => {
                  cards.current[ci][i] = el;
                }}
                progress={scrollYProgress}
                from={tops[ci]?.[i] ?? 0}
                // Row-major: every pile's first card, then every second, and
                // so on, left to right within each round.
                order={i === STUCK ? -1 : (i - 1) * columns.length + ci}
                total={Math.max(1, (rows - 1) * columns.length)}
                seed={ci * 17 + i * 5 + 1}
                bg={CARD_BG[col.tone]}
                still={!!reduced}
              >
                {item}
              </Card>
            ))}
          </div>
        </div>
      ))}
      <span hidden>{dealt}</span>
    </motion.div>
  );
}

function Card({
  ref,
  progress,
  from,
  order,
  total,
  seed,
  bg,
  still,
  children,
}: {
  ref: (el: HTMLDivElement | null) => void;
  progress: MotionValue<number>;
  /** Pixels this card sits below the top of its column when laid out. */
  from: number;
  /** Place in the dealing order, or -1 for a card that never moves. */
  order: number;
  total: number;
  seed: number;
  bg: string;
  still: boolean;
  children: React.ReactNode;
}) {
  // Windows overlap by one slot, so the next card leaves the pile while the
  // last is still landing. A strict queue looks mechanical.
  const span = 1 / (total + 1);
  const start = order < 0 ? 0 : order * span;
  const end = order < 0 ? 1 : Math.min(1, start + span * 2);

  const dealt = useTransform(progress, [start, end], [0, 1], { clamp: true });

  const y = useTransform(dealt, (d) => (order < 0 || still ? 0 : -from * (1 - d)));
  const rotate = useTransform(dealt, (d) =>
    still
      ? 0
      : order < 0
        ? wobble(seed, SETTLED)
        : wobble(seed, THROWN) * (1 - d) + wobble(seed + 99, SETTLED) * d,
  );
  // Deepest in the middle of the flight, back to a resting card once it lands.
  const lift = useTransform(dealt, [0, 0.5, 1], [0, 1, 0]);
  const shadow = useTransform(lift, (l) => (order < 0 || still ? 0.2 : 0.2 + l * 0.6));

  return (
    <motion.div
      ref={ref}
      style={{
        position: "relative",
        y,
        rotate,
        // The pile has to sit on top of the empty slots below it, or a card
        // still waiting to be dealt is covered by the ones it is stacked with.
        zIndex: order < 0 ? 2 : 1,
        willChange: "transform",
      }}
    >
      {/* The shadow is its own layer so only its opacity changes as the card
          flies. Animating a box-shadow directly repaints it every frame. */}
      <motion.span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          boxShadow: "0 12px 26px rgba(31, 43, 38, 0.38)",
          opacity: shadow,
          pointerEvents: "none",
        }}
      />
      <p
        style={{
          position: "relative",
          margin: 0,
          background: bg,
          borderRadius: 8,
          padding: "16px 18px",
          fontSize: 13.5,
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </p>
    </motion.div>
  );
}
