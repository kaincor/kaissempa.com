"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  AppChrome,
  BigCard,
  BUTTON,
  CrossIcon,
  DINER,
  GREEN,
  TickIcon,
  type Job,
} from "../reel/cards";
import { clamp01, easeInOut, easeOut, lerp, seg } from "../reel/motion";
import PhoneMockup, { DotField } from "./PhoneMockup";

/**
 * The swipe, played rather than described: the job seeker's home screen,
 * swiped for the reader the way a screen recording would show it. A touch
 * lands on the card and drags it right to apply or left to dismiss, and the
 * next one comes up, round and round.
 *
 * One component for each beat of "How we got there", told apart by `demo`:
 *
 * - `spine` (Tinder's spine) shows the swipe working. The card washes green
 *   or red as it goes, the button it answers to lifts, and the card is
 *   thrown off with the stack moving up behind it.
 * - `error` (Swiping error) shows the same gesture with nothing to confirm
 *   it: no colour, no button, the card simply gone at the end of the drag.
 *   That absence is the point the section makes.
 *
 * Slow on purpose. Each card sits long enough to be read, and the drag holds
 * at its furthest point before the card goes. Driven off one clock in a
 * requestAnimationFrame loop that writes transforms straight to the elements
 * — nothing re-renders while it plays — and the clock stops while the phone
 * is off screen.
 */

type DemoCard = { job: Job; apply: boolean };
type Demo = {
  deck: DemoCard[];
  /** Colour, mark and button as the card goes; false for the error beat. */
  feedback: boolean;
  /** The home screen as it is before the bio is filled in, banner and all. */
  bio: boolean;
  /** Where the card sits, in the screen's units, and where the buttons are. */
  cardY: number;
  buttonsY: number;
  /** The cards peeking out under the front one, front to back. */
  slots: { s: number; y: number }[];
};

const job = (title: string, place: string, rating: string, hours: string, days: string, distance: string, pay: string, photo: string, area = "Dave County"): Job => ({
  title,
  place,
  rating,
  hours,
  days,
  area,
  distance,
  pay,
  photo: `/fortuna/reel/job-${photo}-card.webp`,
});

const DEMOS: Record<"spine" | "error", Demo> = {
  // "Bio Message - Home": apply, dismiss, dismiss, apply.
  spine: {
    deck: [
      // The diner as on the home screen frame, with that frame's photo; the
      // reel's diner shows the booths instead.
      { job: { ...DINER, photo: "/fortuna/reel/job-waiter-card.webp" }, apply: true },
      { job: job("Window Cleaner", "Riverside Cleaning Co.", "4.2", "Part Time Job", "Weekdays", "1.7 miles away", "$24", "window-cleaner"), apply: false },
      { job: job("Pastry Chef", "Little John's Bakery", "4.9", "Full Time Job", "Weekdays", "2.9 miles away", "$27", "pastry-chef"), apply: false },
      { job: job("Carpenter", "Red Moose Engineering", "3.8", "Part Time Job", "Weekdays", "0.4 miles away", "$32", "carpenter"), apply: true },
    ],
    feedback: true,
    bio: true,
    cardY: 166,
    buttonsY: 705,
    // Figma's Card 2 and Card 3 behind the front card.
    slots: [
      { s: 1, y: 0 },
      { s: 295 / 315, y: 3 },
      { s: 275 / 315, y: 8 },
    ],
  },
  // "Swiping Error": the bio done, one card at a time, nothing behind it.
  error: {
    deck: [
      { job: job("Stadium Crew", "Inter Miami CF LLC", "4.0", "Full Time Job", "Weekends", "1.2 miles away", "$22", "stadium-crew", "Dade County"), apply: true },
      { job: job("Pastry Chef", "Little John's Bakery", "4.9", "Full Time Job", "Weekdays", "2.9 miles away", "$27", "pastry-chef", "Dade County"), apply: false },
      { job: job("Crew", "Trader Joe's", "5.0", "Full Time Job", "Weekdays", "3.3 miles away", "$19", "crew", "Dade County"), apply: false },
      { job: job("Cashier", "STL Cafe", "4.4", "Full Time Job", "Weekdays", "2.4 miles away", "$25", "cashier", "Dade County"), apply: true },
    ],
    feedback: false,
    bio: false,
    cardY: 123,
    buttonsY: 677,
    slots: [
      { s: 1, y: 0 },
      { s: 1, y: 0 },
      { s: 1, y: 0 },
    ],
  },
};

