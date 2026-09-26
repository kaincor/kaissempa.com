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
import SectionHeading from "@/components/SectionHeading";
import type { MountainRange as Range } from "@/data/mountainRanges";

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
 * Kai's photographs, paired one to a sentence.
 *
 * All five are cropped to the same 3:4 as they land, which keeps the pile
 * tidy. Four of them are natively 3:4 so nothing is lost; blender-nodes is a
 * 9:16 screenshot and gets a centre crop.
 *
 * rural-uganda arrived with EXIF orientation 6 — stored landscape, displayed
 * portrait. That is baked into the file in public/photos rather than left for
 * the browser and the optimiser to each interpret.
 */
const SLIDES: Slide[] = [
  {
    src: "/photos/rural-uganda.jpg",
    alt: "Rural Uganda",
    line: "I grew up in rural Uganda.",
    rest: { x: -38, y: -30, rot: -9 },
  },
  {
    src: "/photos/parents-at-graduation.jpg",
    alt: "Kai's parents at his graduation",
    line: "My parents devoted their careers to public health work in remote villages & I grew up working alongside them.",
    rest: { x: 30, y: 24, rot: 6.5 },
  },
  {
    src: "/photos/blender-nodes.jpg",
    alt: "A Blender node graph Kai built",
    line: "At Stanford, I study design & computer science. I'm also on the leadership team for the Black Student Engineers Club.",
    rest: { x: -24, y: 34, rot: -4 },
  },
  {
    src: "/photos/working-at-amouage.jpg",
    alt: "Kai working at Amouage",
    line: "I try to put a piece of myself into my work: assets from scratch. Illustrations. Custom fonts. I hand drew this font I'm using right now.",
    rest: { x: 36, y: -26, rot: 9 },
  },
  {
    src: "/photos/helmet.jpg",
    alt: "Kai in a mountain biking helmet",
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
/**
 * Headroom above and below the pile for the scatter to bleed into. Smaller on
 * a short screen, where the black band has to hold the pile and five sentences
 * one above the other rather than side by side.
 */
const PILE_PAD = "clamp(24px, 4svh, 44px)";
/** The same reserve sideways, where the tilt throws the corners furthest. */
const PILE_SIDE = "clamp(20px, 3.8vw, 46px)";

const ARC = 88;
/**
 * Where along the flight the bow reaches its widest, as an exponent on t.
 *
 * Above 1 pushes it late: at 1.35 the widest point falls around 61% of the
 * way up, so a photograph sweeps out and then hooks back in as it lands
 * rather than bulging in the middle of a journey nobody is looking at. The
 * curve wants to be where the eye already is, which is the arrival.
 */
const ARC_SKEW = 1.35;

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

export default function MoreAboutMe({
  range,
  heading = "More about me",
  ridgeHeight = "clamp(75px, 11vw, 190px)",
  color = "#000000",
  aboveColor = "#d4d4d4",
}: {
  /** The ridge that opens the section. It is part of the pinned scene. */
  range: Range;
  heading?: string;
  ridgeHeight?: string;
  color?: string;
  aboveColor?: string;
}) {
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const n = SLIDES.length;

  /**
   * Nothing in here carries the intro's lift, deliberately.
   *
   * position: sticky pins against the viewport, but a transform on an ancestor
   * drags the pinned element with it — measured, inheriting the lift put the
   * pin 180px above the top of the screen and took the heading off it
   * entirely. Cancelling it back inside only moves the problem, because the
   * bottom of the scene then falls short by the same amount.
   *
   * So the debt stops here instead. What it leaves is 180px of extra space
   * between the section above and this one, and since both are page grey at
   * that boundary, there is nothing to see. The block above had its own bottom
   * padding cut to keep the total honest.
   */

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
        // Above the ridge that closes this section. That ridge extends its
        // black upward behind itself, far enough to reach into this one, and
        // it comes later in the document — left level with it, the backing
        // block paints straight over the copy and the pile.
        zIndex: 1,
        // Tall enough to scrub through. The sticky child is what stays on
        // screen; reduced motion gets neither, just the settled pile.
        height: reduced ? "auto" : `${(1 + n * SCROLL_PER) * 100}svh`,
        background: color,
      }}
    >
      {/* The whole scene, pinned: heading, ridge, and the black the
          photographs fly up through. The heading and the ridge used to sit
          above this section in flow, which meant they had scrolled away
          before the pin even began and the screen was pure black for the
          entire animation. Inside the sticky they stay put and the pile has
          something to happen against. */}
      <div
        style={{
          position: reduced ? "relative" : "sticky",
          top: 0,
          height: reduced ? "auto" : "100svh",
          display: "flex",
          flexDirection: "column",
          background: aboveColor,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            // Enough to clear the floating navbar, which sits at top 20 and
            // is 42 tall and centred on the same axis as this heading.
            paddingTop: "clamp(34px, 8svh, 84px)",
            paddingBottom: "clamp(6px, 1.4svh, 18px)",
          }}
        >
          <SectionHeading paddingTop={0} paddingBottom={0}>
            {heading}
          </SectionHeading>
        </div>

        <svg
          viewBox={range.viewBox}
          preserveAspectRatio="none"
          width="100%"
          height={ridgeHeight}
          style={{ display: "block", flex: "0 0 auto" }}
          aria-hidden="true"
          focusable="false"
        >
          <path d={range.d} fill={color} />
        </svg>

        <div
          style={{
            flex: "1 1 auto",
            background: color,
            // Covers the fraction these paths stop short of their viewBox
            // floor, which would otherwise show as a hairline.
            marginTop: -3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
        <motion.div
          style={{
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

              The 38vw slope is steeper than the pile needs on its own. It is
              there to reach the ceiling early, at around 760px, which is where
              a tablet sits: the pile goes full size, the row can no longer hold
              both columns, and the layout stacks. Side by side on a 1024-tall
              screen the two columns came to 351px of content with 231px of
              black above it and 238px below — stacked, the same content uses
              the height instead of floating in it. Phones and desktops are
              both already at an end of the clamp, so neither moves.

              The svh term is a brake for short landscape windows. Width alone
              would hand a 1024x700 the full-size pile and leave the content
              exactly as tall as the black it sits in, with nothing to spare and
              an overflow a little below that.

              Above the copy, not behind it. A photograph swings wide enough on
              its way up to cross the column, and passing underneath the
              sentences reads as a z-order mistake where passing over them reads
              as depth. Nothing overlaps once the pile has settled, which is the
              state that has to stay clean. */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              flex: "0 1 clamp(165px, min(38vw, 37svh), 290px)",
              aspectRatio: "3 / 4",
              // Headroom for the scatter. The cards are positioned against
              // this box, but the resting offsets and the tilt carry them a
              // good way past its edges, and the copy sits directly against
              // both — underneath where the row wraps to a column, alongside
              // where it does not. Without the reserve the pile landed on the
              // first sentence on a phone and clipped the start of every line
              // on a tablet, where the column gap is narrower than the bleed.
              // Nothing may cover the text at rest; this is what guarantees it.
              paddingBlock: PILE_PAD,
              paddingInline: PILE_SIDE,
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
              fontSize: "clamp(14px, 1.7vw, 21px)",
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
    (v) => lerp(rest.x + ENTER.x, rest.x, easeInOut(v)) + ARC * Math.sin(Math.PI * Math.pow(v, ARC_SKEW)),
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
        left: PILE_SIDE,
        right: PILE_SIDE,
        top: PILE_PAD,
        bottom: PILE_PAD,
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
