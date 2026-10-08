"use client";

import { useReducedMotion } from "motion/react";
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
 * Tinder's spine, played rather than described: the job seeker's home
 * screen, swiped for the reader the way a screen recording would show it —
 * a touch lands on the card, drags it right to apply or left to dismiss,
 * the card washes green or red as it goes, and the next one comes up. Apply,
 * dismiss, dismiss, apply, round and round.
 *
 * Slow on purpose. Each card sits long enough to be read, and the drag holds
 * at its furthest point before the card goes, so the colour and the button it
 * answers to are seen rather than flashed.
 *
 * Driven off one clock in a requestAnimationFrame loop that writes
 * transforms straight to the elements — nothing re-renders while it plays —
 * and the clock stops while the phone is off screen.
 */

/** The cards, in the order they come up, and what the swipe does with each. */
const DECK: { job: Job; apply: boolean }[] = [
  // The diner as on the home screen frame, with that frame's photo; the
  // reel's diner shows the booths instead.
  { job: { ...DINER, photo: "/fortuna/reel/job-waiter-card.webp" }, apply: true },
  {
    job: { title: "Window Cleaner", place: "Riverside Cleaning Co.", rating: "4.2", hours: "Part Time Job", days: "Weekdays", area: "Dave County", distance: "1.7 miles away", pay: "$24", photo: "/fortuna/reel/job-window-cleaner-card.webp" },
    apply: false,
  },
  {
    job: { title: "Pastry Chef", place: "Little John's Bakery", rating: "4.9", hours: "Full Time Job", days: "Weekdays", area: "Dave County", distance: "2.9 miles away", pay: "$27", photo: "/fortuna/reel/job-pastry-chef-card.webp" },
    apply: false,
  },
  {
    job: { title: "Carpenter", place: "Red Moose Engineering", rating: "3.8", hours: "Part Time Job", days: "Weekdays", area: "Dave County", distance: "0.4 miles away", pay: "$32", photo: "/fortuna/reel/job-carpenter-card.webp" },
    apply: true,
  },
];

/**
 * One card's turn, in seconds: it rests, the touch lands, the drag, a hold
 * at full stretch, then the throw while the stack moves up behind it.
 */
const T = { touch: 1.3, drag: 1.6, hold: 2.8, out: 3.15, gone: 3.7, period: 4.4 };
/** How far the drag carries the card, and how far the throw sends it. */
const DRAG = 120;
const THROW = 440;
/** Where the card sits, in the screen's units, and where the touch lands on it. */
const CARD = { x: 30, y: 166, w: 315, h: 511 };
const TOUCH = { x: 187, y: 470 };
/** The stack, front to back: Figma's Card 2 and Card 3 behind the front card. */
const SLOTS = [
  { s: 1, y: 0 },
  { s: 295 / 315, y: 3 },
  { s: 275 / 315, y: 8 },
];
const RED = "#f34545";

