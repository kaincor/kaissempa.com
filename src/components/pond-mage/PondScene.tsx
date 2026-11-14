"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import RoseBloom, { LEAF_CSS, bloomBox, useRoses } from "./RoseBloom";
import TitleScribble, { LETTER_GAP } from "./TitleScribble";

/**
 * The Pond Mage, Kai's final render (1920 x 1080), brought to life the way
 * the Mark of the Witch thumbnail is (see motw/MotwScene).
 *
 * The pieces were rendered from Kai's own .blend, not cut by eye: the mage,
 * her wand and the frog each as an exact mask from the final camera, applied
 * to the final render, so every piece is the render's own pixels. Behind
 * them is a clean plate: the scene rendered again without them (and without
 * the spell's sparkles, which are left out), matched to the final grade, so
 * there is real grass behind them as the view turns rather than a smear.
 *
 * Each layer covers the whole frame, is pushed to its depth and scaled back
 * by what the perspective does to it, so at rest it is the render exactly.
 * Only the frog moves through the scene, floating round a small loop, and
 * the wand tips up and down in the mage's hand; she and everything else
 * hold still.
 *
 * CSS 3D only, a handful of flat images composited on the GPU. Animates only
 * while on screen; holds still for reduced motion.
 */

const A = "/pond-mage/scene/";
const RW = 1920;
const RH = 1080;
/** The perspective distance, as a share of the frame's width (cqw). */
const P = 140;

/**
 * Each piece: its box in the render (px), its depth towards the viewer
 * (cqw), and how it bobs: how far (cqw), how long a swing takes (s), and
 * where in its swing it starts. The frog floats, clearly; the mage herself
 * holds still, and only her wand moves.
 */
const PIECES = [
  { src: "frog", x: 1210, y: 170, w: 212, h: 259, z: 6, bob: 2, t: 4.2, at: 0.2 },
  { src: "mage", x: 233, y: 141, w: 866, h: 717, z: 14, bob: 0, t: 3.1, at: 0 },
] as const;

/**
 * The wand, its own layer (rendered as a mask from Kai's .blend, like the
 * others), at the mage's depth. It tips up and down about the end in her
 * fist, (955, 515) in the render.
 */
const WAND = { x: 936, y: 391, w: 163, h: 143, px: 955, py: 515 };

/** Kai's lettering (pond-mage-font.svg), where the thumbnail sets it. */
const TITLE = { x: 1045, y: 868, w: 800, h: 118 };

