"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import SwipeDeck, { type Pose } from "@/components/SwipeDeck";
import type { MountainRange as Range } from "@/data/mountainRanges";

/**
 * Kai's photographs in a swipeable pile, one per sentence, with the sentence
 * for the photograph on top lit up.
 *
 * This used to be a pinned section the photographs flew up through as the
 * page scrolled, landing one at a time. The reader had no say in the pace
 * there; now the pile pops in whole and they go through it themselves.
 */
type Slide = { src: string; alt: string; line: string };

/**
 * Kai's photographs, paired one to a sentence, in the order they come up.
 *
 * All five are cropped to the same 3:4, which keeps the pile tidy. Four of
 * them are natively 3:4 so nothing is lost; blender-nodes is a 9:16
 * screenshot and gets a centre crop.
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
  },
  {
    src: "/photos/parents-at-graduation.jpg",
    alt: "Kai's parents at his graduation",
    line: "My parents devoted their careers to public health work in remote villages & I grew up working alongside them.",
  },
  {
    src: "/photos/blender-nodes.jpg",
    alt: "A Blender node graph Kai built",
    line: "At Stanford, I study design & computer science. I'm also on the leadership team for the Black Student Engineers Club.",
  },
  {
    src: "/photos/working-at-amouage.jpg",
    alt: "Kai working at Amouage",
    line: "I try to put a piece of myself into my work: assets from scratch. Illustrations. Custom fonts. I hand drew this font I'm using right now.",
  },
  {
    src: "/photos/helmet.jpg",
    alt: "Kai in a mountain biking helmet",
    line: "I enjoy bodybuilding, mountain biking & embroidery.",
  },
];

/**
 * The pile, front first: the scatter the old landed pile settled into, so it
 * looks the same at rest. The front is the tightest and most upright; each
 * one behind leaves an edge showing past the one above it.
 */
const POSES: Pose[] = [
  { x: -6, y: 6, rot: -2.5 },
  { x: 36, y: -26, rot: 9 },
  { x: -24, y: 34, rot: -4 },
  { x: 30, y: 24, rot: 6.5 },
  { x: -38, y: -30, rot: -9 },
];

/**
 * Headroom around the pile for the scatter to bleed into, so a tilted corner
 * never lands on the copy beside or below it.
 */
const PILE_PAD = "clamp(24px, 4svh, 44px)";
/** The same reserve sideways, where the tilt throws the corners furthest. */
const PILE_SIDE = "clamp(20px, 3.8vw, 46px)";

export default function MoreAboutMe({
  range,
  heading = "More about me",
  ridgeHeight = "clamp(75px, 11vw, 190px)",
  color = "#000000",
  aboveColor = "#d4d4d4",
}: {
  /** The ridge that opens the section. */
  range: Range;
  heading?: string;
  ridgeHeight?: string;
  color?: string;
  aboveColor?: string;
}) {
  const reduced = useReducedMotion();
  const copy = useRef<HTMLDivElement>(null);
  const seen = useInView(copy, { once: true, amount: 0.3 });
  const play = reduced || seen;
  const [front, setFront] = useState(0);

  return (
    <div
      style={{
        position: "relative",
        // Above the ridge that closes this section. That ridge extends its
        // black upward behind itself, far enough to reach into this one, and
        // it comes later in the document — left level with it, the backing
        // block paints straight over the copy and the pile.
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        background: aboveColor,
      }}
    >
      <div
        style={{
          // Enough to clear the floating navbar, which sits at top 20 and is
          // 42 tall and centred on the same axis as this heading.
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
        style={{ display: "block" }}
        aria-hidden="true"
        focusable="false"
      >
        <path d={range.d} fill={color} />
      </svg>

      <div
        style={{
          background: color,
          // Covers the fraction these paths stop short of their viewBox
          // floor, which would otherwise show as a hairline.
          marginTop: -3,
          paddingBlock: "clamp(28px, 7svh, 96px) clamp(48px, 10svh, 130px)",
        }}
      >
        <div
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
          {/* The pile. The 38vw slope reaches its ceiling at around 760px,
              where a tablet sits: the pile goes full size, the row can no
              longer hold both columns, and the layout stacks. */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              flex: "0 1 clamp(165px, min(38vw, 37svh), 290px)",
              paddingBlock: PILE_PAD,
              paddingInline: PILE_SIDE,
              boxSizing: "content-box",
            }}
          >
            <SwipeDeck
              cards={SLIDES}
              poses={POSES}
              sizes="(max-width: 760px) 60vw, 290px"
              label="Photos of Kai"
              onFrontChange={setFront}
              style={{ width: "100%", aspectRatio: "3 / 4" }}
            />
          </div>

          <div
            ref={copy}
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
            {SLIDES.map((slide, i) => (
              // Bright while its photograph is the one on top, so the eye is
              // always told which sentence belongs to what it is looking at.
              <p
                key={slide.src}
                style={{
                  margin: 0,
                  opacity: play ? 1 : 0,
                  transform: play ? "none" : "translateY(10px)",
                  color: i === front ? "#D9D9D9" : "#535353",
                  transition: reduced
                    ? undefined
                    : `opacity 0.6s ease-out ${i * 0.12}s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s, color 0.45s ease-out`,
                }}
              >
                {slide.line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
