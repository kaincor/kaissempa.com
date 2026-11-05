"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { MOBILE_MQ, SITE_TOP } from "@/lib/theme-color";

/**
 * Keeps the strip behind the status bar the colour of whatever is at the top
 * of the screen, on phones. Safari paints that strip from
 * <meta name="theme-color">, and falls back to grey when it has none.
 *
 * Each page's opening colour is in its viewport export, so the first paint is
 * right before this runs; this follows it as the page scrolls into sections
 * of other colours. It reads the topmost opaque background under the very top
 * of the screen. Art with no flat colour of its own (the Zorzal sky) says
 * what to use with data-theme-color (and data-theme-color-bottom, for the
 * bottom edge). The html background follows along, so nothing grey shows
 * behind it either.
 *
 * Newer Safari ignores theme-color in the browser and instead takes its edge
 * colours from fixed elements touching the top and bottom of the screen
 * (joshpuckett.me/seamless-mobile-safari). So there are two thin fixed strips
 * as well, one at each edge, painted the colour under them and fading into the
 * page so they don't draw a line. Styles in globals.css, phones only.
 */
export default function ThemeColor() {
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const root = document.documentElement;
    let last = "";
    let lastBottom = "";
    let raf = 0;

    const update = () => {
      raf = 0;
      if (!mq.matches) {
        if (last) root.style.removeProperty("background-color");
        last = lastBottom = "";
        return;
      }
      const bottom = colorAt(window.innerHeight - 2, "themeColorBottom");
      if (bottom !== lastBottom) {
        lastBottom = bottom;
        root.style.setProperty("--edge-bottom", bottom);
      }
      const color = colorAt(1, "themeColor");
      if (color === last) return;
      last = color;
      root.style.setProperty("--edge-top", color);
      // Next owns these tags and may swap them on navigation, so they are
      // found afresh each time rather than held on to.
      const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      if (metas.length === 0) {
        const m = document.createElement("meta");
        m.name = "theme-color";
        m.media = MOBILE_MQ;
        document.head.appendChild(m);
        m.content = color;
      } else {
        metas.forEach((m) => (m.content = color));
      }
      root.style.backgroundColor = color;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // After Next has put the new page's tags in place.
    const t = setTimeout(schedule, 50);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mq.addEventListener("change", schedule);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mq.removeEventListener("change", schedule);
    };
  }, [pathname]);

  return (
    <>
      <div aria-hidden="true" className="edge-strip edge-top" />
      <div aria-hidden="true" className="edge-strip edge-bottom" />
    </>
  );
}

/**
 * The first opaque colour at height y, near the left edge, front to back. A
 * data attribute on the way wins; at the bottom edge, a bottom-specific one
 * first, then the general one.
 */
function colorAt(y: number, key: "themeColor" | "themeColorBottom"): string {
  for (const el of document.elementsFromPoint(8, y)) {
    const data = (el as HTMLElement).dataset;
    const tagged = data?.[key] ?? data?.themeColor;
    if (tagged) return tagged;
    const rgb = opaque(getComputedStyle(el).backgroundColor);
    if (rgb) return rgb;
  }
  return opaque(getComputedStyle(document.body).backgroundColor) ?? SITE_TOP;
}

function opaque(css: string): string | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parseFloat(a) < 0.95) return null;
  const hex = (v: string) => Math.round(parseFloat(v)).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
