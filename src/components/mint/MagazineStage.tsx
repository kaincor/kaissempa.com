"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import MintGallery from "./MintGallery";
import MintHero from "./MintHero";
import MintRoom from "./MintRoom";
import { coverShare } from "./layout";
import MintIntro, { type CoverRect } from "./MintIntro";

/** three.js only runs in the browser, so the scene loads after the page. */
const MagazineScene = dynamic(() => import("./MagazineScene"), { ssr: false });

const PHONE = "(max-width: 767px)";
/** How much of the closed cover shows at the bottom of the first screen. */
const PEEK = 0.3;

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
 * The page scrolls normally: the magazine's screen overlaps the bottom of
 * the hero so the top of the closed issue peeks over the first screen, and
 * scrolling down brings it fully into view, the hero going up and away.
 * Pages turn by swiping, dragging or tapping, never by scrolling.
 *
 * Once the magazine is wholly in view, a short hint says it can be swiped.
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

  // How far the magazine's screen rides up under the hero, in screen
  // heights, so PEEK of the cover shows. The cover sits in the middle of that
  // screen, so its top is half the cover above the middle.
  const [aspect, setAspect] = useState(16 / 10);
  useEffect(() => {
    const set = () => setAspect(window.innerWidth / window.innerHeight);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  const share = coverShare(aspect);
  const overlap = 0.5 - share * (0.5 - PEEK);
  const corners = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // Whether the magazine has been scrolled all the way into view.
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!done) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const t = track.current;
      if (t) setUp(t.getBoundingClientRect().top <= 10);
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

  // The hint that the pages turn: shown once, the first time the magazine is
  // all the way in view, for a second, or until the reader touches the book.
  const [hint, setHint] = useState<"waiting" | "shown" | "gone">("waiting");
  const showHint = up && hint === "waiting";
  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => {
      setHint("shown");
      // The cover lifts a little and settles back, as if about to open.
      window.dispatchEvent(new Event("mint-nudge"));
    }, 450);
    return () => clearTimeout(t);
  }, [showHint]);
  useEffect(() => {
    if (hint !== "shown") return;
    const t = setTimeout(() => setHint("gone"), 1000);
    return () => clearTimeout(t);
  }, [hint]);
  const dismissHint = useCallback(() => setHint("gone"), []);

  return (
    <>
      <div style={{ position: "relative" }}>
        <MintRoom />
        <div style={{ position: "relative", height: "100svh", zIndex: 1 }}>
          <MintHero show={dropped} />
        </div>
        <div
          ref={track}
          data-mint-track=""
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: `-${(overlap * 100).toFixed(2)}svh`,
            height: "100svh",
            // Clicks on the hero's part of the screen go through to it.
            pointerEvents: "none",
          }}
        >
          <div
            style={{ position: "relative", width: "100%", height: "100svh" }}
          >
            {/* The caption, a set distance under the book, moving with it; low
              enough that the book's bob never reaches it. Under it, a pointer
              to the gallery below, the same size. Proxima Nova Extrabold,
              read from the fonts installed on this computer: it is
              commercial, so no file is served until it is licensed for the
              web, and elsewhere it falls back to the site's sans. */}
            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                bottom: phone ? "17svh" : "4.5svh",
                textAlign: "center",
                color: "#b7272b",
                fontFamily: '"Proxima Nova", var(--font-sans), sans-serif',
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                lineHeight: 1.5,
                opacity: revealed ? 1 : 0,
                transition: "opacity 600ms ease-out",
              }}
            >
              <p style={{ margin: 0, fontSize: phone ? 13 : 15 }}>
                Some of my work for Mint Magazine&rsquo;s Spring/Summer 2026
                edition.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: phone ? 13 : 15 }}>
                More shots below
              </p>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                opacity: revealed ? 1 : 0,
                transition: "opacity 350ms ease-out",
                pointerEvents: done ? "auto" : "none",
              }}
              onPointerDown={dismissHint}
            >
              <MagazineScene
                play={done}
                phone={phone}
                onCover={onCover}
                corners={corners}
              />
            </div>
            {/* The hint: a small red "Swipe" by the top right corner of the
                closed cover (which sits in the middle of the screen once it is
                in view), up for a second, gliding left and right like a
                finger swiping the page. */}
            <div
              aria-hidden={hint !== "shown"}
              role="status"
              style={{
                position: "absolute",
                ...(cover
                  ? {
                      left: `calc(50% + ${cover.w / 2 - 18}px)`,
                      top: `calc(50% - ${cover.h / 2 + 22}px)`,
                    }
                  : { left: "62%", top: "18%" }),
                zIndex: 3,
                pointerEvents: "none",
                opacity: hint === "shown" ? 1 : 0,
                transition: `opacity ${hint === "shown" ? 180 : 260}ms ease-out`,
              }}
            >
              <div
                key={hint}
                className={
                  hint === "shown" ? "mint-hint mint-hint-on" : "mint-hint"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  borderRadius: 999,
                  background: "rgba(183, 39, 43, 0.92)",
                  color: "#fff",
                  fontFamily: "var(--font-fahkwang), serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)",
                }}
              >
                <span aria-hidden="true">&larr;</span>
                Swipe
              </div>
            </div>
            <style>{`
              .mint-hint-on { animation: mint-sway 1s ease-in-out both; }
              @keyframes mint-sway {
                0% { transform: translateX(0); }
                30% { transform: translateX(-12px); }
                65% { transform: translateX(9px); }
                100% { transform: translateX(-4px); }
              }
              @media (prefers-reduced-motion: reduce) { .mint-hint-on { animation: none; } }
            `}</style>
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
        <MintGallery />
        {done ? null : (
          <MintIntro
            cover={cover}
            onDrop={onDrop}
            onReveal={onReveal}
            onDone={onDone}
          />
        )}
      </div>
    </>
  );
}
