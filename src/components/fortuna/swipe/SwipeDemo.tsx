"use client";

import Image from "next/image";
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
import { clamp01, easeInOut, easeOut, lerp, seg, spring } from "../reel/motion";
import PhoneMockup, { DotField } from "./PhoneMockup";

/**
 * The swipe, played rather than described: the job seeker's home screen,
 * swiped for the reader the way a screen recording would show it. A touch
 * lands on the card and drags it right to apply or left to dismiss, and the
 * next one comes up.
 *
 * One component for each beat of "How we got there", told apart by `demo`:
 *
 * - `spine` (Tinder's spine) shows the swipe working. The card turns green
 *   or red as it goes, with the app's own Apply or Dismiss stamp on it, the
 *   button it answers to lifts, and the card is thrown off with the stack
 *   moving up behind it. Round and round.
 * - `error` (Swiping error) shows the same gesture with nothing to confirm
 *   it: the card goes off the screen just the same, but with no colour and
 *   no button to say which way it counted. That absence is the point the
 *   section makes.
 * - `comeback` (Wait, come back) is a tester flicking through the whole
 *   deck: card after card dismissed at a glance, too fast to read, until the
 *   feed runs dry on "All Caught Up!". Then it starts over.
 *
 * Driven off one clock in a requestAnimationFrame loop that writes
 * transforms straight to the elements — nothing re-renders while it plays —
 * and the clock stops while the phone is off screen.
 */

type DemoCard = { job: Job; apply: boolean };
type Demo = {
  deck: DemoCard[];
  /** Colour, stamp and button as the card goes; false for the error beat. */
  feedback: boolean;
  /** The home screen as it is before the bio is filled in, banner and all. */
  bio: boolean;
  /** Where the card sits, in the screen's units, and where the buttons are. */
  cardY: number;
  buttonsY: number;
  /** The cards peeking out under the front one, front to back. */
  slots: { s: number; y: number }[];
  /** How long one card's turn takes against the base pace (T): under 1 is quicker. */
  pace: number;
  /**
   * One unbroken stroke from the middle off the side, rather than a drag
   * that holds at full stretch and then a throw.
   */
  fluid?: boolean;
  /**
   * A run through the deck once, ending on the empty feed, rather than a
   * loop: a beat on the first card before the first swipe, how long the end
   * screen holds, and the fade back to the start.
   */
  run?: { lead: number; hold: number; reset: number };
};