export default function SpineDemo() {
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
    const n = DECK.length;
    const draw = (t: number) => {
      const turn = Math.floor(t / T.period);
      const u = t - turn * T.period;
      const front = turn % n;
      const apply = DECK[front].apply;
      const dir = apply ? 1 : -1;

      // The drag: out to its furthest, held, then thrown.
      const pull = easeInOut(seg(u, T.drag, T.hold - 0.25));
      const thrown = easeOut(seg(u, T.out, T.gone)) ** 1.4;
      const dx = dir * (DRAG * pull + (THROW - DRAG) * thrown);
      const lift = -14 * pull;
      // The stack moving up behind the card as it goes.
      const advance = easeInOut(seg(u, T.out + 0.05, T.gone + 0.15));

      for (let j = 0; j < n; j++) {
        const el = cards.current[j];
        if (!el) continue;
        const slot = (j - front + n) % n;
        if (slot === 0) {
          el.style.transform = `translate(${dx.toFixed(2)}px, ${lift.toFixed(2)}px) rotate(${(dx / 16).toFixed(3)}deg)`;
          el.style.opacity = String(1 - seg(u, T.gone - 0.2, T.gone));
          el.style.zIndex = "4";
          const wash = clamp01(Math.abs(dx) / DRAG);
          const face = faces.current[j];
          if (face) {
            face.style.background = apply ? GREEN : RED;
            face.style.opacity = String(0.78 * wash);
          }
          const mark = (apply ? ticks : crosses).current[j];
          const other = (apply ? crosses : ticks).current[j];
          if (mark) {
            mark.style.opacity = String(wash);
            mark.style.transform = `scale(${lerp(0.6, 1, easeOut(wash)).toFixed(3)})`;
          }
          if (other) other.style.opacity = "0";
        } else {
          // Slots 1 and 2 move up one place; the card that went last waits,
          // unseen, in slot 3 and fades into slot 2.
          const from = SLOTS[Math.min(slot, 2)];
          const to = SLOTS[slot - 1];
          const s = lerp(from.s, to.s, advance);
          const y = lerp(from.y, to.y, advance);
          el.style.transform = `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
          el.style.opacity = slot === 3 ? String(advance) : "1";
          el.style.zIndex = String(4 - slot);
          const face = faces.current[j];
          if (face) face.style.opacity = "0";
          for (const m of [ticks.current[j], crosses.current[j]]) if (m) m.style.opacity = "0";
        }
      }

      // The touch: lands, rides the drag, lifts as the card is thrown.
      if (touch.current) {
        const on = easeOut(seg(u, T.touch, T.touch + 0.3)) * (1 - seg(u, T.out - 0.05, T.out + 0.2));
        const press = 1 - 0.18 * easeOut(seg(u, T.touch + 0.1, T.touch + 0.45));
        const tx = dir * DRAG * pull + dir * 40 * seg(u, T.out - 0.05, T.out + 0.2);
        touch.current.style.opacity = String(on);
        touch.current.style.transform = `translate(${tx.toFixed(2)}px, ${lift.toFixed(2)}px) scale(${press.toFixed(3)})`;
      }

      // The button the swipe answers to comes up as the drag commits.
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
  }, [reduced]);

  return (
    <DotField>
      <div ref={host} role="img" aria-label="The Fortuna app's home screen: job cards swiped right to apply and left to dismiss, one after another.">
        <PhoneMockup width="min(300px, 68vw)">
          <AppChrome buttons={false} />
          <BioBanner />
          {DECK.map(({ job }, j) => (
            <div
              key={job.title}
              ref={(el) => {
                cards.current[j] = el;
              }}
              style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, transformOrigin: "50% 100%", willChange: "transform" }}
            >
              <BigCard job={job}>
                <div ref={(el) => { faces.current[j] = el; }} style={{ position: "absolute", inset: 0, opacity: 0 }} />
                <Mark set={(el) => { ticks.current[j] = el; }}>
                  <TickIcon size={96} color="#fff" />
                </Mark>
                <Mark set={(el) => { crosses.current[j] = el; }}>
                  <CrossIcon size={96} color="#fff" />
                </Mark>
              </BigCard>
            </div>
          ))}
          <div ref={no} style={{ ...BUTTON, top: 705, left: 98, background: "#ff8989" }}>
            <CrossIcon />
          </div>
          <div ref={yes} style={{ ...BUTTON, top: 705, left: 214, background: "#ade495" }}>
            <TickIcon />
          </div>
          {/* The touch, as a screen recording shows it. */}
          <div
            ref={touch}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: TOUCH.x - 24,
              top: TOUCH.y - 24,
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
    </DotField>
  );
}

/** The big tick or cross on a card as it washes green or red. */
function Mark({ set, children }: { set: (el: HTMLDivElement | null) => void; children: React.ReactNode }) {
  return (
    <div
      ref={set}
      style={{ position: "absolute", left: 0, right: 0, top: 92, display: "flex", justifyContent: "center", opacity: 0 }}
    >
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
