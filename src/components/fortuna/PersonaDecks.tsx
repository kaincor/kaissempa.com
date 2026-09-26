"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Goals, needs and frustrations as three decks that get dealt out.
 *
 * Each column starts as a pile held a little above where it will land, cards
 * squared up only roughly — a few degrees either way, the way a hand actually
 * looks when it is put down. Once the piles reach two thirds of the way up the
 * screen the whole hand is dealt in one movement: a card at a time, row by row
 * across the three piles, each gliding down into the place it would occupy
 * anyway and straightening as it goes.
 *
 * Timed, not scrubbed. A deal has a pace of its own — the reader's thumb
 * should not be able to make it snap or crawl, and a scrubbed version runs
 * backwards the moment they scroll up.
 *
 * The cards stay in normal flow, which is what makes this tractable. The
 * layout already knows where every card belongs and how tall each one is, so
 * the only unknown is where each came FROM: its own distance from the top of
 * its column.
 */

/** How far a card can be out of true on the pile, and once it has landed. */
const THROWN = 7;
const SETTLED = 1.4;

/** Pixels the pile is held above its resting place before the deal. */
const LIFT = 34;

/** One card's flight, and the gap between one leaving and the next. */
const FLIGHT = 1.05;
const STAGGER = 0.3;

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
  // Shrinking the root's bottom by a third means the piles count as arrived
  // when they cross two thirds of the way up the screen, rather than the
  // moment their first pixel appears at the bottom of it.
  const started = useInView(wrap, { once: true, margin: "0px 0px -35% 0px" });

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

  // One dealing order across all three piles: the first card of every pile,
  // then the second of every pile, and so on. Counted densely, skipping the
  // piles that have run out — a place kept for a card that does not exist
  // would show up as a pause in the middle of the deal.
  const rows = Math.max(...columns.map((c) => c.items.length));
  const order = new Map<string, number>();
  let k = 0;
  for (let i = 1; i < rows; i++) {
    for (let ci = 0; ci < columns.length; ci++) {
      if (i < columns[ci].items.length) order.set(`${ci}:${i}`, k++);
    }
  }

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
                started={started}
                from={tops[ci]?.[i] ?? 0}
                order={i === 0 ? -1 : (order.get(`${ci}:${i}`) ?? 0)}
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
    </motion.div>
  );
}

function Card({
  ref,
  started,
  from,
  order,
  seed,
  bg,
  still,
  children,
}: {
  ref: (el: HTMLDivElement | null) => void;
  started: boolean;
  /** Pixels this card sits below the top of its column when laid out. */
  from: number;
  /** Place in the dealing order, or -1 for the card already on the table. */
  order: number;
  seed: number;
  bg: string;
  still: boolean;
  children: React.ReactNode;
}) {
  const dealt = useMotionValue(still ? 1 : 0);

  useEffect(() => {
    if (still) {
      dealt.set(1);
      return;
    }
    if (!started) return;
    const controls = animate(dealt, 1, {
      duration: FLIGHT,
      // Away from the pile without hurry, then a long glide onto the table.
      ease: [0.28, 0.72, 0.2, 1],
      delay: order < 0 ? 0 : order * STAGGER,
    });
    return () => controls.stop();
  }, [started, order, still, dealt]);

  // The top card of a pile is already home; it only has the lift to give back.
  const rise = order < 0 ? LIFT : from + LIFT;
  const y = useTransform(dealt, (d) => (still ? 0 : -rise * (1 - d)));
  const rotate = useTransform(dealt, (d) =>
    still ? 0 : wobble(seed, THROWN) * (1 - d) + wobble(seed + 99, SETTLED) * d,
  );
  // Deepest in the middle of the flight, back to a resting card once it lands.
  const lift = useTransform(dealt, [0, 0.5, 1], [0.34, 1, 0.2]);
  const shadow = useTransform(lift as MotionValue<number>, (l) =>
    still ? 0.2 : l,
  );

  return (
    <motion.div
      ref={ref}
      style={{
        position: "relative",
        y,
        rotate,
        // The pile has to sit above the empty slots below it, or a card still
        // waiting to be dealt is covered by the ones it is stacked with.
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
          color: "#1f1f1f",
        }}
      >
        {children}
      </p>
    </motion.div>
  );
}
