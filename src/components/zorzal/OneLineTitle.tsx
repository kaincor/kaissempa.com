"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A chapter title that always sits on one line. It is set at its normal
 * size, and if that runs wider than the space beside the icon, the type is
 * scaled down just enough to fit. Short titles are untouched; long ones get
 * smaller, which is the cue to shorten them. Re-fits on resize and once the
 * webfont has loaded, since Captain Kai and its fallback measure differently.
 */
export default function OneLineTitle({ style, children }: { style: CSSProperties; children: ReactNode }) {
  const baseSize = style.fontSize;
  const box = useRef<HTMLHeadingElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const h = box.current;
    const t = text.current;
    if (!h || !t) return;
    // Back to the title's own size before measuring, not to nothing:
    // clearing the inline value would drop to the inherited body size.
    const own = String(baseSize ?? "");
    const fit = () => {
      h.style.fontSize = own;
      const room = h.clientWidth;
      const need = t.getBoundingClientRect().width;
      if (need > room && room > 0) {
        const base = parseFloat(getComputedStyle(h).fontSize);
        h.style.fontSize = `${Math.floor(base * (room / need) * 10) / 10}px`;
      }
    };
    fit();
    // Only a change of width can change the fit; refitting also changes the
    // height, which would otherwise call this straight back.
    let last = h.clientWidth;
    const ro = new ResizeObserver(() => {
      if (h.clientWidth === last) return;
      last = h.clientWidth;
      fit();
    });
    ro.observe(h);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [baseSize]);

  return (
    <h2 ref={box} style={{ ...style, flex: "1 1 auto", minWidth: 0, whiteSpace: "nowrap" }}>
      <span ref={text} style={{ display: "inline-block" }}>
        {children}
      </span>
    </h2>
  );
}
