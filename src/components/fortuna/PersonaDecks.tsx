"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useArrival } from "./arrival";
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

/**
 * How far a card can be out of true on the pile, and once it has landed.
 *
 * Small. These cards are tall, and a few degrees at the top of one throws its
 * bottom corners a long way out — at seven the frustrations pile, the tallest
 * of the three, splayed out into a blob before it had dealt anything.
 */
const THROWN = 3.4;
const SETTLED = 1.4;

/**
 * Pixels the pile is held above its resting place before the deal.
 *
 * Whatever this is, the column heading has to be cleared by it — a deck held
 * above its slot reaches up into the space above, and at 34 against a 12px
 * gap the Needs and Frustrations piles were sitting on top of their own
 * titles. The gap below the heading is derived from this rather than set
 * next to it, so the two cannot drift apart again.
 */
const LIFT = 22;
/**
 * Room under the heading: the lift, plus air.
 *
 * More air than looks necessary, because a card on the pile is rotated and a
 * rotated box is taller than the card in it. At ten the measured clearance
 * came out at five pixels rather than ten; the throw was eating half of it.
 */
const HEAD_GAP = LIFT + 20;

/** One card's flight, and the gap between one leaving and the next. */
const FLIGHT = 1.05;
const STAGGER = 0.3;
/** How far behind Goals each pile starts. */
const COLUMN_LEAD = 0.13;

/**
 * A neutral ramp rather than the sheet's yellow and red.
 *
 * All three are straight out of Fortuna's palette — DISABLED_BACKGROUND,
 * GREY, MEDIUM_DARK_GREY — so the piles read as escalating weight instead of
 * a traffic light. Goals are the lightest thing on the table and frustrations
 * the heaviest, which is the ordering the colour coding was making, without
 * borrowing meaning from red.
 *
 * This is as dark as the set goes while one ink still serves all three. On
 * #999999 the cards' near-black measures 5.79:1; the next step down in the
 * palette is brown at 3.26, which would mean flipping the type to cream for
 * that column alone.
 */
const CARD_BG: Record<string, string> = {
  white: "#ebe9e4",
  amber: "#c6c6c6",
  rose: "#999999",
};

/**
 * Tallest card first, so the pile has a clean silhouette.
 *
 * The cards are stacked by their top edges, which means a card taller than
 * the one in front of it hangs out below the bottom of the pile — measured at
 * 40px on Frustrations, whose first card is 107 tall and whose second is 148.
 * Putting the tallest at the front makes every other card fall inside its
 * footprint, so the deck reads as one card until it starts dealing. It also
 * means the biggest card is the one that stays put and the smaller ones fan
 * out beneath it.
 *
 * Sorted by how much text a card carries rather than by its measured height.
 * Every card in a column is the same width in the same face, so the two agree
 * — checked against all ten — and this needs no layout pass, so nothing
 * reflows after the first paint.
 */
function tallestFirst(items: string[]) {
  return [...items].sort((a, b) => b.length - a.length);
}

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
  // Its turn on the page's queue; it holds the queue a little while the
  // piles deal, so what follows does not start under the cards in the air.
  const started = useArrival(wrap, { margin: "0px 0px -35% 0px", hold: 0.8 });

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

  // Each pile deals its own cards in turn, with the piles set going a beat
  // apart. One strict queue across all three read better in principle — one
  // dealer going round — but it put the last card of the longest pile seventh
  // in line, which left it hanging in the air for nearly three seconds after
  // the first had landed. Long enough that a reader scrolling at any pace
  // arrived to find two cards still up. Dealing the piles alongside each other
  // keeps every card's own flight as slow as it was and gets the whole hand
  // down in under two.

  return (
    <motion.div
      ref={wrap}
      initial={reduced ? false : { opacity: 0 }}
      animate={started ? { opacity: 1 } : undefined}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{
        marginTop: "clamp(16px, 2.4vw, 26px)",
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
              margin: `0 0 ${HEAD_GAP}px`,
              textAlign: "center",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {col.title}
          </h4>

          <div style={{ display: "grid", gap: 12 }}>
            {tallestFirst(col.items).map((item, i) => (
              <Card
                key={item}
                ref={(el) => {
                  cards.current[ci][i] = el;
                }}
                started={started}
                from={tops[ci]?.[i] ?? 0}
                order={i === 0 ? -1 : i - 1}
                lead={ci * COLUMN_LEAD}
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
  lead,
  seed,
  bg,
  still,
  children,
}: {
  ref: (el: HTMLDivElement | null) => void;
  started: boolean;
  /** Pixels this card sits below the top of its column when laid out. */
  from: number;
  /** Place in this pile's dealing order, or -1 for the card already down. */
  order: number;
  /** Seconds this whole pile waits before it starts dealing. */
  lead: number;
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
      delay: order < 0 ? 0 : lead + order * STAGGER,
    });
    return () => controls.stop();
  }, [started, order, lead, still, dealt]);

  // The top card of a pile is already home; it only has the lift to give back.
  const rise = order < 0 ? LIFT : from + LIFT;
  const y = useTransform(dealt, (d) => (still ? 0 : -rise * (1 - d)));
  const rotate = useTransform(dealt, (d) =>
    still ? 0 : wobble(seed, THROWN) * (1 - d) + wobble(seed + 99, SETTLED) * d,
  );
  // Deepest in the middle of the flight, back to a resting card once it lands.
  const lift = useTransform(dealt, [0, 0.5, 1], [0.55, 1, 0.42]);
  const shadow = useTransform(lift as MotionValue<number>, (l) =>
    still ? 0.42 : l,
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
          boxShadow:
            "0 3px 8px rgba(31, 43, 38, 0.3), 0 16px 34px rgba(31, 43, 38, 0.5)",
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
          padding: "14px 16px",
          fontSize: 13.5,
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
          color: "#1f1f1f",
        }}
      >
        {children}
      </p>
    </motion.div>
  );
}
