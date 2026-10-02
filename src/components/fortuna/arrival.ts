"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * The page's one arrival queue: every entrance on the case study waits its
 * turn here, so the page appears top to bottom, one piece after another.
 *
 * Before this, the plain fades shared a queue but the pieces with entrances
 * of their own — the billboard, the goals, the persona sheet and its cards,
 * the globe — each watched the screen for themselves, at their own
 * thresholds. A paragraph under the globe could start before the globe did,
 * and a billboard could stand up while the heading above it was still
 * waiting in the fade queue. Within the fade queue, pieces arriving in the
 * same moment went in whatever order the browser reported them, which is not
 * always the order they sit on the page.
 *
 * Three rules keep it in order:
 *
 * 1. Pieces that arrive in the same frame are dealt out in page order.
 * 2. When a piece arrives, everything above it that has not played yet is
 *    released too, ahead of it. A tall piece that only counts as arrived
 *    once half of it shows can no longer be overtaken by the line below it.
 * 3. A piece already scrolled past — above the top of the screen — plays at
 *    once and takes no turn, so jumping down the page does not leave the
 *    screen you land on waiting behind everything you skipped.
 */

/** Seconds between two pieces that arrive together. */
const STEP = 0.34;
/**
 * Seconds between two pieces that arrive separately. Short: the scroll is
 * already spacing them out, and a long gap here builds a backlog when the
 * reader scrolls quickly.
 */
const SPACING = 0.12;
/** The most any piece waits after arriving. Past this it reads as loading. */
const MAX_WAIT = 1.1;

type Entry = {
  el: Element;
  seen: boolean;
  played: boolean;
  step: number;
  hold: number;
  go: () => void;
};

const entries = new Set<Entry>();
/** The earliest the next piece may start, in seconds. */
let free = -Infinity;
let flushing = 0;

function inPageOrder(a: Entry, b: Entry) {
  return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

function flush() {
  flushing = 0;
  const all = [...entries].filter((e) => !e.played).sort(inPageOrder);
  // Everything up to the lowest piece that has arrived goes now.
  let last = -1;
  all.forEach((e, i) => {
    if (e.seen) last = i;
  });
  if (last < 0) return;

  const now = performance.now() / 1000;
  let first = true;
  for (const e of all.slice(0, last + 1)) {
    e.played = true;
    entries.delete(e);
    if (e.el.getBoundingClientRect().bottom <= 0) {
      e.go();
      continue;
    }
    const gap = first ? SPACING : e.step;
    first = false;
    const start = Math.min(Math.max(now, free + gap), now + MAX_WAIT);
    free = start + e.hold;
    const wait = (start - now) * 1000;
    if (wait < 8) e.go();
    else setTimeout(e.go, wait);
  }
}

function schedule() {
  if (!flushing) flushing = requestAnimationFrame(flush);
}

/**
 * True once it is this element's turn to make its entrance.
 *
 * `margin` and `amount` say when it counts as arrived, as for an
 * IntersectionObserver. `step` is its gap behind the piece before it when
 * they arrive together; `hold` is how long its own entrance keeps the next
 * piece waiting, for one that plays out in several beats.
 */
export function useArrival(
  ref: RefObject<Element | null>,
  {
    margin = "0px",
    amount = 0,
    step = STEP,
    hold = 0,
    disabled = false,
  }: { margin?: string; amount?: number; step?: number; hold?: number; disabled?: boolean } = {},
) {
  const [go, setGo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    let alive = true;
    const entry: Entry = {
      el,
      seen: false,
      played: false,
      step,
      hold,
      go: () => {
        if (alive) setGo(true);
      },
    };
    entries.add(entry);
    const io = new IntersectionObserver(
      (records) => {
        // A hidden element — the persona board's other layout, say — has no
        // box, and is reported as intersecting at the screen's corner.
        const shown = records.some(
          (r) => r.isIntersecting && (r.boundingClientRect.width > 0 || r.boundingClientRect.height > 0),
        );
        if (shown) {
          entry.seen = true;
          io.disconnect();
          schedule();
        }
      },
      { rootMargin: margin, threshold: amount },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
      entries.delete(entry);
    };
  }, [ref, margin, amount, step, hold, disabled]);

  return go;
}