export default function PondScene({ priority = false }: { priority?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  // Each time the scene comes well into view the title is drawn again: a
  // new number starts it, 0 clears it once the scene has gone.
  const [run, setRun] = useState(0);
  const roses = useRoses();
  const still = !!useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let shown = false;
    const io = new IntersectionObserver(
      ([e]) => {
        setOnScreen(e.isIntersecting);
        if (e.intersectionRatio > 0.35 && !shown) {
          shown = true;
          setRun((r) => r + 1);
        } else if (!e.isIntersecting && shown) {
          shown = false;
          setRun(0);
        }
      },
      { threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div
      ref={root}
      className={["pm", onScreen ? "" : "pm-paused"].join(" ")}
      role="img"
      aria-label="The Pond Mage: a small round mage in a pointed hat raises a wooden wand in a field of grass and red flowers at night, and a frog floats above the pond."
      style={{ position: "absolute", inset: 0, overflow: "hidden", containerType: "size", background: "#1e1021" }}
    >
      <Image src={`${A}bg.jpg`} alt="" fill sizes="100vw" quality={90} priority={priority} />

      <div className="pm-stage">
        <div className="pm-world">
          {PIECES.map((p) => (
            <div
              key={p.src}
              className="pm-layer"
              style={{ transform: `translateZ(${p.z}cqw) scale(${(P - p.z) / P})` }}
            >
              <div
                className={`pm-bob pm-${p.src}`}
                style={
                  {
                    "--bob": `${p.bob}cqw`,
                    animationDuration: `${p.t}s`,
                    animationDelay: `${-p.at * p.t * 2}s`,
                  } as CSSProperties
                }
              >
                <div
                  style={{
                    position: "absolute",
                    left: pct(p.x, RW),
                    top: pct(p.y, RH),
                    width: pct(p.w, RW),
                    height: pct(p.h, RH),
                  }}
                >
                  <Image
                    src={`${A}${p.src}.png`}
                    alt=""
                    fill
                    sizes={`${Math.ceil((p.w / RW) * 100)}vw`}
                    quality={90}
                    priority={priority}
                    draggable={false}
                  />
                </div>
                {p.src === "mage" ? (
                  <div
                    className="pm-wand"
                    style={{
                      position: "absolute",
                      left: pct(WAND.x, RW),
                      top: pct(WAND.y, RH),
                      width: pct(WAND.w, RW),
                      height: pct(WAND.h, RH),
                      transformOrigin: `${pct(WAND.px - WAND.x, WAND.w)} ${pct(WAND.py - WAND.y, WAND.h)}`,
                    }}
                  >
                    <Image
                      src={`${A}wand.png`}
                      alt=""
                      fill
                      sizes={`${Math.ceil((WAND.w / RW) * 100)}vw`}
                      quality={90}
                      priority={priority}
                      draggable={false}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          <div className="pm-layer" style={{ transform: `translateZ(3cqw) scale(${(P - 3) / P})` }}>
            <div
              style={{
                position: "absolute",
                left: pct(TITLE.x, RW),
                top: pct(TITLE.y, RH),
                width: pct(TITLE.w, RW),
                height: pct(TITLE.h, RH),
              }}
            >
              {roses ? (
                <>
                  <TitleScribble data={roses} src="/pond-mage/title.svg" run={run} still={still} />
                  {/* Kai's roses, where he drew them on the title, rippling
                      across it left to right as the letters come in. */}
                  {roses.title.roses.map((r, i) => {
                    const b = bloomBox(roses, r.c);
                    const { w: TW, h: TH } = roses.title;
                    const w = b.w * r.k;
                    const h = b.h * r.k;
                    return (
                      <RoseBloom
                        key={r.c}
                        data={roses}
                        id={r.c}
                        run={run}
                        still={still}
                        delay={0.55 + (r.x / TW) * 11 * LETTER_GAP + i * 0.04}
                        style={{
                          left: pct(r.x - w / 2, TW),
                          top: pct(r.y - h / 2, TH),
                          width: pct(w, TW),
                          height: pct(h, TH),
                        }}
                      />
                    );
                  })}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <style>{LEAF_CSS}</style>
      <style>{`
        .pm-stage { position: absolute; inset: 0; perspective: ${P}cqw; perspective-origin: 50% 50%; }
        .pm-world, .pm-layer, .pm-bob { position: absolute; inset: 0; transform-style: preserve-3d; }
        .pm-layer { transform-origin: 50% 50%; }
        .pm-bob { animation: pm-bob ease-in-out infinite alternate; }
        @keyframes pm-bob {
          from { transform: translate3d(0, calc(var(--bob) * -1), 0); }
          to { transform: translate3d(0, var(--bob), 0); }
        }
        /* The frog alone moves: round a small loop, a little taller than it
           is wide, turning a touch as it goes. */
        .pm-frog { animation: pm-frog-orbit 7s linear infinite; }
        @keyframes pm-frog-orbit {
          0%, 100% { transform: translate3d(0, calc(var(--bob) * -1), 0) rotate(-2deg); }
          25% { transform: translate3d(calc(var(--bob) * 0.55), 0, 0) rotate(0.5deg); }
          50% { transform: translate3d(0, var(--bob), 0) rotate(2.5deg); }
          75% { transform: translate3d(calc(var(--bob) * -0.55), 0, 0) rotate(0.5deg); }
        }
        /* The wand tips up and down in her hand, a little ahead of the frog. */
        .pm-wand { animation: pm-wand 4.2s ease-in-out -1.2s infinite alternate; }
        @keyframes pm-wand {
          from { transform: rotate(-7deg); }
          to { transform: rotate(5deg); }
        }
        .pm-paused .pm-bob, .pm-paused .pm-wand { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .pm-bob, .pm-wand { animation: none; }
        }
      `}</style>
    </div>
  );
}
