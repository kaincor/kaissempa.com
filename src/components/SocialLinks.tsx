"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
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
 * The marks are SVG strings rather than JSX because they are used as CSS
 * masks: a plate of page colour with the logo masked out of it. Dribbble and
 * Letterboxd are Kai's own drawings; the rest are still approximations waiting
 * to be replaced the same way.
 *
 * A mark can be more than one layer. Letterboxd is two, at different depths,
 * so its middle circle floats clear of the pair behind it.
 */
type Layer = {
  svg: string;
  /** px in front of the chip face. Larger reads as nearer. */
  depth: number;
};
type Social = {
  name: string;
  href: string;
  rgb: string;
  layers: Layer[];
  /** mask-size for this mark. Defaults to a square at MARK_PCT. */
  size?: string;
};

/**
 * Chip size, and how much of it the mark occupies.
 *
 * The chip is a CSS length rather than a number because all six have to hold
 * one line at any width — wrapping a set of six onto two rows reads as an
 * accident, not a layout. At the 10.4vw slope a 375px phone gets a 39px chip
 * and the row lands inside its padding with room to spare; everything from
 * about 560px up sits at the full 58.
 *
 * The mark is a percentage of the chip for the same reason: a fixed 34px would
 * swell to fill the whole square as the chip shrank.
 */
const CHIP = "clamp(34px, 10.4vw, 58px)";
const MARK_PCT = `${((34 / 58) * 100).toFixed(1)}%`;
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

/**
 * Pixels the row of chips trails behind the ridge above it before settling,
 * giving the two some relative motion on the way in.
 *
 * The ridge block and the chips are measured against the same span of scroll
 * but travel different distances, which is the whole of the effect: moving
 * them together would just be one block sliding.
 */
const ICON_DRIFT = 46;

/**
 * Only the ALPHA of these ever reaches the screen — they are mask images, so
 * the fill colour is irrelevant and the chip's own page-grey shows through
 * wherever the drawing is opaque. Kai's source files ship in brand colours;
 * they are recoloured to black here purely so the intent is readable.
 */
const svg = (body: string, viewBox = "0 0 24 24") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="#000">${body}</svg>`;

/** A single-layer mark at the shared depth, which is most of them. */
const flat = (body: string, viewBox?: string): Layer[] => [
  { svg: svg(body, viewBox), depth: MARK_DEPTH },
];

/**
 * Letterboxd's three discs overlap, and in the real mark they are told apart by
 * colour. A single-colour cutout has no colour to tell them apart with, so all
 * three merge into one lozenge — which is what the old hand-drawn one did.
 *
 * So it is built as two layers. The back layer draws the outer pair with a ring
 * carved out of them where the middle disc will sit; the front layer is that
 * middle disc, floated nearer. Head-on the carved ring reads as a hairline
 * between the discs. Under the tilt the middle one slides across the other two.
 *
 * The ring is cut wider than the overlap on purpose. The front layer is nearer
 * the viewer, so perspective renders it slightly larger than the hole it sits
 * in and it eats into the gap from both sides.
 */
const LB = { r: 8.50158, cy: 8.50158, mid: 21.8224, view: "0 0 44 18" };

const LETTERBOXD: Layer[] = [
  {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LB.view}">` +
      `<mask id="a" maskUnits="userSpaceOnUse" x="0" y="0" width="44" height="18">` +
      `<circle cx="8.50158" cy="${LB.cy}" r="${LB.r}" fill="#fff"/>` +
      `<circle cx="35.5045" cy="${LB.cy}" r="${LB.r}" fill="#fff"/>` +
      `<circle cx="${LB.mid}" cy="8.52501" r="${LB.r}" fill="none" stroke="#000" stroke-width="2.2"/>` +
      `</mask>` +
      `<rect width="44" height="18" fill="#000" mask="url(#a)"/></svg>`,
    depth: 8,
  },
  {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LB.view}">` +
      `<circle cx="${LB.mid}" cy="8.52501" r="${LB.r}" fill="#000"/></svg>`,
    depth: 18,
  },
];

