"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { forwardRef, useRef, type PointerEvent } from "react";

/**
 * Footer links as glass chips, matching the navbar exactly: rgba(5,5,5,0.15)
 * over a 32px blur with superellipse corners, via the shared .glass class.
 *
 * Each mark is painted in the page colour and floated in FRONT of its chip at
 * depth, the same arrangement as the wordmark over the photo in More About Me.
 * It reads as a cutout while the chip is still and separates from it as the
 * chip leans, which a real cutout cannot do — a hole moves with the surface it
 * is cut into.
 *
 * The marks are still SVG strings rather than JSX because they are used as CSS
 * masks: a plate of page colour with the logo masked out of it. They are
 * hand-drawn approximations, not official brand assets, and are meant to be
 * swapped for Kai's own versions.
 */
type Social = { name: string; href: string; rgb: string; mark: string };

/** Chip size, and how much of it the knocked-out mark occupies. */
const CHIP = 58;
const MARK = 34;
/**
 * Far steeper than the More About Me card's 10deg, and it still reads as the
 * gentler of the two. Degrees are the wrong unit to dampen in: what the eye
 * catches is how many PIXELS an edge moves, which is roughly
 * halfWidth * sin(angle) * (halfWidth / perspective). The card is 380px wide,
 * the chip 58 — a sixth of it — so matching the card's angle produces about a
 * tenth of its movement. At 6deg the near edge of a chip shifted by well under
 * a pixel, which is why it looked like nothing was happening at all. These
 * numbers put it at roughly 3px, about a third of the card's throw.
 */
const MAX_TILT = 16;
/**
 * Applied per chip, not to the row. Perspective is an absolute distance, so
 * 1500px — right for a 380px card — flattens a 58px chip almost entirely.
 */
const CHIP_PERSPECTIVE = 160;
/**
 * Distance, in chip widths, over which a chip stops reacting to the cursor.
 * Deliberately short: the row only reads as separate chips leaning if the one
 * under the cursor clearly out-leans its neighbours.
 */
const FALLOFF = 2;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * How far the mark floats in front of the chip face, px.
 *
 * What sells the float is the ratio to the perspective, not the number itself:
 * at 12 against 160 the mark sits about 8% nearer the viewer, so it renders 8%
 * larger than the chip and slides across it as the chip turns. More About Me
 * runs 70 against 1500, a shallower 4.7% — this one is pushed further because
 * a 58px chip has far less room to show the parallax.
 */
const MARK_DEPTH = 12;

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000">${body}</svg>`;

