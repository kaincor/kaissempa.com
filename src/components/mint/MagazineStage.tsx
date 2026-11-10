"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import MintGallery from "./MintGallery";
import MintHero from "./MintHero";
import MintRoom from "./MintRoom";
import { LEAVES } from "./pages";
import MintIntro, { type CoverRect } from "./MintIntro";

/** three.js only runs in the browser, so the scene loads after the page. */
const MagazineScene = dynamic(() => import("./MagazineScene"), { ssr: false });

/** Pages to turn by scrolling on a phone: one per leaf. */
const LEAF_COUNT = LEAVES.length;
/** Scroll per page, as a share of the screen's height; matches the scene. */
const SCROLL_STEP = 0.6;
const PHONE = "(max-width: 767px)";
/**
 * How far the magazine's screen rides up under the hero: half, so the
 * closed issue's middle sits on the bottom of the first screen and its top
 * half shows.
 */
const OVERLAP = { desktop: 50, phone: 50 }; // svh

/**
 * The Mint case study page, in two parts: the hero (the MINT wordmark, with
 * behind the scenes shots flicking around it) and below it the 3D issue.
 *
 * The opening montage plays over the top of both, fixed to the screen, with
 * the page held at the top. The 3D book loads underneath from the start,
 * hidden. The montage ends by typing MINT, opening the cover out of it, and
 * dropping the cover down to where the 3D one waits below the wordmark; the
 * hero's own wordmark comes back as it goes. Then the canvas is shown under
 * the card, the card fades, and the book tilts into its float.
 *
 * The hero holds still at the top of the screen while the magazine's part
 * scrolls up over it.
 *
 * After it, a gallery of the behind the scenes shots.
 *
 * On a phone the magazine's part is a tall track: scrolling brings the book
 * up until it fills the screen and pins there, and from then on scrolling
 * turns its pages.
 */
export default function MagazineStage() {
  const [cover, setCover] = useState<CoverRect | null>(null);
  const [dropped, setDropped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const onCover = useCallback((r: CoverRect) => setCover(r), []);
  const onDrop = useCallback(() => setDropped(true), []);
  const onReveal = useCallback(() => setRevealed(true), []);
  const onDone = useCallback(() => setDone(true), []);

  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const set = () => setPhone(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // The opening plays through, so the page holds still under it.
  useEffect(() => {
    if (done) return;
    const root = document.documentElement;
    window.scrollTo(0, 0);
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [done]);

  const overlap = phone ? OVERLAP.phone : OVERLAP.desktop;
  const corners = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // Whether the magazine has come all the way up over the hero and is wholly
  // in view: the hero's photos turn grey behind it then.
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!done) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const t = track.current;
      if (t) setUp(t.getBoundingClientRect().top <= 6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [done]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <MintRoom />
        <div
          style={{ position: "sticky", top: 0, height: "100svh", zIndex: 1 }}
        >
          <MintHero show={dropped} covered={up} />
        </div>
        <div
          ref={track}
          data-mint-track=""
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: `-${overlap}svh`,
            height: phone
              ? `calc(100svh + ${LEAF_COUNT * SCROLL_STEP * 100}svh)`
              : "100svh",
            // Clicks on the hero's part of the screen go through to it.
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              width: "100%",
              height: "100svh",
            }}
          >
            {/* The caption, a set distance under the book, rising with it; low
              enough that the book's bob never reaches it. */}
            <p
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                bottom: phone ? "21svh" : "8svh",
                margin: 0,
                textAlign: "center",
                color: "#b7272b",
                // Fahkwang Bold in capitals, loaded by the page.
                fontFamily: "var(--font-fahkwang), serif",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: phone ? 13 : 15,
                lineHeight: 1.5,
                letterSpacing: "0.06em",
                opacity: revealed ? 1 : 0,
                transition: "opacity 600ms ease-out",
              }}
            >
              Some of my work featured in Mint Magazine&rsquo;s Spring/Summer
              2026 edition.
            </p>
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                opacity: revealed ? 1 : 0,
                transition: "opacity 350ms ease-out",
                pointerEvents: done ? "auto" : "none",
              }}
            >
              <MagazineScene
                play={done}
                scrollTurn={phone}
                onCover={onCover}
                corners={corners}
              />
            </div>
            {/* Red squares at the magazine's corners while the mouse is over it;
              the scene moves each one to its corner every frame. */}
            <div
              ref={corners}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                opacity: 0,
                transition: "opacity 250ms ease-out",
                pointerEvents: "none",
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 8,
                    height: 8,
                    background: "#b7272b",
                    willChange: "transform",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {done ? null : (
          <MintIntro
            cover={cover}
            onDrop={onDrop}
            onReveal={onReveal}
            onDone={onDone}
          />
        )}
      </div>
      {/* After the magazine, outside the hero's wrapper, so the hero scrolls
        away as the gallery comes up rather than staying pinned behind it. */}
      <MintGallery />
    </>
  );
}