const LINKS: Social[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/kaissempa",
    rgb: "10 102 194",
    layers: flat(
      '<circle cx="4.8" cy="5" r="2.4"/><path d="M2.7 9.4h4.2v11.9H2.7z"/><path d="M9.4 9.4h4v1.7a4.2 4.2 0 0 1 3.8-2c3.1 0 4.8 2 4.8 5.6v6.6h-4.2v-5.8c0-1.6-.6-2.7-2-2.7-1.1 0-1.8.7-2.1 1.5-.1.3-.1.7-.1 1.1v5.9h-4.2z"/>',
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/kaincor",
    rgb: "110 118 129",
    layers: flat(
      '<path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.3-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.7 9.7 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.7 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8Z"/>',
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/kaincor/",
    rgb: "225 48 108",
    layers: flat(
      '<rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2" fill="none" stroke="#000" stroke-width="2.2"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="#000" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.4"/>',
    ),
  },
  {
    name: "Letterboxd",
    href: "https://boxd.it/4aEoT",
    rgb: "0 224 84",
    layers: LETTERBOXD,
    // Wider than it is tall, so the square default would shrink it to match
    // its height and leave the chip looking half empty. auto keeps the ratio.
    size: "74% auto",
  },
  {
    name: "Dribbble",
    href: "https://dribbble.com/",
    rgb: "234 76 137",
    // Kai's drawing. Every stroke is an outlined path rather than a stroke, so
    // it scales without the weight drifting.
    layers: flat(
      '<path d="M15.0172 30.0343C6.73835 30.0343 0 23.296 0 15.0172C0 6.73835 6.73835 0 15.0172 0C23.296 0 30.0343 6.73835 30.0343 15.0172C30.0343 23.296 23.296 30.0343 15.0172 30.0343ZM15.0172 2.42212C8.07052 2.42212 2.42212 8.07052 2.42212 15.0172C2.42212 21.9638 8.07052 27.6122 15.0172 27.6122C21.9638 27.6122 27.6122 21.9638 27.6122 15.0172C27.6122 8.07052 21.9638 2.42212 15.0172 2.42212Z"/><path d="M10.658 13.5409C7.81932 13.5409 4.74806 13.1194 1.47334 12.2668C0.824209 12.0973 0.436669 11.4384 0.606218 10.7893C0.775767 10.1402 1.43459 9.75265 2.08372 9.9222C12.0048 12.4993 19.7701 10.8668 24.5368 5.20874C24.968 4.70009 25.7334 4.63227 26.242 5.06341C26.7555 5.49455 26.8185 6.25994 26.3874 6.76859C22.604 11.2592 17.2559 13.5409 10.658 13.5409Z"/><path d="M4.60482 25.2897C4.32386 25.2897 4.04774 25.1928 3.82006 24.999C3.31141 24.5631 3.25328 23.7977 3.68442 23.289C10.7667 15.0102 19.932 13.0434 28.8309 17.9022C29.4171 18.2219 29.635 18.9583 29.3153 19.5444C28.9956 20.1306 28.2593 20.3486 27.6731 20.0289C16.9867 14.2012 9.2117 20.5569 5.52523 24.8683C5.28786 25.1444 4.94877 25.2897 4.60482 25.2897Z"/><path d="M18.9862 29.4539C18.9426 29.4539 18.8991 29.4539 18.8555 29.449C18.1918 29.3764 17.7122 28.7805 17.7849 28.112C18.7295 19.4505 16.5011 10.7163 11.1676 2.14198C10.814 1.5752 10.9884 0.82919 11.5552 0.47556C12.1219 0.12193 12.868 0.296323 13.2216 0.8631C18.8506 9.90732 21.1952 19.1647 20.1925 28.3784C20.1198 28.9985 19.5966 29.4539 18.9862 29.4539Z"/>',
      "0 0 31 31",
    ),
  },
  {
    name: "Behance",
    href: "https://www.behance.net/kaissempa",
    rgb: "23 105 255",
    layers: flat(
      '<path d="M2.4 6.1h5.4c2.3 0 3.8 1.1 3.8 2.9 0 1.2-.6 2.1-1.7 2.5 1.4.4 2.2 1.4 2.2 2.9 0 2.2-1.7 3.4-4.2 3.4H2.4Zm2.5 4.6h2.5c.9 0 1.5-.5 1.5-1.3s-.6-1.3-1.5-1.3H4.9Zm0 5h2.8c1.1 0 1.7-.5 1.7-1.4s-.6-1.4-1.7-1.4H4.9Z"/><path d="M14.1 7.1h5.9v1.6h-5.9z"/><path d="M17.3 9.9c2.4 0 4 1.7 4 4.2v.6h-5.6c.2 1.1.9 1.8 2.1 1.8.8 0 1.4-.3 1.7-.9h1.7c-.4 1.6-1.8 2.5-3.5 2.5-2.4 0-4.1-1.7-4.1-4.1s1.6-4.1 3.7-4.1Zm-1.6 3.4h3.6c-.2-1-.8-1.7-1.8-1.7s-1.6.7-1.8 1.7Z"/>',
    ),
  },
];

export default function SocialLinks() {
  const reduced = useReducedMotion();
  const areaRef = useRef<HTMLElement>(null);
  const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // "end end" rather than the usual "end start": this is the last thing on the
  // page, so the scroll position that would put its bottom edge past the top of
  // the screen does not exist. Measured that way the travel could never
  // complete and the chips would rest permanently short of where they belong.
  // Ending when the block's bottom meets the bottom of the screen lands them
  // exactly as the page runs out.
  const { scrollYProgress } = useScroll({
    target: areaRef,
    offset: ["start end", "end end"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [ICON_DRIFT, 0]);

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
    <motion.nav
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
        padding: "72px clamp(16px, 4vw, 30px) 96px",
        display: "flex",
        // Never two rows. Six is a set; split across lines it reads as an
        // overflow rather than a choice. The chip and gap widths are sized in
        // vw so one line always fits instead of merely usually fitting.
        flexWrap: "nowrap",
        justifyContent: "center",
        // Opens up as the screen does, rather than sitting at one fixed value.
        // The floor keeps six chips on two tidy rows on a phone; the ceiling
        // stops the row from drifting apart on a wide monitor.
        gap: "clamp(13px, 4.6vw, 58px)",
        y: reduced ? 0 : drift,
        willChange: "transform",
      }}
    >
      {LINKS.map((s, i) => (
        <Chip
          key={s.name}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          social={s}
          tilt={tilts[i]}
          reduced={!!reduced}
        />
      ))}
    </motion.nav>
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
 * Then the glass plate and the mark's layers are siblings inside it.
 */
const Chip = forwardRef<
  HTMLAnchorElement,
  {
    social: Social;
    tilt: { x: MotionValue<number>; y: MotionValue<number> };
    reduced: boolean;
  }
>(function Chip({ social, tilt, reduced }, ref) {
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
          // A fixed basis would let flexbox shrink the chips out of square on
          // the narrowest screens; the widths above already guarantee the fit.
          flex: "0 0 auto",
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
          className="glass icon-plate"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: "rgba(5, 5, 5, 0.15)",
          }}
        />

        {social.layers.map((layer, i) => {
          const mask = `url("data:image/svg+xml,${encodeURIComponent(
            layer.svg,
          )}")`;
          const size = social.size ?? `${MARK_PCT} ${MARK_PCT}`;
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                // Page colour rather than a fixed hex, so the mark keeps
                // matching whatever the section behind it is painted.
                background: "var(--background)",
                maskImage: mask,
                WebkitMaskImage: mask,
                maskSize: size,
                WebkitMaskSize: size,
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                transform: `translateZ(${layer.depth}px)`,
                pointerEvents: "none",
              }}
            />
          );
        })}
      </motion.div>
    </a>
  );
});
