"use client";

import { motion, useReducedMotion } from "motion/react";
import { useArrival } from "./arrival";
import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Goals, needs and frustrations as a pinned board with a tab under it.
 *
 * The phone and tablet version of the three card columns. Three columns of
 * long notes do not survive a 307px measure — they become three ribbons of
 * two-word lines — so on a narrow screen the same material is one board at a
 * time, switched by a segmented control underneath it in the manner of
 * Apple's feature switchers.
 *
 * The notes are scattered rather than stacked: varying widths, small tilts
 * and an uneven left edge, so the set reads as things tacked up during the
 * research rather than as a list that has been styled. All of that jitter is
 * hashed off a per-note seed, not `Math.random`, because a value that differs
 * between the server's render and the browser's is a hydration mismatch.
 *
 * Desktop keeps the dealt decks. This is deliberately a different interaction
 * rather than a reflow of the same one: a deal needs somewhere to deal to.
 */

/**
 * The notes take the hamster-wheel band's own forest, which is the darkest
 * ground the page uses, and set white on it at 10.33:1. Against the green
 * band underneath them they sit at 4.41:1 — enough separation that a note
 * reads as an object on the board rather than a panel of it.
 */
const NOTE_BG = "var(--f-forest)";
const NOTE_INK = "#ffffff";
/**
 * The switch. Cream track, forest pill.
 *
 * The track is only 2.15:1 against the green band, which would be hopeless
 * for type but is exactly right for a groove — it has to read as a recess the
 * pill slides in, not as a second card. The label on it measures 10.98:1, and
 * the selected label on the pill 9.49:1.
 */
const TRACK = "var(--f-cream)";
const TAB_INK = "var(--f-forest-deep)";
const PILL_INK = "var(--f-cream)";

/** The sheet's own corner, carried onto everything inside it. */
const RADIUS = 12;
/** The billboard blurb's corner, for the switch. */
const PILL_RADIUS = 14;

/** Degrees a note can be off square, and the extra it carries on the way in. */
const TILT = 2.8;
const TILT_IN = 1.9;

/** Seconds between one note landing and the next leaving. */
const POP = 0.075;

/**
 * How wide a note is, as a percentage of the board.
 *
 * Just under half, always, so every note pairs with its neighbour and the
 * board reads as two columns of pinned squares. The small spread is what
 * keeps the right-hand edge of each pair ragged; the gutter is counted in,
 * so even two at their widest still share a line.
 *
 * This replaces a length-driven version that gave long notes the whole line.
 * That kept every note's line length comfortable, but it meant the four
 * frustrations — all of them over a hundred characters — never paired with
 * anything.
 */
const NOTE_MIN = 44;
const NOTE_SPAN = 5;
/** Gutter between the two notes sharing a line. */
const GUTTER = 8;
/** How far a note can hang below the top of its line. */
const DROP = 16;

/** Deterministic 0–1 from a seed. Same on the server and in the browser. */
function hash01(seed: number) {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * How a note is pinned: its width, how far in from the left, and its tilt.
 *
 * Rounded, and not for tidiness. Motion writes the server's markup with six
 * significant figures and the browser then computes the full value, so a
 * tilt of 0.17960774702602064 degrees is serialised as 0.179608deg on one
 * side and in full on the other — which React reports as a hydration
 * mismatch on every note. Two decimal places is finer than a screen can
 * show and survives the round trip unchanged.
 */
function pin(seed: number) {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    width: round(NOTE_MIN + hash01(seed) * NOTE_SPAN),
    tilt: round((hash01(seed + 5) * 2 - 1) * TILT),
    /** Hangs this far below its line, so a pair never reads as a table row. */
    drop: Math.round(hash01(seed + 17) * DROP),
  };
}

