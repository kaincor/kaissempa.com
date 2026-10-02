"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useArrival } from "./arrival";

/**
 * A plain fade-and-lift, played once when the element reaches the screen,
 * in its turn on the page's arrival queue (see arrival.ts). The scroll does
 * most of the staggering; pieces that arrive together are dealt out a beat
 * apart, top to bottom.
 *
 * The queue replaces a delay of (position in section × a third of a second). That
 * was fine for a section of three pieces, and wrong for a long one: the last
 * paragraph of "How we got there" is its nineteenth block, and it was
 * measured sitting invisible for 5.5 seconds after it had been scrolled to
 * the middle of the screen.
 */

export default function FadeIn({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  // Counted as arrived a little way up the screen, not at its very bottom
  // edge. At the edge a heading finishes its entrance while it is still in
  // the reader's peripheral vision, which reads as no entrance at all.
  const arrived = useArrival(scope, { margin: "0px 0px -12% 0px", disabled: !!reduced });

  useEffect(() => {
    if (!arrived || reduced || !scope.current) return;
    animate(
      scope.current,
      { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"] },
      { duration: 1.25, ease: [0.16, 1, 0.3, 1] },
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
