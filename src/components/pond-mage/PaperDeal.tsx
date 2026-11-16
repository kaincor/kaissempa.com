"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Kai's Lake Lagunita photos, printed on sheets of handmade paper
 * (scripts/pond-mage-paper.py makes the sheets), dealt out onto the page like
 * cards from a deck: the first time the row comes into view the four wait
 * stacked off the right of the screen, then come in leftwards one after
 * another, each sliding and turning into its own spot and settling at a
 * slight angle.
 *
 * The sheets are images with their own torn edges and alpha, so the shadow is
 * a drop-shadow that follows the paper. With reduced motion they are simply
 * there.
 */

export type PaperPhoto = { src: string; alt: string; w: number; h: number };

/** Each sheet's resting angle and nudge (px, at full size), so the row looks set down by hand. */
const LAY = [
  { r: -4, y: 10 },
  { r: 2.5, y: -6 },
  { r: -1.5, y: 8 },
  { r: 3.5, y: -4 },
];
/** How long a card drifts in: a base, plus time for the distance it covers,
    so the far ones don't have to rush. */
const DEAL_MS = 2200;
const MS_PER_PX = 1.15;
const STAGGER_MS = 480;

export default function PaperDeal({ photos }: { photos: PaperPhoto[] }) {
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>(".pm-sheet")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => (c.style.opacity = "1"));
      return;
    }
    const anims: Animation[] = [];
    // Waiting in the deck, off the right edge of the screen, a little
    // askew; dealt from there leftwards into the row.
    const stack = () => {
      const vw = document.documentElement.clientWidth;
      const box = el.getBoundingClientRect();
      const cy = box.top + box.height / 2;
      return cards.map((c, i) => {
        const b = c.getBoundingClientRect();
        return {
          dx: vw + b.width * 0.7 - (b.left + b.width / 2),
          dy: cy - (b.top + b.height / 2) - 20,
          r: 14 + (i - 1.5) * 3,
        };
      });
    };
    let from = stack();
    cards.forEach((c, i) => {
      c.style.opacity = "1";
      c.style.transform = `translate(${from[i].dx}px, ${from[i].dy}px) rotate(${from[i].r}deg)`;
      // The last dealt sits on top in the deck, so the first comes off the top.
      c.style.zIndex = String(10 - i);
    });

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        from = stack();
        cards.forEach((c, i) => {
          const lay = LAY[i % LAY.length];
          const end = `translate(0px, ${lay.y}px) rotate(${lay.r}deg) scale(1)`;
          const { dx, dy, r } = from[i];
          // Drifting in like a sheet of paper on the air: a slow start, a
          // long, soft settle, and a gentle rise and dip on the way, its
          // turn easing off as it comes down.
          const a = c.animate(
            [
              { transform: `translate(${dx}px, ${dy - 40}px) rotate(${r}deg)` },
              {
                transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 52}px) rotate(${lay.r + r * 0.45}deg)`,
                offset: 0.4,
              },
              {
                transform: `translate(${dx * 0.12}px, ${lay.y - 14}px) rotate(${lay.r + 2.5}deg)`,
                offset: 0.78,
              },
              { transform: end },
            ],
            {
              duration: DEAL_MS + Math.abs(dx) * MS_PER_PX,
              delay: 250 + i * STAGGER_MS,
              easing: "cubic-bezier(0.37, 0, 0.25, 1)",
              fill: "both",
            },
          );
          a.onfinish = () => {
            c.style.transform = end;
            c.style.zIndex = "";
            a.cancel();
          };
          anims.push(a);
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      anims.forEach((a) => a.cancel());
    };
  }, []);

  // Widths in proportion to each sheet's shape, so all four stand the same height.
  const total = photos.reduce((s, p) => s + p.w / p.h, 0);
  return (
    <div ref={row} className="pm-deal">
      {photos.map((p) => (
        <div
          key={p.src}
          className="pm-sheet"
          style={{ ["--share" as string]: `${((p.w / p.h) / total) * 100}%`, aspectRatio: `${p.w} / ${p.h}`, opacity: 0 }}
        >
          <Image
            src={p.src}
            alt={p.alt}
            fill
            sizes="(max-width: 639px) 46vw, 30vw"
            style={{ objectFit: "contain" }}
            priority={false}
          />
        </div>
      ))}
      <style>{`
        .pm-deal {
          display: flex; justify-content: center; align-items: center;
          width: min(96vw, 1320px); margin: 0 auto;
        }
        /* Larger than an even share, so neighbours touch and overlap a
           little; the overlap comes out of the gaps, so the row still spans
           the same width and the margins either side stay put. */
        .pm-sheet {
          position: relative; flex: 0 0 auto;
          width: calc(var(--share) * 1.06);
          filter: drop-shadow(4px 12px 14px rgba(8, 2, 14, 0.5)) drop-shadow(0 2px 3px rgba(8, 2, 14, 0.35));
          transition: translate 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .pm-sheet + .pm-sheet { margin-left: -2%; }
        @media (hover: hover) {
          .pm-sheet:hover { translate: 0 -8px; }
        }
        @media (max-width: 639px) {
          .pm-deal { flex-wrap: wrap; width: 100%; padding: 0 10px; gap: 14px 10px; }
          .pm-sheet { width: calc(50% - 6px); }
          .pm-sheet + .pm-sheet { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