export default function PersonaBoard({
  columns,
}: {
  columns: { title: string; items: string[] }[];
}) {
  const [tab, setTab] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const still = !!reduced;
  // The first board pops in when the sheet arrives, not on mount — otherwise
  // it has already happened by the time the reader scrolls to it.
  const started = useArrival(wrap, { margin: "0px 0px -25% 0px", hold: 0.5 });
  const id = useId();

  // Each board's own height, so the frame can be the size of the one on show
  // rather than the size of the biggest. Goals carries two short notes and
  // Frustrations four long ones — six times the words — so holding one height
  // for all three leaves a third of a screen of bare green under Goals.
  const boards = useRef<(HTMLUListElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>(() => columns.map(() => 0));
  const measure = useCallback(() => {
    setHeights((was) => {
      const now = boards.current.map((el) => el?.scrollHeight ?? 0);
      return now.every((h, i) => h === was[i]) ? was : now;
    });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    boards.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [measure]);

  const move = (d: number) => {
    const next = (tab + d + columns.length) % columns.length;
    setTab(next);
    // Follow the selection with focus, which is what a tablist that changes
    // its panel on arrow keys is supposed to do.
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div ref={wrap} style={{ marginTop: "clamp(18px, 4vw, 28px)" }}>
      {/* The frame animates between the three boards' heights rather than
          being held at the tallest. The switch underneath does move, but it
          travels with the frame over a quarter of a second instead of
          jumping, so the thumb can follow it — and neither board is padded
          out with empty green to match another one.

          The height is animated on this element while the boards inside are
          taken out of flow, rather than by putting `layout` on it: a layout
          animation projects onto its children, which would stretch every
          note while the frame resized. */}
      <motion.div
        style={{ position: "relative" }}
        initial={false}
        animate={{ height: heights[tab] || "auto" }}
        transition={still ? { duration: 0 } : { duration: 0.26, ease: [0.3, 0.7, 0.25, 1] }}
      >
        {columns.map((col, ci) => {
          const on = still ? ci === tab : started && ci === tab;
          return (
            <ul
              key={col.title}
              role="tabpanel"
              id={`${id}-panel-${ci}`}
              aria-labelledby={`${id}-tab-${ci}`}
              ref={(el) => {
                boards.current[ci] = el;
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                listStyle: "none",
                margin: 0,
                padding: 0,
                // Notes take about half the board each and wrap, so which of
                // them end up beside each other falls out of their widths
                // rather than being assigned.
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                columnGap: GUTTER,
                // Hidden rather than unmounted, so switching back does not
                // rebuild the board. visibility, unlike opacity, also takes
                // the copies that are not on show out of the accessibility
                // tree and off the tab order.
                visibility: ci === tab ? "visible" : "hidden",
              }}
            >
              {col.items.map((item, i) => {
                const p = pin(ci * 41 + i * 7 + 1);
                return (
                  <li
                    key={item}
                    style={{
                      width: `${p.width}%`,
                      marginTop: p.drop,
                      marginBottom: 10,
                    }}
                  >
                    <motion.p
                      initial={false}
                      animate={
                        on
                          ? { opacity: 1, scale: 1, rotate: p.tilt }
                          : {
                              opacity: 0,
                              scale: 0.62,
                              rotate: Math.round(p.tilt * TILT_IN * 100) / 100,
                            }
                      }
                      transition={
                        still
                          ? { duration: 0 }
                          : on
                            ? {
                                // Stiff and underdamped: it overshoots its
                                // size and settles back, which is the bounce.
                                type: "spring",
                                stiffness: 520,
                                damping: 15,
                                mass: 0.7,
                                delay: i * POP,
                              }
                            : { duration: 0.14, ease: "easeIn" }
                      }
                      style={{
                        margin: 0,
                        background: NOTE_BG,
                        color: NOTE_INK,
                        borderRadius: RADIUS,
                        // Ten and a half in tighter padding. At 11.5 a note
                        // half the board wide fits sixteen characters to the
                        // line, and the longest frustration ran to nine of
                        // them; this brings the set down to between two and
                        // eight, and every need to four or fewer.
                        padding: "9px 11px",
                        fontSize: 10.5,
                        lineHeight: 1.35,
                        letterSpacing: "-0.01em",
                        boxShadow:
                          "0 2px 6px rgba(18, 26, 23, 0.24), 0 12px 26px rgba(18, 26, 23, 0.3)",
                      }}
                    >
                      {item}
                    </motion.p>
                  </li>
                );
              })}
            </ul>
          );
        })}
      </motion.div>

      {/* Under the board, as on the page this borrows from. It can sit
          there because the grid cell above holds one height for all three
          boards, so tapping a tab never moves the thing being tapped. The
          line that follows the sheet — Sarah didn't think the job
          applications were horrid — does the job of the caption under it. */}
      <div
        role="tablist"
        aria-label="Persona board"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") move(1);
          else if (e.key === "ArrowLeft") move(-1);
          else return;
          e.preventDefault();
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          width: "fit-content",
          margin: "clamp(20px, 5vw, 30px) auto 0",
          padding: 4,
          background: TRACK,
          borderRadius: PILL_RADIUS,
        }}
      >
        {columns.map((col, ci) => (
          <button
            key={col.title}
            type="button"
            role="tab"
            id={`${id}-tab-${ci}`}
            aria-selected={ci === tab}
            aria-controls={`${id}-panel-${ci}`}
            tabIndex={ci === tab ? 0 : -1}
            onClick={() => setTab(ci)}
            style={{
              position: "relative",
              appearance: "none",
              border: "none",
              background: "none",
              borderRadius: PILL_RADIUS - 4,
              padding: "7px 14px",
              fontFamily: "var(--f-body)",
              fontSize: 13.5,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: ci === tab ? PILL_INK : TAB_INK,
              cursor: "pointer",
              // The label has to sit over the pill that slides under it.
              transition: "color 0.2s ease",
            }}
          >
            {ci === tab ? (
              // One element that moves between the tabs rather than three
              // that fade, so the selection slides the way the reference
              // does. Nothing else on the page shares this layoutId.
              <motion.span
                layoutId={`${id}-pill`}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: PILL_RADIUS - 4,
                  background: NOTE_BG,
                }}
                transition={
                  still
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 460, damping: 36 }
                }
              />
            ) : null}
            <span style={{ position: "relative" }}>{col.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
