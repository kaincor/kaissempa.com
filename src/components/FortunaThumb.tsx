"use client";

import Link from "next/link";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DOTS, DOT_CLIPS, WORD, WORD_DOT } from "./fortuna-thumb/scene";

/**
 * The Fortuna thumbnail, rebuilt from the Hana scene it used to embed.
 *
 * One to one with that scene: the same images, the dots where Hana had them
 * drifting to the same places at the same pace, the rings turning twice
 * every hundred seconds, and the two phones springing up on hover with
 * Hana's own spring settings.
 *
 * Plain elements rather than an iframe, which settles three old problems.
 * The live scene cost frames on every scroll past it, measured, however early
 * it was loaded — compositing a cross-origin canvas is not free. A click
 * inside a cross-origin frame never reaches the page, so opening the case
 * study needed a focus-watching workaround that did not work on touch at all.
 * And it was 2.3MB; this is about 220KB of images.
 *
 * Sized in container units: the box is the scene's 2:1, so one scene unit is
 * 100cqw / 2400 at any width, and everything — the drift included — scales
 * with it. Every animation is a transform on its own element, so the
 * compositor runs them without repainting anything.
 */

/** A length in scene units, as a share of the box's width. */
const u = (n: number) => `${(n / 24).toFixed(4)}cqw`;

/**
 * The phones: where each sits, at rest and hovered. Hana grows both by 1.16,
 * turns them a couple of degrees further, and moves them up and right.
 */
const PHONES = [
  {
    key: "splash",
    src: "/fortuna/thumb/phone-splash.webp",
    w: 875,
    h: 1312,
    x: 610.45,
    y: 600,
    rotate: -8,
    hover: { x: 66.72, y: -19.04, rotate: -6.055 },
    spring: { stiffness: 80, damping: 10, mass: 1, velocity: 5 },
  },
  {
    key: "app",
    src: "/fortuna/thumb/phone-app.webp",
    w: 875,
    h: 1310,
    x: 784.5,
    y: 694,
    rotate: 10,
    hover: { x: 75, y: 0, rotate: 12 },
    spring: { stiffness: 60, damping: 7, mass: 1, velocity: 0 },
  },
];
const HOVER_SCALE = 1.16;

export default function FortunaThumb({ href, label }: { href: string; label: string }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  // The drift and the rings stop where they are while the box is off screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playState: CSSProperties = { animationPlayState: onScreen ? "running" : "paused" };

  return (
    <Link
      ref={box}
      href={href}
      aria-label={label}
      // Hover only from a mouse; a tap goes straight through to the page.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{ position: "absolute", inset: 0, display: "block", containerType: "inline-size", background: "#f1f1f1" }}
    >
      {/* The rings. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fortuna/thumb/rings.webp"
        alt=""
        draggable={false}
        className="fthumb-rings"
        style={{ ...abs(702 - 854, 783 - 854, 1708, 1708), ...playState }}
      />

      {/* The dots, in Hana's three groups, each clipped to its own box. */}
      {DOT_CLIPS.map(([cx, cy, cw, ch], g) => (
        <div key={g} style={{ ...abs(cx, cy, cw, ch), overflow: "hidden" }}>
          {DOTS.map(([group, x, y, d, colour, tx, ty, ms], i) =>
            group === g ? (
              <span
                key={i}
                className={ms ? "fthumb-dot" : undefined}
                style={{
                  ...abs(x - d / 2 - cx, y - d / 2 - cy, d, d),
                  borderRadius: "50%",
                  background: colour,
                  opacity: colour === "#32443e" ? 0.149 : 1,
                  ...(ms && tx !== null && ty !== null
                    ? ({
                        "--dx": u(tx - x),
                        "--dy": u(ty - y),
                        animationDuration: `${ms}ms`,
                        ...playState,
                      } as CSSProperties)
                    : null),
                }}
              />
            ) : null,
          )}
        </div>
      ))}

      {/* The wordmark. */}
      <svg
        viewBox="0 0 1021 204"
        aria-hidden="true"
        style={{ ...abs(1146, 477.5, 1021, 204), overflow: "visible" }}
      >
        <path d={WORD} fill="#69bd45" />
        <path d={WORD_DOT} fill="#ff8100" />
      </svg>

      {/* The phones, the app in front of the splash. */}
      {PHONES.map((p) => (
        <Phone key={p.key} phone={p} up={hover && !reduced} />
      ))}
    </Link>
  );
}

/**
 * One phone, sprung between rest and hovered.
 *
 * Driven the way Hana drives it: one spring from 0 to 1 with every property
 * read off it, rather than a spring per property. That is what Hana's
 * velocity means — a kick to the whole transition — and it keeps position,
 * turn and size arriving together.
 */
function Phone({ phone: p, up }: { phone: (typeof PHONES)[number]; up: boolean }) {
  const k = useMotionValue(0);
  useEffect(() => {
    const controls = up
      ? animate(k, 1, { type: "spring", ...p.spring })
      : animate(k, 0, { type: "spring", stiffness: p.spring.stiffness, damping: p.spring.damping, mass: p.spring.mass });
    return () => controls.stop();
  }, [up, k, p.spring]);
  const x = useTransform(k, (v) => u(p.hover.x * v));
  const y = useTransform(k, (v) => u(p.hover.y * v));
  const rotate = useTransform(k, (v) => p.rotate + (p.hover.rotate - p.rotate) * v);
  const scale = useTransform(k, (v) => 1 + (HOVER_SCALE - 1) * v);
  return (
    <motion.div style={{ ...abs(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h), x, y, rotate, scale }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block" }} />
    </motion.div>
  );
}

/** Absolutely placed in scene units. */
function abs(x: number, y: number, w: number, h: number): CSSProperties {
  return { position: "absolute", left: u(x), top: u(y), width: u(w), height: u(h), maxWidth: "none" };
}