const LINKS: Social[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/kaissempa",
    rgb: "10 102 194",
    mark: svg(
      '<circle cx="4.8" cy="5" r="2.4"/><path d="M2.7 9.4h4.2v11.9H2.7z"/><path d="M9.4 9.4h4v1.7a4.2 4.2 0 0 1 3.8-2c3.1 0 4.8 2 4.8 5.6v6.6h-4.2v-5.8c0-1.6-.6-2.7-2-2.7-1.1 0-1.8.7-2.1 1.5-.1.3-.1.7-.1 1.1v5.9h-4.2z"/>',
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/kaincor",
    rgb: "110 118 129",
    mark: svg(
      '<path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.3-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.7 9.7 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.7 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8Z"/>',
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/kaincor/",
    rgb: "225 48 108",
    mark: svg(
      '<rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2" fill="none" stroke="#000" stroke-width="2.2"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="#000" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.4"/>',
    ),
  },
  {
    name: "Letterboxd",
    href: "https://boxd.it/4aEoT",
    rgb: "0 224 84",
    mark: svg(
      '<circle cx="6.4" cy="12" r="4.9"/><circle cx="12" cy="12" r="4.9"/><circle cx="17.6" cy="12" r="4.9"/>',
    ),
  },
  {
    name: "Dribbble",
    href: "https://dribbble.com/",
    rgb: "234 76 137",
    mark: svg(
      '<g fill="none" stroke="#000" stroke-width="2"><circle cx="12" cy="12" r="9.6"/><path d="M3.4 7.6c5.2 3.1 11.4 4.2 17.4 3.3"/><path d="M2.6 14.2c5.4-1 10.9.5 14.6 4.6"/><path d="M8.2 2.9c4 4.6 6.5 10.2 7 17.1"/></g>',
    ),
  },
  {
    name: "Behance",
    href: "https://www.behance.net/kaissempa",
    rgb: "23 105 255",
    mark: svg(
      '<path d="M2.4 6.1h5.4c2.3 0 3.8 1.1 3.8 2.9 0 1.2-.6 2.1-1.7 2.5 1.4.4 2.2 1.4 2.2 2.9 0 2.2-1.7 3.4-4.2 3.4H2.4Zm2.5 4.6h2.5c.9 0 1.5-.5 1.5-1.3s-.6-1.3-1.5-1.3H4.9Zm0 5h2.8c1.1 0 1.7-.5 1.7-1.4s-.6-1.4-1.7-1.4H4.9Z"/><path d="M14.1 7.1h5.9v1.6h-5.9z"/><path d="M17.3 9.9c2.4 0 4 1.7 4 4.2v.6h-5.6c.2 1.1.9 1.8 2.1 1.8.8 0 1.4-.3 1.7-.9h1.7c-.4 1.6-1.8 2.5-3.5 2.5-2.4 0-4.1-1.7-4.1-4.1s1.6-4.1 3.7-4.1Zm-1.6 3.4h3.6c-.2-1-.8-1.7-1.8-1.7s-1.6.7-1.8 1.7Z"/>',
    ),
  },
];

export default function SocialLinks() {
  const reduced = useReducedMotion();
  const areaRef = useRef<HTMLElement>(null);
  const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // One pair per chip rather than one for the row. Sharing a single rotation
  // turned the row into a rigid plane: every chip tilted identically, nothing
  // moved relative to anything, and the effect read as nothing at all.
  const tilts = LINKS.map(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const x = useMotionValue(0);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const y = useMotionValue(0);
    return { x, y };
  });

  function track(e: PointerEvent<HTMLElement>) {
    if (reduced) return;
    chipRefs.current.forEach((chip, i) => {
      if (!chip) return;
      const b = chip.getBoundingClientRect();
      const halfW = b.width / 2;
      const halfH = b.height / 2;
      const dx = e.clientX - (b.left + halfW);
      const dy = e.clientY - (b.top + halfH);

      // Same shape as the More About Me card: the lean is the cursor's offset
      // from the centre, normalised so the element's own edges are +/-1. An
      // earlier version used a unit direction vector scaled by nearness, which
      // reads well in the abstract and badly in practice — it means the chip
      // the cursor is actually sitting on is the one chip that does not move.
      //
      // The envelope is the only addition: without it every chip outside its
      // own bounds would sit permanently clamped at full tilt, and the row
      // would look posed rather than responsive.
      const envelope = Math.max(
        0,
        1 - Math.hypot(dx, dy) / (b.width * FALLOFF),
      );
      tilts[i].x.set(clamp(dx / halfW) * envelope);
      tilts[i].y.set(clamp(dy / halfH) * envelope);
    });
  }

  return (
    <nav
      ref={areaRef}
      aria-label="Elsewhere"
      onPointerMove={track}
      onPointerLeave={() => {
        tilts.forEach((t) => {
          t.x.set(0);
          t.y.set(0);
        });
      }}
      style={{
        maxWidth: "var(--content-max)",
        margin: "0 auto",
        padding: "72px 30px 96px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 34,
      }}
    >
      {LINKS.map((s, i) => {
        const mask = `url("data:image/svg+xml,${encodeURIComponent(s.mark)}")`;
        return (
          <Chip
            key={s.name}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            social={s}
            mask={mask}
            tilt={tilts[i]}
            reduced={!!reduced}
          />
        );
      })}
    </nav>
  );
}

/**
 * Three elements, and the split is load-bearing.
 *
 * The anchor carries the shadow and the hover lift, and must stay unmasked: a
 * mask clips everything an element paints, an outer box-shadow is painted
 * outside the border box, and the mask's solid layer only covers 100% of it.
 * With both on one element the brand glow was computed, inspectable, and never
 * drawn. Keeping the tilt off the anchor also leaves .icon-shadow's translateY
 * free to work rather than losing to an inline motion transform.
 *
 * The middle div is the 3D space. It deliberately carries no background, mask,
 * filter or opacity — any of those would collapse transform-style back to flat
 * and take the mark's depth with it.
 *
 * Then the glass plate and the floating mark are siblings inside it.
 */
const Chip = forwardRef<
  HTMLAnchorElement,
  {
    social: Social;
    mask: string;
    tilt: { x: MotionValue<number>; y: MotionValue<number> };
    reduced: boolean;
  }
>(function Chip({ social, mask, tilt, reduced }, ref) {
  const sx = useSpring(tilt.x, { stiffness: 140, damping: 16, mass: 0.5 });
  const sy = useSpring(tilt.y, { stiffness: 140, damping: 16, mass: 0.5 });
  const rotateY = useTransform(sx, [-1, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-1, 1], [MAX_TILT, -MAX_TILT]);

  return (
    <a
      ref={ref}
      href={social.href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={social.name}
      className="icon-shadow"
      style={
        {
          "--icon-shadow-rgb": social.rgb,
          width: CHIP,
          height: CHIP,
          borderRadius: 14,
          display: "block",
        } as React.CSSProperties
      }
    >
      <motion.div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformPerspective: CHIP_PERSPECTIVE,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          // Children keep their own depth instead of being flattened into this
          // element's plane — without it the mark would not parallax.
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <span
          className="glass"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: "rgba(5, 5, 5, 0.15)",
          }}
        />

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            // Page colour rather than a fixed hex, so the mark keeps matching
            // whatever the section behind it is painted.
            background: "var(--background)",
            maskImage: mask,
            WebkitMaskImage: mask,
            maskSize: `${MARK}px ${MARK}px`,
            WebkitMaskSize: `${MARK}px ${MARK}px`,
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            transform: `translateZ(${MARK_DEPTH}px)`,
            pointerEvents: "none",
          }}
        />
      </motion.div>
    </a>
  );
});
