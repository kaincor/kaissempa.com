"use client";

import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";
import { useRangeLift } from "@/components/MountainRange";

/**
 * A pinned section where photographs rise from below and settle into a loose
 * pile, one per sentence, each sentence lighting up as its photograph lands.
 *
 * The Framer component this started from is a different mechanic: a diagonal
 * conveyor where cards pass through a focal point and carry on out of frame.
 * Nothing accumulates there, and every card's size is a function of where it
 * sits on the belt, so all of them are being recalculated the whole time.
 *
 * This accumulates instead. Photographs arrive and stay, which is what makes a
 * pile read as a pile, and it is much cheaper: a card's transform depends only
 * on its own slice of the scroll, so before its turn and after it has landed
 * it is pinned at a constant and costs nothing.
 */
type Slide = {
  src: string;
  alt: string;
  line: string;
  /**
   * Resting offset from the pile's centre, px, and the tilt it settles at.
   *
   * Spread far enough that each photograph leaves an edge showing once the
   * next lands on it — a stack of five that all sit dead centre is just the
   * last photograph. The last entry is the tightest and the most upright,
   * so the pile reads as settling onto something rather than trailing off.
   */
  rest: { x: number; y: number; rot: number };
};

/**
 * Placeholders, reusing photographs the intro already shows. The mockup calls
 * for the graduation, family and mountain biking shots, which are not in the
 * repo yet: drop them into public/photos and swap src and alt here. The
 * sentences are the ones this section already carried, unchanged.
 */
const SLIDES: Slide[] = [
  {
    src: "/photos/kai-with-stick.jpg",
    alt: "Kai outdoors",
    line: "I grew up in rural Uganda.",
    rest: { x: -38, y: -30, rot: -9 },
  },
  {
    src: "/photos/kai-and-dia.jpg",
    alt: "Kai and Dia",
    line: "My parents devoted their careers to public health work in remote villages & I grew up working alongside them.",
    rest: { x: 30, y: 24, rot: 6.5 },
  },
  {
    src: "/photos/irving-raghad-cyprien-kai.jpg",
    alt: "Irving, Raghad, Cyprien and Kai",
    line: "At Stanford, I study design & computer science. I'm also on the leadership team for the Black Student Engineers Club.",
    rest: { x: -24, y: 34, rot: -4 },
  },
  {
    src: "/photos/kai-in-lake-lagunita.jpg",
    alt: "Kai at Lake Lagunita",
    line: "I try to put a piece of myself into my work: assets from scratch. Illustrations. Custom fonts. I hand drew this font I'm using right now.",
    rest: { x: 36, y: -26, rot: 9 },
  },
  {
    src: "/photos/snowboarding-with-ben.jpg",
    alt: "Kai snowboarding with Ben",
    line: "I enjoy bodybuilding, mountain biking & embroidery.",
    rest: { x: -6, y: 6, rot: -2.5 },
  },
];

/** Viewports of scrolling each photograph gets while the section is pinned. */
const SCROLL_PER = 0.5;
/**
 * Share of a photograph's slice spent travelling. The rest is dwell: it sits
 * alone on top of the pile, in clear view, before the next starts to rise over
 * it. Without the dwell a photograph is covered the instant it lands and never
 * gets the moment its sentence is written for.
 */
const TRAVEL = 0.74;
/** How far into the travel the sentence takes over as the bright one. */
const HANDOVER = 0.72;

/** Where a photograph starts out, relative to where it will come to rest. */
const ENTER = { x: 44, y: 620, rot: -14, scale: 0.82 };
/**
 * How far the path bows out to the right on the way up, px.
 *
 * This is the curve in the mockup's arrow. The photographs do not travel in a
 * straight line, they swing wide and hook back in, which is what keeps five
 * identical rises from reading as a machine feeding cards.
 */
const ARC = 62;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Start and length of one photograph's slice of the pinned scroll. */
function slice(i: number, n: number) {
  const step = 1 / (n + 0.45);
  return { start: i * step, span: step * TRAVEL };
}

