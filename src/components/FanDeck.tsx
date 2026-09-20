"use client";

import Image from "next/image";
import { useState } from "react";

export type FanDeckCard = {
  src: string;
  alt: string;
};

export type FanDeckProps = {
  cards?: FanDeckCard[];
  /** Number of placeholder cards to render when `cards` is omitted. */
  count?: number;

  // Layout
  /** Horizontal gap between adjacent card centres, px. */
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

  transition?: "bouncy" | "smooth";
  className?: string;
};

const EASING = {
  bouncy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/**
 * Rotation is pushed alongside position but falls off on a slightly tighter
 * curve, so neighbours splay as well as slide. Both constants are lifted from
 * measurements of the reference deck.
 */
const PUSH_FALLOFF = 0.6;
const ROTATION_FALLOFF = 0.2;
const ROTATION_PUSH_RATIO = 1 / 30;

export default function FanDeck({
  cards,
  count = 7,
  spacing = 120,
  arcDepth = 13,
  rotationStep = 10,
  sizeDecay = 0.07,
  hoverScale = 1.05,
  hoverLift = 10,
  recedeScale = 0.96,
  pushForce = 150,
  cardWidth = 240,
  cardHeight = 360,
  borderRadius = 24,
  shadow = 0.25,
  transition = "bouncy",
  className,
}: FanDeckProps) {
  const [active, setActive] = useState<number | null>(null);

  const items = cards ?? Array.from({ length: count }, () => null);
  const n = items.length;
  const centre = (n - 1) / 2;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: cardHeight * 1.6 }}
      onMouseLeave={() => setActive(null)}
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
              transform: `translate(${x.toFixed(3)}px, ${y.toFixed(
                3,
              )}px) rotate(${rotate.toFixed(4)}deg) scale(${scale.toFixed(4)})`,
              transformOrigin: "center",
              transition: `transform 0.3s ${EASING[transition]}`,
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
                style={{ objectFit: "cover" }}
                draggable={false}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
