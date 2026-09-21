"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type FanDeckCard = {
  src: string;
  alt: string;
};

export type FanDeckProps = {
  cards?: FanDeckCard[];
  /** Number of placeholder cards to render when `cards` is omitted. */
  count?: number;

  // Layout
  /**
   * Horizontal gap between adjacent card centres, px. Kai's Framer frame is
   * 630px, which would imply 65 for seven cards — but the live deck renders
   * cards outside that frame, so the frame never bounded the fan and 65 reads
   * far too tight. This is a spread the fan wears well at, scaled to fit.
   */
  spacing?: number;
  /** Vertical arc depth. Each card drops `arcDepth * d²` px, d = steps from centre. */
  arcDepth?: number;
  /** Rotation added per step away from centre, degrees. */
  rotationStep?: number;
  /** Scale removed per step away from centre. 0.07 => neighbours at 0.93. */
  sizeDecay?: number;

  // Hover
  /** Multiplier applied to the hovered card's resting scale. */
  hoverScale?: number;
  /** Pixels the hovered card rises. */
  hoverLift?: number;
  /**
   * Scale applied to every card that is NOT hovered, so the deck recedes as one
   * card comes forward. Multiplies the resting scale.
   */
  recedeScale?: number;
  /** How hard neighbours are shoved aside. Falls off as 1 / (distance + 0.6). */
  pushForce?: number;

  // Card
  cardWidth?: number;
  cardHeight?: number;
  borderRadius?: number;
  /** Shadow opacity, 0–1. */
  shadow?: number;

  /** Height of the deck's frame. Defaults to 1.6x the card height. */
  frameHeight?: number;
  /** Pixels the stack sits below its resting position before the intro runs. */
  introRise?: number;
  /** Per-card delay outward from the centre, ms. 0 disables the stagger. */
  introStagger?: number;
  introDuration?: number;
  transition?: "bouncy" | "smooth";
  className?: string;
};

/**
 * Defaults match Kai's configured Framer instance (hoverBoost 1.15, hoverLift
 * 30, pushForce 125, radius 10, shadow 0.5, smooth), not the marketplace demo
 * the geometry was originally measured from.
 */
