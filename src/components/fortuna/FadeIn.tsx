"use client";

import { useAnimate, useInView, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

/**
 * A plain fade-and-lift, played once when the element reaches the screen.
 *
 * Every piece triggers on its own arrival, so the page appears one piece at a
 * time as the reader scrolls — the scroll itself does the staggering. Only
 * pieces that arrive at the same moment are queued: a heading and the line
 * under it, or a screenful at once after a jump, are dealt out a beat apart
 * in the order they arrived. Something that arrives alone plays straight
 * away.
 *
 * This replaces a delay of (position in section × a third of a second). That
 * was fine for a section of three pieces, and wrong for a long one: the last
 * paragraph of "How we got there" is its nineteenth block, and it was
 * measured sitting invisible for 5.5 seconds after it had been scrolled to
 * the middle of the screen.
 */

/** Seconds between two pieces that arrive together. */
const STEP = 0.34;
/**
 * Seconds between two pieces that arrive separately, one after the other.
 *
 * Much shorter than STEP, and it has to be. The first version of this used
 * one gap for both cases, so the queue only drained if pieces arrived slower
 * than one every third of a second — and an ordinary scroll through a long
 * section delivers them faster than that. The backlog hit the cap and stayed
 * there: measured scrolling through "How we got there", every one of its
 * nineteen pieces started 1.1 seconds after reaching the screen. Pieces
 * arriving on their own are already spaced out by the scroll itself; they
 * only need enough of a gap not to start in the same frame.
 */
const SPACING = 0.12;
/** How close together two arrivals have to be to count as the same batch. */
const TOGETHER = 0.08;
/**
 * The most any piece waits, however far back in its batch it is.
 *
 * A jump — a reload halfway down, a tap on a link — can bring a screenful on
 * at once. Past about a second, a delay stops reading as rhythm and starts
 * reading as a page that has not finished loading.
 */
const MAX_WAIT = 1.1;

/** When the last piece was told to start, and when the last one arrived. */
let lastStart = -Infinity;
let lastArrival = -Infinity;

function claimDelay() {
  const now = performance.now() / 1000;
  const together = now - lastArrival < TOGETHER;
  lastArrival = now;
  const gap = together ? STEP : SPACING;
  const start = Math.min(Math.max(now, lastStart + gap), now + MAX_WAIT);
  lastStart = start;
  return start - now;
}

export default function FadeIn({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  // Counted as arrived a little way up the screen, not at its very bottom
  // edge. At the edge a heading finishes its entrance while it is still in
  // the reader's peripheral vision, which reads as no entrance at all.
  const arrived = useInView(scope, { once: true, margin: "0px 0px -12% 0px" });

  // Played imperatively rather than through state: the delay is only known at
  // the instant of arrival, and holding it in state would cost every piece on
  // the page a second render just to start its own animation.
  useEffect(() => {
    if (!arrived || reduced || !scope.current) return;
    animate(
      scope.current,
      { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"] },
      { duration: 1.25, ease: [0.16, 1, 0.3, 1], delay: claimDelay() },
    );
  }, [arrived, reduced, animate, scope]);

  if (reduced) return <>{children}</>;
  return (
    <div
      ref={scope}
      style={{
        opacity: 0,
        transform: "translateY(14px)",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
