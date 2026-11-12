"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Behind the scenes, after the magazine: all the shots as a sliding
 * strip. The current photo sits large in the middle at its own shape, with a
 * little of the one before and the one after showing at either side; the
 * strip loops round, so the first has the last before it. It moves on by
 * itself every few seconds while in view, and by swiping or dragging the
 * strip, clicking a neighbour, the arrow keys, or the timeline under it: a
 * thin red line with a tiny copy of the current photo riding along it, which
 * can be dragged to skim through (and is picked with the page's red corner
 * squares while hovered or held), or clicked anywhere to jump.
 *
 * Photos are full resolution (public/mint/gallery, 2400px on the long side),
 * served by next/image at the size each screen needs. Only the current one
 * and three either side are mounted. The outermost pair sit out of sight at
 * no opacity, so a photo coming in slides and fades in from there and one
 * going out slides and fades away into it, rather than popping in or out.
 */

/** Each photo and its shape, width over height. */
const PHOTOS: { src: string; ar: number }[] = [
  { src: "9598", ar: 2 / 3 },
  { src: "9618", ar: 3 / 2 },
  { src: "9626", ar: 3 / 4 },
  { src: "9635", ar: 3 / 2 },
  { src: "9636", ar: 3 / 2 },
  { src: "9654", ar: 3 / 2 },
  { src: "9676", ar: 3 / 2 },
  { src: "9681", ar: 2 / 3 },
  { src: "9701", ar: 3 / 2 },
  { src: "9702", ar: 2 / 3 },
  { src: "9703", ar: 3 / 2 },
  { src: "9713", ar: 2 / 3 },
  { src: "9715", ar: 3 / 2 },
  { src: "9726", ar: 3 / 2 },
  { src: "9748", ar: 3 / 2 },
  { src: "9750", ar: 3 / 2 },
  { src: "9772", ar: 3 / 2 },
  { src: "9778", ar: 3 / 2 },
  { src: "9782", ar: 3 / 2 },
  { src: "9790", ar: 3 / 2 },
  { src: "9800", ar: 2 / 3 },
  { src: "9804", ar: 3 / 2 },
  { src: "9821", ar: 2 / 3 },
  { src: "9822", ar: 2 / 3 },
  { src: "9824", ar: 2 / 3 },
  { src: "9830", ar: 3 / 4 },
  { src: "9851", ar: 3 / 2 },
  { src: "9854", ar: 15 / 8 },
  { src: "9863", ar: 2 / 3 },
  { src: "9865", ar: 2 / 3 },
  { src: "9869", ar: 3 / 2 },
];
const N = PHOTOS.length;
const RED = "#b7272b";
/** How long each photo stays when it plays by itself, and how long it waits after the reader takes over. */
const AUTO_MS = 4200;
const RESUME_MS = 9000;
const SLIDE = "700ms cubic-bezier(0.22, 1, 0.36, 1)";
/** The tiny photo on the timeline, its height in px. */
const THUMB_H = 30;

const wrap = (i: number) => ((i % N) + N) % N;

