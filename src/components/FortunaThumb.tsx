"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The Hana scene, interactive AND clickable.
 *
 * A cross-origin iframe consumes pointer events, so the parent never sees a
 * click through it — which is why the Framer build had to choose, and chose the
 * link (pointer-events: none plus an invisible overlay).
 *
 * The way round it: clicking inside a cross-origin iframe makes that iframe
 * document.activeElement. Watching for that, while the pointer is over this
 * box, turns "focus moved into my iframe" into "the reader clicked the scene".
 * Hover still reaches the scene untouched.
 *
 * It has to be polled, and it cannot be gated on hover. None of the obvious
 * signals fire: the parent window never blurs (document.hasFocus() stays
 * true), no focus event reaches the iframe element from a cross-origin
 * document, and pointerenter does not fire over the iframe either, so the
 * parent cannot even tell the pointer is inside. activeElement is the only
 * thing that changes. The poll therefore runs while the box is on screen.
 *
 * tabIndex -1 keeps the iframe out of the tab order, so focus can only land on
 * it by being clicked. Without that, tabbing past this box would navigate.
 *
 * Trade-off worth knowing: with no visible chip there is no keyboard route to
 * this case study. Acceptable while every box points at the same placeholder;
 * revisit when the real pages exist.
 *
 * The corner chip stays as the visible affordance and the keyboard path, since
 * the focus trick is mouse-only.
 */
export default function FortunaThumb({
  src,
  href,
  label,
}: {
  src: string;
  href: string;
  label: string;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  // loading="lazy" fires too late: the scene initialises while the reader is
  // already scrolling past, which cost four dropped frames. A generous
  // rootMargin starts it well before it is needed so the work lands during
  // quiet time instead of mid-scroll.
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const preload = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          preload.disconnect();
        }
      },
      { rootMargin: "1200px 0px" },
    );
    preload.observe(el);

    const visible = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { rootMargin: "0px" },
    );
    visible.observe(el);

    return () => {
      preload.disconnect();
      visible.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!onScreen) return;
    const frame = iframeRef.current;
    if (!frame) return;

    // Clean baseline: focus may already be on the iframe from an earlier click,
    // in which case we would fire the moment the pointer returned.
    if (document.activeElement === frame) frame.blur();

    const id = setInterval(() => {
      if (document.activeElement === frame) {
        clearInterval(id);
        frame.blur();
        router.push(href);
      }
    }, 90);
    return () => clearInterval(id);
  }, [onScreen, href, router]);

  return (
    <div
      ref={holderRef}
      style={{ position: "absolute", inset: 0 }}
    >
      {mounted ? (
        <iframe
          ref={iframeRef}
          src={src}
          tabIndex={-1}
          title={`${label} — interactive scene`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
          }}
        />
      ) : null}

    </div>
  );
}
