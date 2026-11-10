"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import MintIntro, { type CoverRect } from "./MintIntro";
import { MINT_GREY } from "./colors";

/** three.js only runs in the browser, so the scene loads after the page. */
const MagazineScene = dynamic(() => import("./MagazineScene"), { ssr: false });

/** Soft studio grey, a little darker towards the edges. */
const BACKDROP = `radial-gradient(120% 95% at 50% 58%, #cfcec9 0%, ${MINT_GREY} 45%, #a9a8a3 100%)`;

/**
 * The opening montage plays over the 3D book, which loads underneath it
 * from the start, hidden. The montage ends on a flat cover card laid exactly
 * over the 3D cover; the canvas is shown under it, the card fades, and the
 * book tilts into place and can be paged through.
 */
/** Pages to turn by scrolling on a phone; matches the scene's leaves. */
const LEAVES = 5;
/** Scroll per page, as a share of the screen's height; matches the scene. */
const SCROLL_STEP = 0.6;
const PHONE = "(max-width: 767px)";

export default function MagazineStage() {
  const [cover, setCover] = useState<CoverRect | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const onCover = useCallback((r: CoverRect) => setCover(r), []);
  const onReveal = useCallback(() => setRevealed(true), []);
  const onDone = useCallback(() => setDone(true), []);

  // On a phone, scrolling turns the pages: the stage is a tall track with the
  // book pinned to the screen while the track scrolls by.
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

  return (
    <div style={{ position: "relative", height: phone ? `calc(100svh + ${LEAVES * SCROLL_STEP * 100}svh)` : "100svh" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100svh",
          background: BACKDROP,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: revealed ? 1 : 0,
            transition: "opacity 350ms ease-out",
          }}
        >
          <MagazineScene play={done} scrollTurn={phone} onCover={onCover} />
        </div>
        {done ? null : <MintIntro cover={cover} onReveal={onReveal} onDone={onDone} />}
      </div>
    </div>
  );
}