export default function MintGallery() {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const root = useRef<HTMLElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const inView = useRef(false);
  const heldUntil = useRef(0);
  const current = useRef(0);

  const go = useCallback((i: number, byHand = true) => {
    const next = wrap(i);
    if (byHand) heldUntil.current = performance.now() + RESUME_MS;
    current.current = next;
    setIndex(next);
  }, []);

  // The room the strip has: the section's width, and most of a screen tall.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const phone = window.innerWidth < 640;
      const w = el.clientWidth;
      // Never taller than a landscape photo can be across most of the width,
      // so every photo, portrait or landscape, comes out the strip's full
      // height and the red lines sit right on their edges.
      setBox({
        w,
        h: Math.min(
          window.innerHeight * (phone ? 0.58 : 0.7),
          (w * 0.78) / 1.5,
        ),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Playing by itself, only while on screen, and not right after the reader
  // has moved it.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => (inView.current = e.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const id = reduced
      ? 0
      : window.setInterval(() => {
          if (!inView.current || document.visibilityState !== "visible") return;
          if (performance.now() < heldUntil.current) return;
          go(current.current + 1, false);
        }, AUTO_MS);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, [go]);

  // Arrow keys while it is in view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inView.current) return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  // Swiping or dragging the strip sideways.
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    swiped.current = false;
  };
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      swiped.current = true;
      go(index + (dx < 0 ? 1 : -1));
    }
  };

  // The timeline: drag the tiny photo (or press anywhere on the line) to skim.
  const [scrubbing, setScrubbing] = useState(false);
  const [thumbHot, setThumbHot] = useState(false);
  const scrubTo = (clientX: number) => {
    const r = line.current?.getBoundingClientRect();
    if (!r) return;
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const i = Math.round(k * (N - 1));
    if (i !== index) go(i);
    else heldUntil.current = performance.now() + RESUME_MS;
  };
  useEffect(() => {
    if (!scrubbing) return;
    const move = (e: PointerEvent) => scrubTo(e.clientX);
    const up = () => setScrubbing(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  });

  // Lay out the strip round the current photo: each at the strip's height,
  // unless that would make it wider than most of the width (a landscape on a
  // phone), side by side with a gap, the current one centred.
  const gap = box && box.w < 640 ? 10 : 20;
  const size = (i: number) => {
    if (!box) return { w: 0, h: 0 };
    // Every photo at the strip's full height, so the red lines sit along all
    // of them; the strip's height is already capped so a landscape fits.
    const ar = PHOTOS[wrap(i)].ar;
    return { w: box.h * ar, h: box.h };
  };
  // Every photo keeps its place in the page, in order, so a move only ever
  // changes where each one sits: reordering them would make the browser
  // drop and re-add the ones that moved, and they would jump instead of
  // sliding. Those more than three away wait out of sight, unloaded.
  const slots: { k: number; x: number; w: number; h: number }[] = PHOTOS.map(
    () => ({ k: 99, x: 0, w: 0, h: 0 }),
  );
  if (box) {
    const c = size(index);
    slots[index] = { k: 0, x: 0, ...c };
    let right = c.w / 2;
    let left = -c.w / 2;
    for (let k = 1; k <= 3; k++) {
      const r = size(index + k);
      slots[wrap(index + k)] = { k, x: right + gap + r.w / 2, ...r };
      right += gap + r.w;
      const l = size(index - k);
      slots[wrap(index - k)] = { k: -k, x: left - gap - l.w / 2, ...l };
      left -= gap + l.w;
    }
    // Parked off to whichever side is nearer round the loop, unseen.
    slots.forEach((sl, i) => {
      if (sl.k !== 99) return;
      const d = wrap(i - index) <= N / 2 ? 1 : -1;
      const z = size(i);
      sl.k = d * 4;
      sl.x = d * (box.w + z.w);
      sl.w = z.w;
      sl.h = z.h;
    });
  }
  const peek = box && box.w < 640 ? 28 : 90;
  // Always as wide as a landscape photo with a little either side, whatever
  // is showing, so the frame holds still; a portrait sits in the middle of
  // it with more of its neighbours in view.
  const landscapeW = box ? Math.min(box.h, (box.w * 0.78) / 1.5) * 1.5 : 0;
  const windowW = box ? Math.min(box.w, landscapeW + 2 * (gap + peek)) : 0;

  const at = index / (N - 1);
  const cur = PHOTOS[index];

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-label="Behind the scenes"
      style={{ position: "relative", zIndex: 3, padding: "14svh 0 14svh" }}
    >
      {/* A thin red line just along the top and the bottom of the photos,
          from the leftmost photo's edge to the rightmost's. */}
      <div
        style={{
          width: windowW || "100%",
          margin: "0 auto",
          // A hair of space between the lines and the photos.
          padding: "2px 0",
          borderTop: `1px solid ${RED}`,
          borderBottom: `1px solid ${RED}`,
        }}
      >
        <div
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
          style={{
            position: "relative",
            height: box ? box.h : "70svh",
            width: "100%",
            overflow: "hidden",
            touchAction: "pan-y",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {slots.map(({ k, x, w, h }, i) => {
            const p = PHOTOS[i];
            const side = k !== 0;
            const away = Math.abs(k);
            return (
              <div
                key={p.src}
                onClick={() => {
                  if (side && !swiped.current) go(i);
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: w,
                  height: h,
                  transform: `translate(${x - w / 2}px, -50%)`,
                  transition: `transform ${SLIDE}, width ${SLIDE}, height ${SLIDE}, opacity ${SLIDE}`,
                  opacity: away === 0 ? 1 : away < 3 ? 0.55 : 0,
                  cursor: side ? "pointer" : "grab",
                  pointerEvents: away < 3 ? "auto" : "none",
                }}
              >
                {away > 3 ? null : (
                  <Image
                    src={`/mint/gallery/${p.src}.jpg`}
                    alt=""
                    fill
                    sizes={`${Math.round(w)}px`}
                    quality={85}
                    draggable={false}
                    priority={i === 0}
                    style={{ objectFit: "cover", pointerEvents: "none" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The timeline. */}
      <div
        ref={line}
        role="slider"
        aria-label="Photo"
        aria-valuemin={1}
        aria-valuemax={N}
        aria-valuenow={index + 1}
        aria-valuetext={`Photo ${index + 1} of ${N}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(index + 1);
          else if (e.key === "ArrowLeft") go(index - 1);
          else return;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          // No text selection or native drag while skimming.
          e.preventDefault();
          setScrubbing(true);
          scrubTo(e.clientX);
        }}
        style={{
          position: "relative",
          width: "min(520px, 70vw)",
          height: THUMB_H + 16,
          margin: "28px auto 0",
          cursor: scrubbing ? "grabbing" : "pointer",
          touchAction: "none",
          outline: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 1,
            background: "rgba(183, 39, 43, 0.5)",
          }}
        />
        {/* The tiny copy of the current photo, riding the line. */}
        <div
          aria-hidden="true"
          onPointerEnter={() => setThumbHot(true)}
          onPointerLeave={() => setThumbHot(false)}
          style={{
            position: "absolute",
            top: "50%",
            left: `${at * 100}%`,
            width: THUMB_H * cur.ar,
            height: THUMB_H,
            transform: "translate(-50%, -50%)",
            transition: scrubbing
              ? "left 80ms linear, width 200ms ease-out"
              : `left ${SLIDE}, width 300ms ease-out`,
            cursor: "grab",
          }}
        >
          <Image
            src={`/mint/gallery/${cur.src}.jpg`}
            alt=""
            fill
            sizes="48px"
            quality={75}
            draggable={false}
            style={{ objectFit: "cover", pointerEvents: "none" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: thumbHot || scrubbing ? 1 : 0,
              transition: `opacity ${thumbHot || scrubbing ? 200 : 450}ms ease-out`,
            }}
          >
            {[
              { left: -7, top: -7 },
              { right: -7, top: -7 },
              { left: -7, bottom: -7 },
              { right: -7, bottom: -7 },
            ].map((pos, k) => (
              <span
                key={k}
                style={{
                  position: "absolute",
                  width: 4,
                  height: 4,
                  background: RED,
                  ...pos,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
