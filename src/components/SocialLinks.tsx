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
 * The marks are knocked OUT of the chip rather than drawn on top, so the page
 * shows through the logo. That means each one has to exist as an SVG string for
 * a CSS mask, not as JSX — the chip is masked with [mark, solid] composited to
 * exclude, which subtracts the mark from the filled square.
 *
 * The marks are hand-drawn approximations, not official brand assets, and are
 * meant to be swapped for Kai's own versions.
 */
type Social = { name: string; href: string; rgb: string; mark: string };

/** Chip size, and how much of it the knocked-out mark occupies. */
const CHIP = 58;
const MARK = 34;
/** Deliberately gentler than the More About Me card's 10deg. */
const MAX_TILT = 6;
/**
 * Applied per chip, not to the row.
 *
 * Perspective is an absolute distance, so 1500px — right for a 380px card —
 * flattens a 58px chip almost entirely: foreshortening scales with the element,
 * and at that ratio the tilt was mathematically present but invisible. A short
 * perspective restores real depth at a small size.
 */
const CHIP_PERSPECTIVE = 260;
/** Distance, in chip widths, over which a chip stops reacting to the cursor. */
const FALLOFF = 3.2;

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
      const reach = b.width * FALLOFF;
      const dx = (e.clientX - (b.left + b.width / 2)) / reach;
      const dy = (e.clientY - (b.top + b.height / 2)) / reach;
      const dist = Math.hypot(dx, dy);

      // Direction and strength are separated on purpose. Feeding the raw offset
      // straight in inverted the effect: chips furthest from the cursor hit the
      // clamp and leaned hardest while the one under it barely moved. Strength
      // now falls off with distance and the direction is a unit vector, so the
      // nearest chips react and the far ones sit still.
      const strength = Math.max(0, 1 - dist);
      const ux = dist > 0 ? dx / dist : 0;
      const uy = dist > 0 ? dy / dist : 0;
      tilts[i].x.set(ux * strength);
      tilts[i].y.set(uy * strength);
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
    <motion.a
      ref={ref}
      href={social.href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={social.name}
      className="glass icon-shadow"
      style={
        {
          "--icon-shadow-rgb": social.rgb,
          width: CHIP,
          height: CHIP,
          borderRadius: 14,
          background: "rgba(5, 5, 5, 0.15)",
          display: "block",
          transformPerspective: CHIP_PERSPECTIVE,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          // The mark layer sits above the solid one and is subtracted from it,
          // leaving the logo as a hole through the chip.
          maskImage: `${mask}, linear-gradient(#000, #000)`,
          WebkitMaskImage: `${mask}, linear-gradient(#000, #000)`,
          maskSize: `${MARK}px ${MARK}px, 100% 100%`,
          WebkitMaskSize: `${MARK}px ${MARK}px, 100% 100%`,
          maskPosition: "center, center",
          WebkitMaskPosition: "center, center",
          maskRepeat: "no-repeat, no-repeat",
          WebkitMaskRepeat: "no-repeat, no-repeat",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
        } as React.CSSProperties
      }
    />
  );
});
