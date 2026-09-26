"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import FanDeck, {
  fanDeckIntroMs,
  type FanDeckCard,
} from "@/components/FanDeck";

/**
 * Photos are served from /public rather than framerusercontent.com. Hotlinking
 * the Framer CDN would tie this page's images to a site we are replacing.
 *
 * Originals live in assets/Images at ~3000px; these are capped at 1400 on the
 * long edge, which still covers a 240x360 card at 3x. Order here is the
 * left-to-right order in the fan.
 */
const PHOTOS: FanDeckCard[] = [
  { src: "/photos/eating-breakfast-in-utah.jpg", alt: "Eating breakfast in Utah" },
  { src: "/photos/snowboarding-with-ben.jpg", alt: "Snowboarding with Ben" },
  { src: "/photos/kai-and-dia.jpg", alt: "Kai and Dia" },
  { src: "/photos/kai-with-stick.jpg", alt: "Kai holding a stick" },
  { src: "/photos/bay-to-breakers.jpg", alt: "Kai at Bay to Breakers" },
  { src: "/photos/kai-in-lake-lagunita.jpg", alt: "Kai in Lake Lagunita" },
  { src: "/photos/irving-raghad-cyprien-kai.jpg", alt: "Irving, Raghad, Cyprien and Kai" },
];

const BODY = "#6E6E6E";
/** Stanford cardinal. */
const CARDINAL = "#8C1515";
const HIGHLIGHT = "#D9D9D9";

type Segment = { text: string; color?: string };

/**
 * Read from FanDeck so retuning the fan cannot desynchronise the copy. Starts
 * halfway through the fan rather than after it: waiting for the whole intro
 * left too long a pause before the first line appeared.
 */
const DECK_INTRO_MS = Math.round(fanDeckIntroMs(PHOTOS.length) * 0.5);
const LINE_STAGGER_MS = 280;
const LINE_FADE_MS = 620;

/**
 * Kaicords has no typographic apostrophe (U+2019) and no em dash, so this copy
 * uses straight quotes only. A curly one renders as tofu.
 */
const COPY: Segment[][] = [
  [
    { text: "I'm currently studying design & computer science at " },
    { text: "Stanford", color: CARDINAL },
    { text: "." },
  ],
  [
    { text: "I love using both " },
    // Highlighted as one phrase, ampersand included, so the pairing reads as a
    // unit rather than two white words with a grey join between them.
    { text: "design & development", color: HIGHLIGHT },
    { text: " to make things that are fun & functional." },
  ],
  [{ text: "I also enjoy mountain biking & do it competitively." }],
];

export default function About() {
  const copyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(copyRef, { once: true, amount: 0.4 });
  const play = reduced ? true : inView;

  return (
    <section
      style={{
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 55,
        // The bottom value scales: 35px is right under desktop-sized copy and
        // reads as a hole under the much smaller type on a phone.
        padding: "0 30px clamp(10px, 2.2vw, 35px)",
      }}
    >
      <FanDeck cards={PHOTOS} frameHeight={460} />

      <div
        ref={copyRef}
        className="display"
        style={{
          // Sized to its longest line rather than a fixed width, so the
          // "I love using both..." sentence stays on one line at any font size
          // and only wraps once the viewport genuinely cannot fit it.
          width: "fit-content",
          maxWidth: "100%",
          color: BODY,
          textAlign: "center",
          fontSize: "clamp(15px, 1.7vw, 21px)",
          lineHeight: 1.45,
          display: "flex",
          flexDirection: "column",
          gap: "0.45em",
        }}
      >
        {COPY.map((line, i) => (
          <p
            key={i}
            style={{
              opacity: play ? 1 : 0,
              transform: play ? "translateY(0)" : "translateY(10px)",
              transition: reduced
                ? undefined
                : `opacity ${LINE_FADE_MS}ms ease-out ${
                    DECK_INTRO_MS + i * LINE_STAGGER_MS
                  }ms, transform ${LINE_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${
                    DECK_INTRO_MS + i * LINE_STAGGER_MS
                  }ms`,
            }}
          >
            {line.map((seg, j) => (
              <span key={j} style={seg.color ? { color: seg.color } : undefined}>
                {seg.text}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
