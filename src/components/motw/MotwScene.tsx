"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Mark of the Witch: Kai's Photoshop render (the homepage thumbnail, 2400 x
 * 1200), brought to life. The render itself is cut into its pieces (the
 * Peek and False Witness cards, Divination and the box) over a
 * clean background rebuilt from it, the title Kai's own vector lettering,
 * and each piece is set at its own depth in a 3D space. At rest it is the
 * render exactly; then the view orbits very slightly and each piece bobs
 * gently up and down on its own, so the depth shows.
 *
 * Each layer covers the whole frame and is pushed back or forward, then
 * scaled by the inverse of what the perspective does to it, about the
 * perspective's own centre, so every piece lands exactly where it is in the
 * render. Only the orbit and the bob move them off it.
 *
 * Built with CSS 3D transforms, the browser compositing a handful of flat
 * images on the GPU: no WebGL, so nothing to compete with the homepage's own
 * 3D hero. It only animates while on screen, and holds still for reduced
 * motion.
 */

const A = "/motw/";
/** The render's size, which the cut pieces are positioned in. */
const RW = 2400;
const RH = 1200;
/** The perspective distance, as a share of the frame's width (cqw). */
const P = 140;

/**
 * The title: Kai's own lettering as vector (assets/Case Studies/Mark of the
 * Witch/Mark of the Witch Lettering.svg), split into its three lines, each
 * fitted to where that line sits in the render (render px), so it is sharp
 * at any size and lands where the render has it. The render sets WITCH a
 * little larger against MARK than the SVG does, hence a box per line.
 */
const TITLE = [
  { src: "title-mark.svg", x: 389, y: 348, w: 666, h: 153 },
  { src: "title-of-the.svg", x: 511, y: 525, w: 420, h: 76 },
  { src: "title-witch.svg", x: 203, y: 613, w: 1022, h: 194 },
];

/**
 * Each piece: where it was cut from the render (x, y, w, h in render px),
 * its depth towards the viewer (cqw), and how it bobs: how far (cqw), how
 * long a swing takes (s), and where in its swing it starts.
 */
const PIECES = [
  {
    src: "title",
    x: 120,
    y: 220,
    w: 1210,
    h: 680,
    z: 3,
    bob: 0.35,
    t: 7.4,
    at: 0.1,
  },
  // The cards spread well apart in depth, so they swing against the box.
  {
    src: "peek-fw",
    x: 1130,
    y: 0,
    w: 945,
    h: 515,
    z: 18,
    bob: 0.7,
    t: 6.1,
    at: 0.3,
  },
  {
    src: "divination",
    x: 1840,
    y: 455,
    w: 560,
    h: 260,
    z: 26,
    bob: 0.65,
    t: 5.7,
    at: 0.8,
  },
  {
    src: "box",
    x: 1265,
    y: 465,
    w: 595,
    h: 685,
    z: 9,
    bob: 0.45,
    t: 6.9,
    at: 0.0,
  },
] as const;

export default function MotwScene({
  priority = false,
  maxWidth = null,
}: {
  priority?: boolean;
  /** The widest the scene gets on screen, in px, if capped (the homepage thumbnail); for image sizes. */
  maxWidth?: number | null;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  // The title comes in the first time the scene is well in view.
  const [seen, setSeen] = useState(false);

  // Animates only while on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setOnScreen(e.isIntersecting);
        if (e.intersectionRatio > 0.35) setSeen(true);
      },
      { threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** next/image sizes for a piece `w` render px wide. */
  const sizes = (w: number) => {
    const k = w / RW;
    return maxWidth
      ? `(max-width: ${maxWidth}px) ${Math.ceil(k * 100)}vw, ${Math.ceil(k * maxWidth)}px`
      : `${Math.ceil(k * 100)}vw`;
  };

  return (
    <div
      ref={root}
      className={[
        "motw",
        onScreen ? "" : "motw-paused",
        seen ? "motw-seen" : "",
      ].join(" ")}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        background: "#dedede",
      }}
    >
      <Image
        src={`${A}bg.jpg`}
        alt=""
        fill
        sizes={
          maxWidth ? `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px` : "100vw"
        }
        quality={85}
        priority={priority}
      />

      <div className="motw-stage">
        <div className="motw-world">
          {PIECES.map((p) => (
            <div
              key={p.src}
              className="motw-layer"
              // Pushed to its depth, then scaled back to its size in the render.
              style={{
                transform: `translateZ(${p.z}cqw) scale(${(P - p.z) / P})`,
              }}
            >
              <div
                className="motw-bob"
                style={
                  {
                    "--bob": `${p.bob}cqw`,
                    animationDuration: `${p.t}s`,
                    animationDelay: `${-p.at * p.t * 2}s`,
                  } as CSSProperties
                }
              >
                {p.src === "title" ? (
                  <div className="motw-title">
                    {TITLE.map((l) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={l.src}
                        src={`${A}${l.src}`}
                        alt=""
                        draggable={false}
                        style={{
                          position: "absolute",
                          left: `${(l.x / RW) * 100}%`,
                          top: `${(l.y / RH) * 100}%`,
                          width: `${(l.w / RW) * 100}%`,
                          height: `${(l.h / RH) * 100}%`,
                          maxWidth: "none",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      left: `${(p.x / RW) * 100}%`,
                      top: `${(p.y / RH) * 100}%`,
                      width: `${(p.w / RW) * 100}%`,
                      height: `${(p.h / RH) * 100}%`,
                    }}
                  >
                    <Image
                      src={`${A}${p.src}.png`}
                      alt=""
                      fill
                      sizes={sizes(p.w)}
                      quality={85}
                      priority={priority}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .motw-stage {
          position: absolute;
          inset: 0;
          perspective: ${P}cqw;
          perspective-origin: 50% 50%;
        }
        .motw-world, .motw-layer, .motw-bob {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
        }
        .motw-layer { transform-origin: 50% 50%; }
        .motw-world { animation: motw-orbit 16s ease-in-out infinite; }
        @keyframes motw-orbit {
          0%, 100% { transform: rotateY(0deg) rotateX(0deg); }
          25% { transform: rotateY(-6deg) rotateX(2.4deg); }
          50% { transform: rotateY(0deg) rotateX(4deg); }
          75% { transform: rotateY(6deg) rotateX(2.4deg); }
        }
        /* The title fades in, growing slightly, a beat after the scene is in view. */
        .motw-title {
          position: absolute;
          inset: 0;
          transform-origin: ${(714 / RW) * 100}% ${(577 / RH) * 100}%;
          opacity: 0;
          transform: scale(0.94);
        }
        .motw-seen .motw-title { animation: motw-title-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both; }
        @keyframes motw-title-in {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .motw-bob { animation: motw-bob ease-in-out infinite alternate; }
        @keyframes motw-bob {
          from { transform: translate3d(0, calc(var(--bob) * -1), 0); }
          to { transform: translate3d(0, var(--bob), 0); }
        }
        .motw-paused .motw-world, .motw-paused .motw-bob { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .motw-world, .motw-bob, .motw-seen .motw-title { animation: none; }
          .motw-title { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
