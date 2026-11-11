"use client";

import { useEffect, useRef, useState } from "react";
import { markWidthFor, unitFor } from "./MintIntro";

/**
 * The top of the Mint case study, once the opening has played: the MINT
 * wordmark left standing in the middle of the first screen, with Kai's
 * behind the scenes shots flicking on and off around it, a few at a time,
 * each held by selection handles like a frame picked in a design tool.
 *
 * They keep to the upper part of the screen and clear of the wordmark; the
 * magazine peeks up into the bottom of it.
 */

const BTS = "/mint/bts/";
const MINT_RED = "#b7272b";
const WORDMARK = "/case-studies/mint/aiden-3-wordmark.svg";
const WORDMARK_AR = 880 / 271;

const PHOTOS: { src: string; ar: number }[] = [
  { src: "9598", ar: 2 / 3 },
  { src: "9618", ar: 2 / 3 },
  { src: "9636", ar: 3 / 2 },
  { src: "9676", ar: 2 / 3 },
  { src: "9701", ar: 3 / 2 },
  { src: "9702", ar: 2 / 3 },
  { src: "9713", ar: 2 / 3 },
  { src: "9726", ar: 3 / 2 },
  { src: "9782", ar: 3 / 2 },
  { src: "9790", ar: 3 / 2 },
  { src: "9821", ar: 2 / 3 },
  { src: "9830", ar: 3 / 4 },
  { src: "9851", ar: 3 / 2 },
  { src: "9863", ar: 2 / 3 },
  { src: "9865", ar: 2 / 3 },
  { src: "9869", ar: 3 / 2 },
];

/**
 * Where a photo can turn up: centres from -1 to 1 across the screen and down
 * the upper part of it, and a width in units of U. Spread round the wordmark
 * without touching it.
 */
const SLOTS = [
  { x: -0.78, y: -0.62, w: 0.55 },
  { x: -0.36, y: -0.7, w: 0.48 },
  { x: 0.1, y: -0.72, w: 0.44 },
  { x: 0.52, y: -0.64, w: 0.56 },
  { x: 0.86, y: -0.5, w: 0.46 },
  { x: -0.9, y: -0.12, w: 0.5 },
  { x: -0.6, y: 0.2, w: 0.44 },
  { x: 0.64, y: 0.18, w: 0.48 },
  { x: 0.9, y: -0.08, w: 0.42 },
  { x: -0.22, y: -0.42, w: 0.36 },
  { x: 0.3, y: -0.4, w: 0.38 },
];

/** How many are up at once, and how long each stays. */
const MAX_UP = 3;
/** Long enough, at one every 2.2s, that three are often up together. */
const HOLD_MS = [7000, 8600];
/** A new photo every 2.2s. */
const EVERY_MS = 2200;

type Shown = { id: number; slot: number; photo: number };

/** Four small red squares just outside an element's corners. */
export function Corners({
  gap = 9,
  size = 5,
}: {
  gap?: number;
  size?: number;
}) {
  const o = -gap;
  return (
    <>
      {[
        { left: o, top: o },
        { right: o, top: o },
        { left: o, bottom: o },
        { right: o, bottom: o },
      ].map((pos, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            background: MINT_RED,
            pointerEvents: "none",
            ...pos,
          }}
        />
      ))}
    </>
  );
}

/** The first screen: MINT, with the photos flicking round it once `show`. */
export default function MintHero({ show }: { show: boolean }) {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  const [up, setUp] = useState<Shown[]>([]);
  const next = useRef(0);

  useEffect(() => {
    const set = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // Once the wordmark is back, photos start to turn up, gradually at first.
  useEffect(() => {
    if (!show) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    let lastPhoto = -1;
    const add = () => {
      if (document.visibilityState === "visible") {
        setUp((cur) => {
          if (cur.length >= MAX_UP) return cur;
          const free = SLOTS.map((_, i) => i).filter(
            (i) => !cur.some((c) => c.slot === i),
          );
          if (!free.length) return cur;
          const slot = free[Math.floor(Math.random() * free.length)];
          let photo = Math.floor(Math.random() * PHOTOS.length);
          while (photo === lastPhoto || cur.some((c) => c.photo === photo))
            photo = (photo + 1) % PHOTOS.length;
          lastPhoto = photo;
          const id = next.current++;
          later(
            () => setUp((c) => c.filter((s) => s.id !== id)),
            HOLD_MS[0] + Math.random() * (HOLD_MS[1] - HOLD_MS[0]),
          );
          return [...cur, { id, slot, photo }];
        });
      }
      later(add, EVERY_MS);
    };
    // With reduced motion, three photos simply stay up.
    if (reduced)
      later(
        () =>
          setUp([0, 3, 7].map((slot, i) => ({ id: i, slot, photo: i * 5 }))),
        0,
      );
    else later(add, 1200);
    return () => timers.forEach((id) => clearTimeout(id));
  }, [show]);

  const U = vp ? unitFor(vp.w, vp.h) : 0;
  const markW = vp ? markWidthFor(vp.w, vp.h) : 0;

  return (
    <section
      aria-label="Mint Magazine"
      style={{
        position: "relative",
        height: "100svh",
        overflow: "hidden",
      }}
    >
      {vp ? (
        <>
          {/* The photos. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            {up.map(({ id, slot, photo }) => {
              const s = SLOTS[slot];
              const p = PHOTOS[photo];
              const w = s.w * U;
              const h = w / p.ar;
              return (
                <div
                  key={id}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${s.x * vp.w * 0.46}px)`,
                    top: `calc(50% + ${s.y * vp.h * 0.46}px)`,
                    width: w,
                    height: h,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="mint-flick"
                    style={{ position: "absolute", inset: 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${BTS}${p.src}.jpg`}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: "none",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Corners />
                  </div>
                </div>
              );
            })}
          </div>

          {/* The wordmark; hovered, it is picked like a frame in a design tool. */}
          <div
            className="mint-mark"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: markW,
              height: markW / WORDMARK_AR,
              transform: "translate(-50%, -50%)",
              opacity: show ? 1 : 0,
              transition: "opacity 600ms ease-out",
            }}
          >
            <h1
              style={{
                position: "absolute",
                inset: 0,
                margin: 0,
                background: MINT_RED,
                WebkitMaskImage: `url(${WORDMARK})`,
                maskImage: `url(${WORDMARK})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                fontSize: 0,
              }}
            >
              Mint Magazine
            </h1>
            <div
              className="mint-mark-corners"
              style={{ position: "absolute", inset: 0 }}
            >
              <Corners gap={11} />
            </div>
          </div>
        </>
      ) : null}

      <style>{`
        .mint-flick { animation: mint-flick 340ms steps(1, end) both; }
        @keyframes mint-flick {
          0% { opacity: 0; }
          12% { opacity: 1; }
          24% { opacity: 0.15; }
          40% { opacity: 1; }
          55% { opacity: 0.6; }
          70%, 100% { opacity: 1; }
        }
        .mint-mark-corners { opacity: 0; transition: opacity 200ms ease-out; }
        @media (hover: hover) { .mint-mark:hover .mint-mark-corners { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .mint-flick { animation: none; } }
      `}</style>
    </section>
  );
}