export default function MoreAboutMe({ lift = 0 }: { lift?: number }) {
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const n = SLIDES.length;

  /**
   * Undoes the inherited lift, for this content only.
   *
   * position: sticky pins against the viewport, but a transform on an ancestor
   * moves the pinned element with it, and this section sits inside a block
   * carrying the intro's lift. Measured, the pin landed 169px above the top of
   * the screen and the composition sat that far high in it. Cancelling the same
   * motion value is exact at every scroll position, where a constant would only
   * be right once the lift had saturated.
   *
   * It does not cancel the ridge's own throw, which is a further 30px at most
   * and arrives slowly enough across a three-viewport pin to read as nothing.
   */
  const inherited = useRangeLift(lift);
  const counter = useTransform(inherited, (v) => -v);

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  // The only React state in here. Everything else is a motion value that never
  // touches the render loop, so this section re-renders five times across its
  // whole scroll rather than once a frame.
  const [active, setActive] = useState(-1);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    let next = -1;
    for (let i = 0; i < n; i++) {
      const { start, span } = slice(i, n);
      if ((p - start) / span >= HANDOVER) next = i;
    }
    setActive((prev) => (prev === next ? prev : next));
  });

  const settled = reduced || active >= n - 1;

  return (
    <div
      ref={track}
      style={{
        position: "relative",
        // Tall enough to scrub through. The sticky child is what stays on
        // screen; reduced motion gets neither, just the settled pile.
        height: reduced ? "auto" : `${(1 + n * SCROLL_PER) * 100}svh`,
      }}
    >
      <div
        style={{
          position: reduced ? "relative" : "sticky",
          top: 0,
          height: reduced ? "auto" : "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          style={{
            y: reduced ? 0 : counter,
            maxWidth: "var(--content-max)",
            width: "100%",
            margin: "0 auto",
            padding: "0 30px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(28px, 5vw, 72px)",
          }}
        >
          {/* The pile. A little smaller than the single photograph it replaces,
              as asked.

              Above the copy, not behind it. A photograph swings wide enough on
              its way up to cross the column, and passing underneath the
              sentences reads as a z-order mistake where passing over them reads
              as depth. Nothing overlaps once the pile has settled, which is the
              state that has to stay clean. */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              flex: "0 1 clamp(200px, 26vw, 290px)",
              aspectRatio: "3 / 4",
              // Headroom for the scatter. The cards are positioned against
              // this box but the offsets and the tilt carry them past its
              // edges, and where the row wraps to a column the copy sits
              // directly underneath — without this the bottom of the pile
              // landed on the first sentence, which is the one thing that is
              // not allowed to happen at rest. Block only: sideways the bleed
              // runs into the gap, which is empty.
              paddingBlock: 56,
              boxSizing: "content-box",
            }}
          >
            {SLIDES.map((slide, i) => (
              <Card
                key={slide.src}
                slide={slide}
                index={i}
                count={n}
                progress={scrollYProgress}
                reduced={!!reduced}
              />
            ))}
          </div>

          <div
            className="display"
            style={{
              flex: "1 1 340px",
              textAlign: "left",
              fontSize: "clamp(15px, 1.7vw, 21px)",
              lineHeight: 1.45,
              display: "flex",
              flexDirection: "column",
              gap: "0.7em",
            }}
          >
            {SLIDES.map((slide, i) => {
              const seen = reduced || i <= active;
              // Bright while its photograph is the one on top of the pile,
              // muted once the next has landed, so the eye is always told
              // which sentence belongs to what it is looking at. The last one
              // keeps the emphasis rather than dimming into nothing.
              const current = settled ? i === n - 1 : i === active;
              return (
                <p
                  key={slide.src}
                  style={{
                    margin: 0,
                    opacity: seen ? 1 : 0,
                    color: current ? "#D9D9D9" : "#535353",
                    transition: "opacity 0.75s ease-out, color 0.75s ease-out",
                  }}
                >
                  {slide.line}
                </p>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Card({
  slide,
  index,
  count,
  progress,
  reduced,
}: {
  slide: Slide;
  index: number;
  count: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const { rest } = slide;
  const { start, span } = slice(index, count);

  // Every card reads the same scroll value but only its own slice of it,
  // clamped at both ends: before its turn it waits below the frame, and once
  // it has landed its transform stops changing.
  const t = useTransform(progress, (p) => clamp01((p - start) / span));

  const x = useTransform(
    t,
    (v) => lerp(rest.x + ENTER.x, rest.x, easeInOut(v)) + ARC * Math.sin(Math.PI * v),
  );
  const y = useTransform(t, (v) => lerp(rest.y + ENTER.y, rest.y, easeOut(v)));
  const rotate = useTransform(t, (v) =>
    lerp(rest.rot + ENTER.rot, rest.rot, easeOut(v)),
  );
  const scale = useTransform(t, (v) => lerp(ENTER.scale, 1, easeOut(v)));
  const opacity = useTransform(t, (v) => clamp01(v / 0.2));

  return (
    <motion.div
      style={{
        position: "absolute",
        insetInline: 0,
        top: 56,
        bottom: 56,
        borderRadius: 14,
        overflow: "hidden",
        // Later photographs land on top, which is what makes it a pile rather
        // than a spread.
        zIndex: index + 1,
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
        ...(reduced
          ? { x: rest.x, y: rest.y, rotate: rest.rot }
          : { x, y, rotate, scale, opacity }),
        willChange: "transform",
      }}
    >
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        sizes="(max-width: 760px) 60vw, 290px"
        quality={85}
        style={{ objectFit: "cover" }}
        draggable={false}
      />
    </motion.div>
  );
}
