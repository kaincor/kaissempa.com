"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { GLOBE, MIAMI } from "@/content/globe-dots";

/**
 * The Fortuna pin, dropped onto Miami once the globe has finished arriving.
 *
 * Positioned in per cent of the globe's frame rather than pixels, because the
 * frame is fluid — `min(760px, 100%)` — and a pixel offset would slide off the
 * coast on a phone. The anchor itself comes from the generator, worked out
 * with the same projection that places the dots, so the pin cannot drift away
 * from the coastline the first time a camera constant is retuned.
 */

const { W, H } = GLOBE;

/** The asset, in its own units. The tip is the point that has to hit Miami. */
const PIN_W = 77;
const TIP_X = 38.5;
const TIP_Y = 121.5;

/**
 * Rendered width, in frame units. Small: this is a marker, not a monument —
 * but not so small that the lockup inside it stops being a lockup on a phone,
 * where the whole globe is 300px across.
 */
const SIZE = 40;
const SCALE = SIZE / PIN_W;

/** How far above the surface it starts, in frame units. */
const FALL = 58;
/**
 * How close the tip has to get before the surface counts as struck, in frame
 * units. Not zero: the spring approaches its target asymptotically, and at
 * this size the last unit and a half is not a gap anyone can see.
 */
const TOUCH_AT = 1.5;

/**
 * The shadow.
 *
 * The body is lit from the upper left, so the shadow goes down and to the
 * right. It is squashed by `MIAMI.z` — how square-on that patch of surface is
 * to the reader — which is what stops it reading as a sticker: near the rim
 * the ground is turning away, and a circle on it is seen almost edge-on.
 */
const SHADOW_RX = SIZE * 0.42;
const SHADOW_RY = SHADOW_RX * 0.34 * MIAMI.z;
const SHADOW_DX = SIZE * 0.13;
const SHADOW_DY = SIZE * 0.05;
/** Ambient, not dramatic. Any darker and it becomes the thing you notice. */
const SHADOW_STRENGTH = 0.16;

export default function MiamiPin({
  drop,
  onTouch,
}: {
  /** Set once the globe has finished rising. */
  drop: boolean;
  /** The tip meeting the surface. Fires before the spring has stopped. */
  onTouch: () => void;
}) {
  const reduced = useReducedMotion();
  const touched = useRef(false);

  // Reduced motion gets the pin, just not the journey. It is information —
  // this is where Fortuna launched — not decoration.
  if (reduced) {
    return (
      <Frame>
        <g opacity={SHADOW_STRENGTH}>
          <Shadow />
        </g>
        <g transform={`translate(${MIAMI.x - TIP_X * SCALE} ${MIAMI.y - TIP_Y * SCALE}) scale(${SCALE})`}>
          <PinArt />
        </g>
      </Frame>
    );
  }

  return (
    <Frame>
      {/* The shadow stays put and deepens as the pin nears it. Tying it to the
          pin's own transform would carry it up into the air, which is the one
          thing a shadow never does. */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={drop ? { opacity: SHADOW_STRENGTH } : undefined}
        transition={{ duration: 0.34, delay: 0.16, ease: "easeOut" }}
      >
        <Shadow />
      </motion.g>

      <motion.g
        initial={{ y: -FALL, opacity: 0 }}
        animate={drop ? { y: 0, opacity: 1 } : undefined}
        // Contact, not rest. A spring is mostly tail: the tip reaches the
        // surface early and then spends a few hundred milliseconds settling
        // onto it, and waiting for that made the dots flinch long after they
        // had been hit. Measured, this fires roughly 300ms sooner.
        onUpdate={(latest) => {
          if (touched.current) return;
          const y = latest.y;
          if (typeof y === "number" && y > -TOUCH_AT) {
            touched.current = true;
            onTouch();
          }
        }}
        transition={{
          y: { type: "spring", stiffness: 520, damping: 17, mass: 0.7 },
          opacity: { duration: 0.14 },
        }}
      >
        <g
          transform={`translate(${MIAMI.x - TIP_X * SCALE} ${MIAMI.y - TIP_Y * SCALE}) scale(${SCALE})`}
        >
          <PinArt />
        </g>
      </motion.g>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "block",
        // Over the dots, and deaf to the pointer so the cursor scatter below
        // still feels the mouse pass across it.
        pointerEvents: "none",
      }}
    >
      <defs>
        {/* Soft to nothing at the edge. A hard-edged ellipse under a pin this
            small reads as a second object rather than as shade. */}
        <radialGradient id="fp-shadow">
          <stop offset="0%" stopColor="#32443e" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#32443e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#32443e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {children}
    </svg>
  );
}

function Shadow() {
  return (
    <ellipse
      cx={MIAMI.x + SHADOW_DX}
      cy={MIAMI.y + SHADOW_DY}
      rx={SHADOW_RX}
      ry={SHADOW_RY}
      fill="url(#fp-shadow)"
    />
  );
}

/**
 * The asset, verbatim, minus its own sizing so the frame can place it.
 *
 * The green cut rather than the white one. On a body that runs #fffdf8 to
 * #e9e7e1 a cream pin has nothing to push against and survives on its outline
 * alone; green is the one colour in the palette the globe cannot swallow.
 */
function PinArt() {
  return (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.5 38.5389C75.5 18.0829 58.9347 1.5 38.5003 1.5C18.0653 1.5 1.5 18.0829 1.5 38.5389C1.5 44.4343 2.88239 50.0052 5.33113 54.9528L5.32481 54.956L38.5003 121.5L71.6752 54.956L71.6689 54.9528C74.1176 50.0052 75.5 44.4343 75.5 38.5389"
        fill="#69BD45"
      />
      <path
        d="M75.5 38.5389C75.5 18.0829 58.9347 1.5 38.5003 1.5C18.0653 1.5 1.5 18.0829 1.5 38.5389C1.5 44.4343 2.88239 50.0052 5.33113 54.9528L5.32481 54.956L38.5003 121.5L71.6752 54.956L71.6689 54.9528C74.1176 50.0052 75.5 44.4343 75.5 38.5389"
        // The asset carries `fill="none"` on its root element, which is not
        // here any more — without this the outline path fills black and the
        // pin comes out a silhouette.
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
      />
      <rect x="18.5" y="18.5" width="40" height="40" rx="4" fill="#F7F5F0" />
      <path
        d="M25.9639 53.875V51.6686L27.9327 51.236L27.9976 44.7898V36.0508H25.5312V33.1954L28.149 32.871C28.6466 29.3234 29.7716 27.2901 31.5024 25.538C33.7524 23.2883 36.9111 22.25 39.637 22.25C42.1899 22.25 44.6563 23.072 45.2188 25.6677C45.2188 27.528 44.0072 28.9124 41.9303 28.9124C40.3293 28.9124 38.988 27.8309 37.7332 25.1053L37.6466 24.9107C36.3486 26.533 36.0024 28.6961 36.1106 32.8061H40.1995V36.0508H36.2188V44.7898L36.2837 50.9115L39.3774 51.6686V53.875H27.8678H25.9639Z"
        fill="#69BD45"
      />
      <path
        d="M42.9977 50.4399C42.9977 48.1034 44.8625 46.1562 47.2477 46.1562C49.6329 46.1562 51.4977 48.1034 51.4977 50.4399C51.4977 52.7332 49.6329 54.5938 47.2477 54.5938C44.8625 54.5938 42.9977 52.7332 42.9977 50.4399Z"
        fill="#F58120"
      />
    </>
  );
}