const job = (title: string, place: string, rating: string, hours: string, days: string, distance: string, pay: string, photo: string, area = "Dade County"): Job => ({
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

const PLAIN = [
  { s: 1, y: 0 },
  { s: 1, y: 0 },
  { s: 1, y: 0 },
];

const DEMOS: Record<"spine" | "error" | "comeback", Demo> = {
  // "Bio Message - Home": apply, dismiss, dismiss, apply.
  spine: {
    deck: [
      // The diner as on the home screen frame, with that frame's photo; the
      // reel's diner shows the booths instead.
      { job: { ...DINER, photo: "/fortuna/reel/job-waiter-card.webp" }, apply: true },
      { job: job("Window Cleaner", "Riverside Cleaning Co.", "4.2", "Part Time Job", "Weekdays", "1.7 miles away", "$24", "window-cleaner", "Dave County"), apply: false },
      { job: job("Pastry Chef", "Little John's Bakery", "4.9", "Full Time Job", "Weekdays", "2.9 miles away", "$27", "pastry-chef", "Dave County"), apply: false },
      { job: job("Carpenter", "Red Moose Engineering", "3.8", "Part Time Job", "Weekdays", "0.4 miles away", "$32", "carpenter", "Dave County"), apply: true },
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
    pace: 1,
  },
  // "Swiping Error": the bio done, one card at a time, nothing behind it.
  error: {
    deck: [
      { job: job("Stadium Crew", "Inter Miami CF LLC", "4.0", "Full Time Job", "Weekends", "1.2 miles away", "$22", "stadium-crew"), apply: true },
      { job: job("Pastry Chef", "Little John's Bakery", "4.9", "Full Time Job", "Weekdays", "2.9 miles away", "$27", "pastry-chef"), apply: false },
      { job: job("Crew", "Trader Joe's", "5.0", "Full Time Job", "Weekdays", "3.3 miles away", "$19", "crew"), apply: false },
      { job: job("Cashier", "STL Cafe", "4.4", "Full Time Job", "Weekdays", "2.4 miles away", "$25", "cashier"), apply: true },
    ],
    feedback: false,
    bio: false,
    cardY: 123,
    buttonsY: 677,
    slots: PLAIN,
    pace: 1,
  },
  // "Wait, Come Back": every card dismissed, quickly, then the empty feed.
  comeback: {
    deck: [
      { job: job("Train Attendant", "Brightline Trains", "3.8", "Full Time Job", "Weekdays/Weekends", "4.1 miles away", "$20", "train-attendant"), apply: false },
      { job: job("Warehouse Associate", "Badia Spices", "4.0", "Full Time Job", "Weekdays", "0.8 miles away", "$23", "warehouse-associate"), apply: false },
      { job: job("Package Clerk", "St. Thomas University", "4.7", "Full Time Job", "Weekdays", "3.3 miles away", "$21", "package-clerk"), apply: false },
      { job: job("Stadium Crew", "Inter Miami CF LLC", "4.0", "Full Time Job", "Weekends", "1.2 miles away", "$22", "stadium-crew"), apply: false },
      { job: job("Pastry Chef", "Little John's Bakery", "4.9", "Full Time Job", "Weekdays", "2.9 miles away", "$27", "pastry-chef"), apply: false },
      { job: job("Crew", "Trader Joe's", "5.0", "Full Time Job", "Weekdays", "3.3 miles away", "$19", "crew"), apply: false },
      { job: job("Cashier", "STL Cafe", "4.4", "Full Time Job", "Weekdays", "2.4 miles away", "$25", "cashier"), apply: false },
      { job: { ...DINER, area: "Dade County", photo: "/fortuna/reel/job-waiter-card.webp" }, apply: false },
      { job: job("Window Cleaner", "Riverside Cleaning Co.", "4.2", "Part Time Job", "Weekdays", "1.7 miles away", "$24", "window-cleaner"), apply: false },
      { job: job("Carpenter", "Red Moose Engineering", "3.8", "Part Time Job", "Weekdays", "0.4 miles away", "$32", "carpenter"), apply: false },
    ],
    feedback: true,
    bio: false,
    cardY: 123,
    buttonsY: 677,
    slots: PLAIN,
    pace: 0.2,
    fluid: true,
    run: { lead: 0.9, hold: 3, reset: 0.6 },
  },
};

/**
 * One card's turn at the base pace, in seconds: it rests, the touch lands,
 * the drag, a hold at full stretch, then the throw while the stack moves up
 * behind it. Slow on purpose — each card sits long enough to be read — and
 * scaled by a demo's `pace`.
 */
const T = { touch: 1.3, drag: 1.6, hold: 2.8, out: 3.15, gone: 3.7, period: 4.4 };
/** How far the drag carries the card, and how far the throw sends it. */
const DRAG = 120;
const THROW = 440;
/** Where the card sits across the screen, and where the touch lands on it. */
const CARD = { x: 30, w: 315, h: 511 };
const TOUCH_Y = 304;
const RED = "#f34545";

type Kind = "spine" | "error" | "comeback";

export default function SwipeDemo({ demo = "spine", caption }: { demo?: Kind; caption?: string }) {
  const D = DEMOS[demo];
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const faces = useRef<(HTMLDivElement | null)[]>([]);
  const yesFaces = useRef<(HTMLDivElement | null)[]>([]);
  const noFaces = useRef<(HTMLDivElement | null)[]>([]);
  const touch = useRef<HTMLDivElement>(null);
  const yes = useRef<HTMLDivElement>(null);
  const no = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { deck, feedback, slots, pace, run, fluid } = D;
    const n = deck.length;
    const P = {
      touch: T.touch * pace,
      drag: T.drag * pace,
      hold: T.hold * pace,
      out: T.out * pace,
      gone: T.gone * pace,
      period: T.period * pace,
    };

    /** The card on top, `u` seconds into its turn; returns the drag's reach. */
    const swipe = (j: number, u: number) => {
      const el = cards.current[j];
      const apply = deck[j].apply;
      const dir = apply ? 1 : -1;
      const pull = easeInOut(seg(u, P.drag, P.hold - 0.25 * pace));
      const thrown = easeOut(seg(u, P.out, P.gone)) ** 1.4;
      // A fluid swipe is one ease from rest to off the screen, over the
      // drag and the throw together.
      const sweep = easeInOut(seg(u, P.drag, P.gone - 0.05 * pace));
      const dx = fluid ? dir * THROW * sweep : dir * (DRAG * pull + (THROW - DRAG) * thrown);
      const lift = -14 * (fluid ? Math.sin(Math.PI * Math.min(1, sweep * 1.4)) : pull);
      if (el) {
        el.style.transform = `translate(${dx.toFixed(2)}px, ${lift.toFixed(2)}px) rotate(${(dx / 16).toFixed(3)}deg)`;
        el.style.opacity = String(1 - seg(u, P.gone - 0.2 * pace, P.gone));
        el.style.zIndex = "4";
      }
      if (feedback) {
        // The app's own: the card turns solid green or red under the drag,
        // with its Apply or Dismiss stamp.
        const wash = clamp01(Math.abs(dx) / DRAG);
        const face = faces.current[j];
        if (face) {
          face.style.background = apply ? GREEN : RED;
          face.style.opacity = String(wash);
        }
        const [show, hide] = apply ? [yesFaces, noFaces] : [noFaces, yesFaces];
        const stamp = show.current[j];
        if (stamp) {
          stamp.style.opacity = String(wash);
          stamp.style.transform = `scale(${lerp(0.82, 1, easeOut(wash)).toFixed(3)})`;
        }
        const other = hide.current[j];
        if (other) other.style.opacity = "0";
      }

      // The touch: lands, rides the drag, lifts as the card goes.
      if (touch.current) {
        const on = easeOut(seg(u, P.touch, P.touch + 0.3 * Math.min(1, pace * 2))) * (1 - seg(u, P.out - 0.05 * pace, P.out + 0.2 * pace));
        const press = 1 - 0.18 * easeOut(seg(u, P.touch + 0.1 * pace, P.touch + 0.45 * pace));
        const tx = fluid ? dx * 0.9 : dir * DRAG * pull + dir * 40 * seg(u, P.out - 0.05 * pace, P.out + 0.2 * pace);
        touch.current.style.opacity = String(on);
        touch.current.style.transform = `translate(${tx.toFixed(2)}px, ${lift.toFixed(2)}px) scale(${press.toFixed(3)})`;
      }

      // The button the swipe answers to comes up as the drag commits.
      if (!feedback) return;
      const answer = easeOut(seg(u, P.drag + 0.6 * pace, P.hold)) * (1 - seg(u, P.out + 0.1 * pace, P.gone));
      for (const [b, on] of [
        [yes.current, apply],
        [no.current, !apply],
      ] as const) {
        if (!b) continue;
        const k = on ? answer : 0;
        b.style.transform = `scale(${(1 + 0.12 * k).toFixed(3)})`;
        b.style.boxShadow = `0 6px 14px rgba(40, 40, 30, ${(0.12 + 0.1 * k).toFixed(3)}), 0 0 0 ${(4 * k).toFixed(2)}px ${on && apply ? "rgba(105, 189, 69, 0.35)" : "rgba(243, 69, 69, 0.3)"}`;
      }
    };

    /** A card waiting under the top one, with no colour on it. */
    const rest = (j: number, slot: number, advance: number, opacity: number) => {
      const el = cards.current[j];
      if (!el) return;
      const from = slots[Math.min(slot, 2)];
      const to = slots[Math.max(slot - 1, 0)];
      el.style.transform = `translateY(${lerp(from.y, to.y, advance).toFixed(2)}px) scale(${lerp(from.s, to.s, advance).toFixed(4)})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(4 - Math.min(slot, 3));
      for (const r of [faces, yesFaces, noFaces]) {
        const f = r.current[j];
        if (f) f.style.opacity = "0";
      }
    };

    /** Round and round the deck. */
    const loop = (t: number) => {
      const turn = Math.floor(t / P.period);
      const u = t - turn * P.period;
      const front = turn % n;
      const advance = easeInOut(seg(u, P.out + 0.05 * pace, P.gone + 0.15 * pace));
      for (let j = 0; j < n; j++) {
        const slot = (j - front + n) % n;
        // The card that went last waits, unseen, in slot 3 and fades in.
        if (slot === 0) swipe(j, u);
        else rest(j, slot, advance, slot === 3 ? advance : 1);
      }
    };

    /** Through the deck once, to the empty feed, then back to the start. */
    const once = (t: number, r: NonNullable<Demo["run"]>) => {
      const through = r.lead + n * P.period;
      const cycle = through + r.hold + r.reset;
      const c = t % cycle;
      const k = c - r.lead;
      const turn = c < r.lead ? 0 : Math.min(n, Math.floor(k / P.period));
      const u = c < r.lead ? 0 : k - turn * P.period;
      // Back in at the end: the empty feed fades out as the first card fades in.
      const back = seg(c, cycle - r.reset, cycle);
      const empty = seg(c, through - 0.05, through + 0.3) * (1 - back);
      for (let j = 0; j < n; j++) {
        if (turn >= n) rest(j, j === 0 ? 0 : 1, 0, j === 0 ? back : 0);
        else if (j < turn) rest(j, 0, 0, 0);
        else if (j === turn) swipe(j, u);
        else rest(j, 1, 0, j === turn + 1 ? 1 : 0);
      }
      if (turn >= n && touch.current) touch.current.style.opacity = "0";
      // The empty feed arrives in turn: the folder bounces in, then the
      // heading, then the line under it.
      if (end.current) {
        end.current.style.opacity = String(1 - back);
        const [folder, head, line] = Array.from(end.current.children) as HTMLElement[];
        const a = c - through;
        const f = turn >= n ? spring(seg(a, 0, 0.7), 0.6) : 0;
        folder.style.opacity = String(clamp01(seg(a, 0, 0.2)) * (turn >= n ? 1 : 0));
        folder.style.transform = `translateY(${((1 - f) * 18).toFixed(2)}px) scale(${(0.6 + 0.4 * f).toFixed(3)})`;
        for (const [el, at] of [
          [head, 0.35],
          [line, 0.5],
        ] as const) {
          const k = turn >= n ? easeOut(seg(a, at, at + 0.4)) : 0;
          el.style.opacity = String(k);
          el.style.transform = `translateY(${((1 - k) * 10).toFixed(2)}px)`;
        }
      }
      for (const b of [yes.current, no.current]) if (b) b.style.opacity = String(1 - empty);
    };

    const draw = (t: number) => (run ? once(t, run) : loop(t));

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

  const label = {
    spine: "The Fortuna app's home screen: job cards swiped right to apply and left to dismiss, one after another.",
    error: "The Fortuna app's home screen: job cards swiped away one after another, with nothing to show whether each was an application or a dismissal.",
    comeback: "The Fortuna app's home screen: every job card dismissed in quick succession until the feed shows All Caught Up.",
  }[demo];

  return (
    <DotField captioned={!!caption}>
      <div ref={host} role="img" aria-label={label}>
        <PhoneMockup width="min(300px, 68vw)" grow>
          <AppChrome buttons={false} profileDone={!D.bio} />
          {D.bio && <BioBanner />}
          {D.run && <AllCaughtUp set={end} />}
          {D.deck.map(({ job }, j) => (
            <div
              key={`${job.title}-${j}`}
              ref={(el) => {
                cards.current[j] = el;
              }}
              style={{ position: "absolute", left: CARD.x, top: D.cardY, width: CARD.w, height: CARD.h, transformOrigin: "50% 100%", willChange: "transform" }}
            >
              <BigCard job={job}>
                {D.feedback && (
                  <>
                    <div ref={(el) => { faces.current[j] = el; }} style={{ position: "absolute", inset: 0, opacity: 0 }} />
                    <Stamp set={(el) => { yesFaces.current[j] = el; }} word="Apply" mark={<TickIcon size={84} color="#fff" />} />
                    <Stamp set={(el) => { noFaces.current[j] = el; }} word="Dismiss" mark={<CrossIcon size={84} color="#fff" />} />
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

/**
 * The app's Apply or Dismiss face, from Figma's "Applied" and "Rejected"
 * frames: a big white tick or cross, and the word in a white outlined box,
 * over the card's solid green or red.
 */
function Stamp({ set, word, mark }: { set: (el: HTMLDivElement | null) => void; word: string; mark: React.ReactNode }) {
  return (
    <div ref={set} style={{ position: "absolute", inset: 0, opacity: 0, transformOrigin: "50% 45%" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 108, display: "flex", justifyContent: "center" }}>{mark}</div>
      <div
        style={{
          position: "absolute",
          left: (CARD.w - 158) / 2,
          top: 243,
          width: 158,
          height: 56,
          border: "3px solid #fff",
          borderRadius: 4,
          boxSizing: "border-box",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontFamily: "var(--f-body)",
          fontSize: 27,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        {word}
      </div>
    </div>
  );
}

/** The feed run dry, as Figma's "Wait, Come Back End" frame has it. */
function AllCaughtUp({ set }: { set: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={set} style={{ position: "absolute", inset: 0, opacity: 0, color: "#6f8b81", fontFamily: "var(--f-body)", textAlign: "center" }}>
      <div style={{ position: "absolute", left: 110, top: 219, width: 155, height: 137, transformOrigin: "50% 80%" }}>
        <Image src="/fortuna/reel/all-caught-up.webp" alt="" fill sizes="160px" unoptimized draggable={false} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 394, fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em" }}>All Caught Up!</div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 448, fontSize: 15, lineHeight: 1.4 }}>
        There&apos;s no more jobs available right now. Come back in a few days!
      </div>
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
