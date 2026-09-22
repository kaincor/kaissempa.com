"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent } from "react";

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
const MAX_TILT = 4;

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

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 110, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 110, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [-1, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-1, 1], [MAX_TILT, -MAX_TILT]);

  function track(e: PointerEvent<HTMLElement>) {
    if (reduced) return;
    const el = areaRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    px.set(((e.clientX - b.left) / b.width) * 2 - 1);
    py.set(((e.clientY - b.top) / b.height) * 2 - 1);
  }

  return (
    <nav
      ref={areaRef}
      aria-label="Elsewhere"
      onPointerMove={track}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
      style={{
        maxWidth: "var(--content-max)",
        margin: "0 auto",
        padding: "72px 30px 96px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 34,
        perspective: 1500,
      }}
    >
      {LINKS.map((s) => {
        const mask = `url("data:image/svg+xml,${encodeURIComponent(s.mark)}")`;
        return (
          <motion.a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={s.name}
            className="glass icon-shadow"
            style={
              {
                "--icon-shadow-rgb": s.rgb,
                width: CHIP,
                height: CHIP,
                borderRadius: 14,
                background: "rgba(5, 5, 5, 0.15)",
                display: "block",
                rotateX: reduced ? 0 : rotateX,
                rotateY: reduced ? 0 : rotateY,
                // The mark layer sits above the solid one and is subtracted
                // from it, leaving the logo as a hole through the chip.
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
      })}
    </nav>
  );
}