const EASING = {
  bouncy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/**
 * Rotation is pushed alongside position but falls off on a slightly tighter
 * curve, so neighbours splay as well as slide. Both constants are lifted from
 * measurements of the reference deck.
 */
/**
 * Intro timing, exported so anything sequencing itself after the fan reads the
 * real numbers instead of copying them. `fanDeckIntroMs` is the point at which
 * the last card has settled.
 */
export const FAN_DECK_INTRO = { rise: 56, stagger: 120, duration: 1500 };

export function fanDeckIntroMs(
  cardCount: number,
  o: typeof FAN_DECK_INTRO = FAN_DECK_INTRO,
) {
  return o.duration + o.stagger * Math.ceil((cardCount - 1) / 2) + 60;
}

const PUSH_FALLOFF = 0.6;
const ROTATION_FALLOFF = 0.2;
const ROTATION_PUSH_RATIO = 1 / 30;

export default function FanDeck({
  cards,
  count = 7,
  spacing = 118,
  arcDepth = 13,
  rotationStep = 10,
  sizeDecay = 0.07,
  hoverScale = 1.15,
  hoverLift = 30,
  recedeScale = 0.96,
  pushForce = 125,
  cardWidth = 240,
  cardHeight = 360,
  borderRadius = 10,
  shadow = 0.5,
  frameHeight,
  introRise = FAN_DECK_INTRO.rise,
  introStagger = FAN_DECK_INTRO.stagger,
  introDuration = FAN_DECK_INTRO.duration,
  transition = "smooth",
  className,
}: FanDeckProps) {
  const [active, setActive] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  // The deck sits below the fold, so the intro waits until it is actually
  // looked at rather than firing on load and being missed.
  const reduced = useReducedMotion();
  const inView = useInView(frameRef, { once: true, amount: 0.3 });
  const entered = reduced ? true : inView;

  // Once the fan has arrived, hand the transition back to the hover timing.
  // Leaving the long intro easing in place would make hovering feel sluggish.
  // Derived rather than set in the effect, so reduced motion needs no render.
  const [introDone, setIntroDone] = useState(false);
  const settled = reduced || introDone;

  const items = cards ?? Array.from({ length: count }, () => null);
  const n = items.length;
  const centre = (n - 1) / 2;
  const frameH = frameHeight ?? cardHeight * 1.6;

  useEffect(() => {
    if (!entered || reduced) return;
    const last = introStagger * Math.ceil((n - 1) / 2);
    const t = setTimeout(() => setIntroDone(true), introDuration + last + 60);
    return () => clearTimeout(t);
  }, [entered, reduced, introStagger, introDuration, n]);

  // The fan is wider than its container on narrow screens, and the outer cards
  // would simply be cut off. Scale the whole arrangement to fit instead of
  // reflowing it, so the composition holds as the window narrows.
  //
  // Headroom covers the hovered card's growth plus a little slack. It
  // deliberately does NOT reserve the full push distance: neighbours only
  // splay while a card is hovered, and reserving for that permanently would
  // shrink the resting fan to pay for a transient state. The overflow is not
  // clipped, so a hover near the edge simply spills into the page margin.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const headroom = (cardWidth * (hoverScale - 1)) / 2 + 24;
    const natural = spacing * (n - 1) + cardWidth + headroom * 2;
    const measure = () => setFit(Math.min(1, el.clientWidth / natural));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [spacing, n, cardWidth, hoverScale]);

  return (
    <div
      ref={frameRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: Math.round(frameH * fit),
      }}
      onMouseLeave={() => setActive(null)}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: frameH,
          transform: `translateY(-50%) scale(${fit})`,
          transformOrigin: "center",
        }}
      >
      {items.map((card, i) => {
        const d = i - centre;
        const away = Math.abs(d);

        let x = spacing * d;
        let y = arcDepth * d * d;
        let rotate = rotationStep * d;
        let scale = 1 - sizeDecay * away;

        if (active !== null) {
          if (i === active) {
            y -= hoverLift;
            scale *= hoverScale;
          } else {
            const offset = i - active;
            const distance = Math.abs(offset);
            const direction = Math.sign(offset);
            x += (direction * pushForce) / (distance + PUSH_FALLOFF);
            rotate +=
              (direction * pushForce * ROTATION_PUSH_RATIO) /
              (distance + ROTATION_FALLOFF);
            scale *= recedeScale;
          }
        }

        return (
          <div
            key={i}
            tabIndex={0}
            role={card ? "img" : undefined}
            aria-label={card?.alt}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: cardWidth,
              height: cardHeight,
              marginLeft: -cardWidth / 2,
              marginTop: -cardHeight / 2,
              borderRadius,
              overflow: "hidden",
              // Rounded to keep subpixel jitter out of the compositor.
              zIndex: Math.round(100 - away * 10),
              // Before the intro the cards are a single squared-up stack sitting
              // low; entering fans them to their resting transforms.
              transform: entered
                ? `translate(${x.toFixed(3)}px, ${y.toFixed(
                    3,
                  )}px) rotate(${rotate.toFixed(4)}deg) scale(${scale.toFixed(
                    4,
                  )})`
                : `translate(0px, ${introRise}px) rotate(0deg) scale(1)`,
              opacity: entered ? 1 : 0,
              transformOrigin: "center",
              transition: settled
                ? `transform 0.3s ${EASING[transition]}`
                : `transform ${introDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${
                    away * introStagger
                  }ms, opacity ${Math.round(introDuration * 0.55)}ms ease-out ${
                    away * introStagger
                  }ms`,
              willChange: "transform",
              boxShadow: `0 15px 35px rgba(0, 0, 0, ${shadow})`,
              background: card
                ? undefined
                : `hsl(0 0% ${70 - away * 6}%)`,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {card ? (
              <Image
                src={card.src}
                alt={card.alt}
                fill
                sizes={`${cardWidth}px`}
                // 85 rather than the default 75. In AVIF that is about 5 KB
                // more per card at the size these render, which is cheap for
                // photographs where 75 starts smearing skin tones and foliage.
                quality={85}
                style={{ objectFit: "cover" }}
                draggable={false}
              />
            ) : null}
          </div>
        );
      })}
      </div>
    </div>
  );
}
