"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { ProjectThumbs } from "@/components/ProjectsAndProducts";
import RoseHeading, { type RosePlace } from "@/components/pond-mage/RoseHeading";

/**
 * The close of every case study (Figma: Footer, "Case Study Footer"): "More
 * stuff I've done" over the six homepage thumbnails in a grid, then a
 * mountain range in the study's own colour that rises over the bottom of the
 * grid as the reader reaches the end of the page, carrying the way home.
 *
 * Each study keeps its own ground: the footer sits on the colour the page
 * ends on, and the heading and the links are set in the study's navbar face.
 * Mounted once, from the root layout, for the case-study routes.
 */

type Theme = {
  prefix: string;
  /** The colour the page ends on, which the footer continues. */
  bg: string;
  /** The heading's colour on it. */
  ink: string;
  /** The mountain: the navbar's glass for the study, same colour and opacity. */
  ridge: string;
  font: string;
  weight: number;
  caps?: boolean;
  /** Kai's roses growing on the heading (Pond Mage), as on the study's own headings. */
  roses?: RosePlace[];
};

const THEMES: Theme[] = [
  { prefix: "/fortuna", bg: "#32443e", ink: "#f1efe8", ridge: "rgba(105, 189, 69, 0.42)", font: "var(--f-display-stack)", weight: 600 },
  { prefix: "/zorzal", bg: "#fffdf6", ink: "#983c44", ridge: "rgba(152, 60, 68, 0.74)", font: "var(--z-captain-stack)", weight: 700 },
  { prefix: "/mint", bg: "#a3a3a3", ink: "#111111", ridge: "rgba(183, 39, 43, 0.74)", font: "var(--mint-fahkwang)", weight: 700, caps: true },
  { prefix: "/pond-mage", bg: "#140b17", ink: "#efd48c", ridge: "rgba(157, 114, 170, 0.5)", font: "var(--pm-kaisteel)", weight: 400,
    roses: [
      { c: "C", at: 0, u: 0.25, v: -0.22, w: 0.95 },
      { c: "E", at: 19, u: 1.15, v: 1.02, w: 1.25 },
    ],
  },
];

/** Mountain Range 29, from the footer frame (4096 x 453). */
const RIDGE = {
  viewBox: "0 0 4096 453",
  d: "M506.483 183.76C513.523 180.671 520.618 177.711 527.765 174.878C607.103 143.203 780.239 92.1443 864.019 103.675C893.795 107.777 923.687 124.511 951.338 136.259C978.042 147.598 1003.35 155.232 1032.58 150.695C1079.71 143.375 1160.61 91.069 1223.08 76.7543C1353.65 46.8451 1489.91 54.2104 1615.31 3.63222C1631.56 1.32855 1648.27 -1.39722 1664.66 0.823252C1698 5.34739 1730.52 21.4922 1761.63 33.5353C1826.85 58.7604 1912.75 93.8718 1982.33 98.5367C2096.65 106.19 2216.28 49.7442 2330.72 38.981C2345.89 45.1561 2361.83 52.2396 2372.52 64.8842C2455.41 56.3606 2538.62 13.0263 2622.41 28.1665C2665.87 36.031 2755.54 66.8807 2781.4 103.464C2832.35 110.286 2886.12 101.711 2935.86 112.807C2971.96 120.863 3003.58 147.957 3039.23 159.251C3086.27 174.161 3139.02 174.922 3187.66 183.19C3225.11 189.544 3262.17 202.208 3300.06 205.196C3328.42 207.436 3357.67 205.171 3385.96 202.413C3483.19 192.923 3559.81 150.613 3642.63 139.517C3683.85 133.994 4061.95 224.465 4096 249.856C4096 285.55 4096 425.984 4096 452.315C3587.22 452.315 3066.69 451.989 2557.76 451.976L0 452.143L0.0765721 257.771C48.7355 245.395 96.7287 228.233 145.125 214.513C202.854 198.151 261.057 185.378 319.477 171.876C351.225 164.543 384.72 153.716 417.467 153.242C418.491 153.23 419.515 153.236 420.539 153.217C447.096 152.679 480.444 174.942 506.483 183.76Z",
};
/** The range's height: its own proportion of the width, but never too thin to carry the links. */
const RIDGE_H = "max(11.06vw, 132px)";
/** How much scrolling past the bottom of the page the range rises over, px. */
const RISE = 260;
/** The range as a mask, so the glass (colour plus blur of what is behind) takes its shape. */
const RIDGE_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${RIDGE.viewBox}"><path d="${RIDGE.d}"/></svg>`,
)}")`;

export default function CaseStudyFooter() {
  const pathname = usePathname();
  const theme = THEMES.find((t) => pathname?.startsWith(t.prefix));
  if (!theme) return null;
  // Keyed by route so each study's footer measures its own page afresh.
  return <Footer key={theme.prefix} theme={theme} />;
}