/**
 * One card's turn, in seconds: it rests, the touch lands, the drag, a hold
 * at full stretch, then the throw while the stack moves up behind it.
 */
const T = { touch: 1.3, drag: 1.6, hold: 2.8, out: 3.15, gone: 3.7, period: 4.4 };
/** How far the drag carries the card, and how far the throw sends it. */
const DRAG = 120;
const THROW = 440;
/** Where the card sits across the screen, and where the touch lands on it. */
const CARD = { x: 30, w: 315, h: 511 };
const TOUCH_Y = 304;
const RED = "#f34545";

export default function SwipeDemo({ demo = "spine", caption }: { demo?: "spine" | "error"; caption?: string }) {
  const D = DEMOS[demo];
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const faces = useRef<(HTMLDivElement | null)[]>([]);
  const ticks = useRef<(HTMLDivElement | null)[]>([]);
  const crosses = useRef<(HTMLDivElement | null)[]>([]);
  const touch = useRef<HTMLDivElement>(null);
  const yes = useRef<HTMLDivElement>(null);
  const no = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { deck, feedback, slots } = D;
    const n = deck.length;
    const draw = (t: number) => {
      const turn = Math.floor(t / T.period);
      const u = t - turn * T.period;
      const front = turn % n;
      const apply = deck[front].apply;
      const dir = apply ? 1 : -1;

      // The drag: out to its furthest, held, then thrown — or, with no
      // feedback, simply gone where the drag let go of it.
      const pull = easeInOut(seg(u, T.drag, T.hold - 0.25));
      const thrown = feedback ? easeOut(seg(u, T.out, T.gone)) ** 1.4 : 0;
      const dx = dir * (DRAG * pull + (THROW - DRAG) * thrown);
      const lift = -14 * pull;
      const fade = feedback ? 1 - seg(u, T.gone - 0.2, T.gone) : 1 - seg(u, T.out, T.out + 0.08);
      // The stack moving up behind the card as it goes.
      const advance = easeInOut(seg(u, T.out + 0.05, T.gone + 0.15));

      for (let j = 0; j < n; j++) {
        const el = cards.current[j];
        if (!el) continue;
        const slot = (j - front + n) % n;
        const face = faces.current[j];
        const marks = [ticks.current[j], crosses.current[j]];
        if (slot === 0) {
          el.style.transform = `translate(${dx.toFixed(2)}px, ${lift.toFixed(2)}px) rotate(${(dx / 16).toFixed(3)}deg)`;
          el.style.opacity = String(fade);
          el.style.zIndex = "4";
          if (feedback) {
            const wash = clamp01(Math.abs(dx) / DRAG);
            if (face) {
              face.style.background = apply ? GREEN : RED;
              face.style.opacity = String(0.78 * wash);
            }
            const [tick, cross] = marks;
            const mark = apply ? tick : cross;
            const other = apply ? cross : tick;
            if (mark) {
              mark.style.opacity = String(wash);
              mark.style.transform = `scale(${lerp(0.6, 1, easeOut(wash)).toFixed(3)})`;
            }
            if (other) other.style.opacity = "0";
          }
        } else {
          // Slots 1 and 2 move up one place; the card that went last waits,
          // unseen, in slot 3 and fades into slot 2.
          const from = slots[Math.min(slot, 2)];
          const to = slots[slot - 1];
          const s = lerp(from.s, to.s, advance);
          const y = lerp(from.y, to.y, advance);
          el.style.transform = `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
          el.style.opacity = slot === 3 ? String(advance) : "1";
          el.style.zIndex = String(4 - slot);
          if (face) face.style.opacity = "0";
          for (const m of marks) if (m) m.style.opacity = "0";
        }
      }

      // The touch: lands, rides the drag, lifts as the card goes.
      if (touch.current) {
        const on = easeOut(seg(u, T.touch, T.touch + 0.3)) * (1 - seg(u, T.out - 0.05, T.out + 0.2));
        const press = 1 - 0.18 * easeOut(seg(u, T.touch + 0.1, T.touch + 0.45));
        const tx = dir * DRAG * pull + (feedback ? dir * 40 * seg(u, T.out - 0.05, T.out + 0.2) : 0);
        touch.current.style.opacity = String(on);
        touch.current.style.transform = `translate(${tx.toFixed(2)}px, ${lift.toFixed(2)}px) scale(${press.toFixed(3)})`;
      }

      // The button the swipe answers to comes up as the drag commits.
      if (!feedback) return;
      const answer = easeOut(seg(u, T.drag + 0.6, T.hold)) * (1 - seg(u, T.out + 0.1, T.gone));
      for (const [el, on] of [
        [yes.current, apply],
        [no.current, !apply],
      ] as const) {
        if (!el) continue;
        const k = on ? answer : 0;
        el.style.transform = `scale(${(1 + 0.12 * k).toFixed(3)})`;
        el.style.boxShadow = `0 6px 14px rgba(40, 40, 30, ${(0.12 + 0.1 * k).toFixed(3)}), 0 0 0 ${(4 * k).toFixed(2)}px ${on && apply ? "rgba(105, 189, 69, 0.35)" : "rgba(243, 69, 69, 0.3)"}`;
      }
    };

    draw(0);
    if (reduced) return;

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.25 });
    if (host.current) io.observe(host.current);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible) return;
      clock += dt;
      draw(clock);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced, D]);

  const label =
    demo === "error"
      ? "The Fortuna app's home screen: job cards swiped away one after another, with nothing to show whether each was an application or a dismissal."
      : "The Fortuna app's home screen: job cards swiped right to apply and left to dismiss, one after another.";

  return (
    <DotField captioned={!!caption}>
      <div ref={host} role="img" aria-label={label}>
        <PhoneMockup width="min(300px, 68vw)">
          <AppChrome buttons={false} profileDone={!D.bio} />
          {D.bio && <BioBanner />}
          {D.deck.map(({ job }, j) => (
            <div
              key={job.title}
              ref={(el) => {
                cards.current[j] = el;
              }}
              style={{ position: "absolute", left: CARD.x, top: D.cardY, width: CARD.w, height: CARD.h, transformOrigin: "50% 100%", willChange: "transform" }}
            >
              <BigCard job={job}>
                {D.feedback && (
                  <>
                    <div ref={(el) => { faces.current[j] = el; }} style={{ position: "absolute", inset: 0, opacity: 0 }} />
                    <Mark set={(el) => { ticks.current[j] = el; }}>
                      <TickIcon size={96} color="#fff" />
                    </Mark>
                    <Mark set={(el) => { crosses.current[j] = el; }}>
                      <CrossIcon size={96} color="#fff" />
                    </Mark>
                  </>
                )}
              </BigCard>
            </div>
          ))}
          <div ref={no} style={{ ...BUTTON, top: D.buttonsY, left: 98, background: "#ff8989" }}>
            <CrossIcon />
          </div>
          <div ref={yes} style={{ ...BUTTON, top: D.buttonsY, left: 214, background: "#ade495" }}>
            <TickIcon />
          </div>
          {/* The touch, as a screen recording shows it. */}
          <div
            ref={touch}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: CARD.x + CARD.w / 2 - 24,
              top: D.cardY + TOUCH_Y - 24,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(60, 60, 60, 0.28)",
              border: "2px solid rgba(255, 255, 255, 0.65)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              zIndex: 10,
              opacity: 0,
            }}
          />
        </PhoneMockup>
      </div>
      {caption && (
        // One row of the dot grid below the phone, and up into place with a
        // small bounce once the phone has arrived.
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 13, mass: 0.9, delay: 0.55, opacity: { duration: 0.35, delay: 0.55 } }}
          style={{
            margin: "14px 0 0",
            textAlign: "center",
            fontFamily: "var(--f-body)",
            fontSize: "clamp(13px, 1.1vw, 14.5px)",
            lineHeight: 1.5,
            letterSpacing: "-0.02em",
          }}
        >
          {caption}
        </motion.p>
      )}
    </DotField>
  );
}

/** The big tick or cross on a card as it washes green or red. */
function Mark({ set, children }: { set: (el: HTMLDivElement | null) => void; children: React.ReactNode }) {
  return (
    <div ref={set} style={{ position: "absolute", left: 0, right: 0, top: 92, display: "flex", justifyContent: "center", opacity: 0 }}>
      {children}
    </div>
  );
}

/** "Complete your bio!" above the stack, as on the home screen. */
function BioBanner() {
  return (
    <div
      style={{
        position: "absolute",
        left: 29,
        top: 101,
        width: 316,
        height: 52,
        borderRadius: 8,
        border: `1px solid ${GREEN}`,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 14px 0 20px",
        boxSizing: "border-box",
        fontFamily: "var(--f-body)",
        fontSize: 11.5,
        lineHeight: 1.35,
        color: "#111",
      }}
    >
      <span style={{ fontSize: 18 }}>📝</span>
      <span>
        <b>Complete your bio!</b> It will give you more possibilities when applying for a job
      </span>
    </div>
  );
}
