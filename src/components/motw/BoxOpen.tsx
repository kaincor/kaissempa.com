"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * The opening of the Mark of the Witch case study: Kai's box, closed, in the
 * middle of the screen. Scrolling opens it. The deck slides up out of the
 * top, the box drops away, and the thirteen spells fan out across the page
 * in an arc.
 *
 * Flat art throughout (the box front and the spell cards as drawn), moved
 * in 2D: the cards sit behind the box front, so as they rise they appear
 * over its top edge as if drawn out of it. Everything is sized off one CSS
 * variable, --bw (the box's width), so the transforms are calc()s of it and
 * nothing needs measuring. With reduced motion the fan is simply there.
 */

export type Spell = { src: string; name: string };

/** The box front's shape (box-front.webp, 1042 x 1458); the cards share it. */
const AR = 1042 / 1458;
/** How much of the box's width a card takes, so the deck fits inside it. */
const CARD = 0.92;
/** The fan: degrees between neighbouring cards, and its radius in box widths. */
const STEP = 6.5;
const RADIUS = 2.7;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** p's progress through [a, b], eased. */
const span = (p: number, a: number, b: number) => ease(clamp((p - a) / (b - a)));

function Card({ s, i, n, p }: { s: Spell; i: number; n: number; p: MotionValue<number> }) {
  const mid = (n - 1) / 2;
  const a = (i - mid) * STEP;
  const rad = (a * Math.PI) / 180;
  const transform = useTransform(p, (v) => {
    // Up out of the box, the top cards a touch ahead of the rest.
    const rise = span(v, 0.06 + i * 0.008, 0.34 + i * 0.008);
    const fan = span(v, 0.4 + Math.abs(i - mid) * 0.006, 0.78);
    // Risen: most of the card clear of the box's top edge (in box widths).
    const ry = (-0.82 * rise) / AR;
    // Fanned: round an arc whose centre sits well below the screen.
    const fx = Math.sin(rad) * RADIUS;
    const fy = (1 - Math.cos(rad)) * RADIUS - 1.25;
    const x = fx * fan;
    const y = ry + (fy - ry) * fan;
    const r = a * fan + (1 - fan) * (i - mid) * 0.35 * rise;
    return `translate(calc(var(--bw) * ${x.toFixed(4)}), calc(var(--bw) * ${y.toFixed(4)})) rotate(${r.toFixed(3)}deg)`;
  });
  return (
    <motion.div
      className="mbx-card"
      style={{ transform, zIndex: n - i, transformOrigin: "50% 100%" }}
    >
      <Image src={s.src} alt={s.name} fill sizes="(max-width: 700px) 30vw, 260px" priority={i < 3} style={{ objectFit: "contain" }} />
    </motion.div>
  );
}

export default function BoxOpen({ spells, children }: { spells: Spell[]; children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const still = useTransform(scrollYProgress, () => 1);
  const p = reduced ? still : scrollYProgress;

  const box = useTransform(p, (v) => {
    const d = span(v, 0.34, 0.6);
    return `translateY(${(d * 120).toFixed(2)}svh) rotate(${(d * -6).toFixed(2)}deg)`;
  });
  const hint = useTransform(p, (v) => 1 - clamp(v / 0.05));
  const after = useTransform(p, (v) => span(v, 0.72, 0.9));
  const afterY = useTransform(p, (v) => 16 * (1 - span(v, 0.72, 0.9)));

  return (
    <section ref={ref} className="mbx-open" style={{ height: reduced ? "100svh" : "340svh" }}>
      <div className="mbx-stage">
        <div className="mbx-anchor">
          {spells.map((s, i) => (
            <Card key={s.src} s={s} i={i} n={spells.length} p={p} />
          ))}
          <motion.div className="mbx-box" style={{ transform: box }}>
            <Image
              src="/mark-of-the-witch/box-front.webp"
              alt="The Mark of the Witch box: a woodcut of a goat leaping over a cottage, townsfolk at the edges"
              fill
              priority
              sizes="(max-width: 700px) 60vw, 320px"
              style={{ objectFit: "contain" }}
            />
          </motion.div>
        </div>
        <motion.p className="mbx-hint" style={{ opacity: hint }} aria-hidden="true">
          Scroll to open
        </motion.p>
        <motion.div className="mbx-after" style={{ opacity: after, y: afterY }}>
          {children}
        </motion.div>
      </div>
      <style>{`
        .mbx-open { position: relative; }
        .mbx-stage {
          position: sticky; top: 0; height: 100svh; overflow: hidden;
          display: grid; place-items: center;
          --bw: min(24vw, 27svh, 270px);
        }
        .mbx-anchor {
          position: relative; width: var(--bw); aspect-ratio: ${AR};
          translate: 0 18svh;
        }
        .mbx-box {
          position: absolute; inset: 0; z-index: 100;
          filter: drop-shadow(0 18px 26px rgba(29, 22, 12, 0.35)) drop-shadow(0 2px 4px rgba(29, 22, 12, 0.3));
          will-change: transform;
        }
        .mbx-card {
          position: absolute; left: ${((1 - CARD) / 2) * 100}%; width: ${CARD * 100}%; bottom: 2%;
          aspect-ratio: 673 / 942;
          filter: drop-shadow(0 6px 10px rgba(29, 22, 12, 0.28));
          will-change: transform;
        }
        .mbx-hint {
          position: absolute; bottom: 5svh; margin: 0;
          font-family: var(--motw-fell-sc); font-size: 15px; letter-spacing: 0.12em; color: rgba(29, 26, 20, 0.6);
        }
        .mbx-after {
          position: absolute; left: 0; right: 0; bottom: 7svh;
          display: flex; justify-content: center; pointer-events: none;
        }
        @media (max-width: 700px) {
          .mbx-stage { --bw: min(30vw, 26svh); }
        }
      `}</style>
    </section>
  );
}
