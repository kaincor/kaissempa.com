"use client";

import { useEffect, useState } from "react";

/**
 * The window's height, held steady while a phone scrolls.
 *
 * Mobile browsers grow and shrink the window as their address bar slides
 * away and back, so `innerHeight` changes under the reader's thumb. Anything
 * mapped to it — the ridges' scroll lift — jumped every time. This reads the
 * height again only when the width changes too, which is a real resize or a
 * rotation, never the address bar.
 */
export function useStableVh() {
  const [vh, setVh] = useState(0);
  useEffect(() => {
    let w = -1;
    const sync = () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      setVh(window.innerHeight);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return vh;
}