function Footer({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLElement>(null);
  const tail = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // The range waits until the page has reached its bottom, then rises with
  // the scrolling that follows. The footer pins once its foot meets the
  // bottom of the screen, and RISE px of scroll are added after it: over
  // those the thumbnails hold still and the range comes up over them.
  const { scrollYProgress } = useScroll({ target: tail, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);

  // Pinned with its foot on the bottom of the screen, however tall it is.
  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    const pin = () => {
      f.style.top = `${window.innerHeight - f.offsetHeight}px`;
    };
    pin();
    const ro = new ResizeObserver(pin);
    ro.observe(f);
    window.addEventListener("resize", pin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", pin);
    };
  }, []);

  // The heading is set to the width of one thumbnail.
  const heading = useRef<HTMLSpanElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = heading.current;
    const g = grid.current;
    if (!h || !g) return;
    const fit = () => {
      // offsetWidth, not the bounding box: the thumbnails grow in from 90%.
      const cell = (g.firstElementChild as HTMLElement | null)?.offsetWidth;
      if (!cell) return;
      h.style.fontSize = "100px";
      const w = h.getBoundingClientRect().width;
      if (w) h.style.fontSize = `${Math.min(72, (100 * cell) / w)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(g);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  const face = {
    fontFamily: theme.font,
    fontWeight: theme.weight,
    textTransform: theme.caps ? ("uppercase" as const) : undefined,
  };

  return (
    <div style={{ position: "relative", background: theme.bg }}>
      <footer
        ref={ref}
        style={{
          position: reduced ? "relative" : "sticky",
          overflow: "hidden",
          background: theme.bg,
          paddingTop: "clamp(64px, 10vh, 120px)",
        }}
      >
        <h2
          style={{
            ...face,
            margin: "0 0 clamp(24px, 3.5vw, 44px)",
            textAlign: "center",
            color: theme.ink,
            lineHeight: 1.15,
            letterSpacing: theme.caps ? "0.04em" : undefined,
          }}
        >
          <span ref={heading} style={{ display: "inline-block", whiteSpace: "nowrap", fontSize: "clamp(22px, 2.4vw, 36px)" }}>
            {theme.roses ? <RoseHeading text="More stuff I’ve done" rose={theme.roses} /> : <>More stuff I&rsquo;ve done</>}
          </span>
        </h2>

        <div ref={grid} className="csf-grid">
          <ProjectThumbs
            fill
            sizes="(max-width: 1000px) 50vw, 34vw"
            maxWidth={700}
          />
        </div>

        {/* Room for the part of the range that does not overlap the grid. The
            overlap is half the range's own proportion (5.53vw), so on a phone,
            where the range is held taller than that to carry the links, the
            extra height goes below the thumbnails rather than over them. */}
        <div aria-hidden="true" style={{ height: `calc(${RIDGE_H} - 5.53vw)` }} />

        <motion.div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: RIDGE_H,
            y: reduced ? 0 : y,
            willChange: "transform",
            zIndex: 2,
          }}
        >
          {/* The navbar's glass in the shape of the range: its colour and
              opacity, over a short blur of the thumbnails behind. Cropped at the
              sides on a narrow screen (cover) rather than stretched. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: theme.ridge,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              maskImage: RIDGE_MASK,
              WebkitMaskImage: RIDGE_MASK,
              maskSize: "cover",
              WebkitMaskSize: "cover",
              maskPosition: "center bottom",
              WebkitMaskPosition: "center bottom",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            }}
          />
          <nav
            aria-label="Footer"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "58%",
              transform: "translateY(-50%)",
              display: "flex",
              justifyContent: "center",
              gap: "clamp(48px, 10vw, 180px)",
            }}
          >
            {[
              { label: "Home", href: "/" },
              { label: "Work", href: "/work" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="csf-link"
                style={{ ...face, color: "#ffffff", fontSize: "clamp(20px, 2.2vw, 36px)", letterSpacing: theme.caps ? "0.05em" : undefined }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </motion.div>

        <style>{`
          .csf-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: clamp(6px, 1.4vw, 10px);
            padding: 0 clamp(10px, 1.4vw, 24px);
          }
          @media (min-width: 1001px) { .csf-grid { grid-template-columns: repeat(3, 1fr); } }
          .csf-link { text-decoration: none; transition: opacity 0.2s ease; }
          .csf-link:hover { opacity: 0.75; }
          .csf-link:focus-visible { outline: 2px solid #fff; outline-offset: 6px; border-radius: 4px; }
        `}</style>
      </footer>
      {/* The scroll the range rises over, once the page has reached the bottom. */}
      {reduced ? null : <div ref={tail} aria-hidden="true" style={{ height: RISE }} />}
    </div>
  );
}
