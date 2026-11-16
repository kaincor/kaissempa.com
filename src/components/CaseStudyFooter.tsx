"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { ProjectThumbs } from "@/components/ProjectsAndProducts";

/**
 * The close of every case study (Figma: Case Study Footer, 3767:2717): the six
 * homepage thumbnails in a grid, then two mountain ranges that rise over the
 * bottom of it, one after the other, as the reader scrolls past the end of
 * the page. First the study's own range, in the navbar's glass, carrying the
 * study's K and Home, Work and About; then a black
 * range in front of it on the right, the same on every study, carrying
 * LinkedIn, GitHub, Instagram, Letterboxd, Dribbble and Behance, each in its
 * own colour, opening in a new tab. Every word is in Kaicords, in capitals.
 *
 * Each study keeps its own ground: the footer sits on the colour the page
 * ends on.
 *
 * Home, About and Work close the same way (Figma 3793:1732), without the
 * thumbnails: a grey range with the grey K and "Kai Ssempa" and the year in
 * place of the page links, then the same black range.
 *
 * Mounted once, from the root layout.
 */

type Theme = {
  /** The routes it closes: a prefix, or the exact path for the site's own pages. */
  prefix: string;
  exact?: boolean;
  /** The site's pages: no thumbnails, and the name and year in place of the page links. */
  site?: boolean;
  /** The name, copyright mark and year, where not the default off-white. */
  ink?: string;
  /** The colour the page ends on, which the footer continues. */
  bg: string;
  /** The mountain: the navbar's glass for the study, same colour and opacity. */
  ridge: string;
  /** The study's own K (Kai's logo, recoloured for it), and its width over height. */
  k: { src: string; ar: number };
};

const THEMES: Theme[] = [
  { prefix: "/fortuna", bg: "#32443e", ridge: "rgba(105, 189, 69, 0.42)", k: { src: "/footer/k-fortuna.png", ar: 289 / 363 } },
  { prefix: "/zorzal", bg: "#fffdf6", ridge: "rgba(152, 60, 68, 0.74)", k: { src: "/footer/k-zorzal.png", ar: 289 / 363 } },
  // Clear, so Mint's room (fixed behind the page, clouds of light and all)
  // carries on behind the thumbnails rather than stopping at a flat grey.
  { prefix: "/mint", bg: "transparent", ridge: "rgba(183, 39, 43, 0.74)", k: { src: "/footer/k-mint.png", ar: 289 / 363 } },
  { prefix: "/pond-mage", bg: "#140b17", ridge: "rgba(157, 114, 170, 0.5)", k: { src: "/footer/k-pond-mage.svg", ar: 347 / 363 } },
  ...["/", "/about", "/work"].map((prefix) => ({
    prefix,
    exact: true,
    site: true,
    // The colour each ends on: home runs straight on from More About Me's
    // black; About and Work end in the page grey, under the frame's dark
    // grey range. On home's black the two greys swap (Figma 3794:1931): the
    // page grey for the range, the dark grey for the name and year.
    bg: prefix === "/" ? "#000000" : "#d4d4d4",
    ridge: prefix === "/" ? "#d4d4d4" : "#525157",
    ink: prefix === "/" ? "#525157" : undefined,
    k: { src: "/footer/k-home.svg", ar: 140 / 176.235 },
  })),
];

/** Mountain Range 29, from the footer frame (4096 x 453). */
const RIDGE = {
  viewBox: "0 0 4096 453",
  d: "M506.483 183.76C513.523 180.671 520.618 177.711 527.765 174.878C607.103 143.203 780.239 92.1443 864.019 103.675C893.795 107.777 923.687 124.511 951.338 136.259C978.042 147.598 1003.35 155.232 1032.58 150.695C1079.71 143.375 1160.61 91.069 1223.08 76.7543C1353.65 46.8451 1489.91 54.2104 1615.31 3.63222C1631.56 1.32855 1648.27 -1.39722 1664.66 0.823252C1698 5.34739 1730.52 21.4922 1761.63 33.5353C1826.85 58.7604 1912.75 93.8718 1982.33 98.5367C2096.65 106.19 2216.28 49.7442 2330.72 38.981C2345.89 45.1561 2361.83 52.2396 2372.52 64.8842C2455.41 56.3606 2538.62 13.0263 2622.41 28.1665C2665.87 36.031 2755.54 66.8807 2781.4 103.464C2832.35 110.286 2886.12 101.711 2935.86 112.807C2971.96 120.863 3003.58 147.957 3039.23 159.251C3086.27 174.161 3139.02 174.922 3187.66 183.19C3225.11 189.544 3262.17 202.208 3300.06 205.196C3328.42 207.436 3357.67 205.171 3385.96 202.413C3483.19 192.923 3559.81 150.613 3642.63 139.517C3683.85 133.994 4061.95 224.465 4096 249.856C4096 285.55 4096 425.984 4096 452.315C3587.22 452.315 3066.69 451.989 2557.76 451.976L0 452.143L0.0765721 257.771C48.7355 245.395 96.7287 228.233 145.125 214.513C202.854 198.151 261.057 185.378 319.477 171.876C351.225 164.543 384.72 153.716 417.467 153.242C418.491 153.23 419.515 153.236 420.539 153.217C447.096 152.679 480.444 174.942 506.483 183.76Z",
};
/** Mountain Range 24, the black range in front (5108 x 686 against the 7000-wide frame). */
const BLACK = {
  viewBox: "0 0 5108 686",
  d: "M3116.98 62.0702C3150.47 51.0659 3189.51 23.2888 3215.32 1.36435C3252.46 -6.37369 3297.59 20.6253 3329.65 36.5289C3373.52 58.2922 3612.63 199.49 3623.32 232.118C3651.67 227.26 3725.94 194.507 3749.22 200.962C3761.81 204.439 3782.15 229.307 3794.9 237.634C3838.05 265.972 3986.63 311.951 4033.5 319.998C4113.79 333.77 4192.29 297.667 4253.34 259.993C4262.29 264.282 4270.6 268.432 4278.44 274.27C4323.65 308.145 4407.5 306.435 4464.35 319.998C4516.84 332.53 4638.64 274.63 4682.5 303.5C4736.5 294.164 4753.33 258.689 4804 239C4909.31 296.306 4984.23 432.409 5064.28 519.708C5083.83 541.057 5110.91 651.18 5107.75 680.198C4737.27 690.824 4363.16 681.873 3992.37 681.873L1866.21 686L1288.43 681.862L710.647 681.894C488.894 681.887 221.705 686.057 0 681.894C73.5323 632.312 149.859 524.921 214.5 466.5C254.176 430.648 328 398 362 308.089C401.763 316.753 503.748 338.489 541.5 352.5C629.5 329 653.362 328.261 736.934 308.089C820.086 288.015 901.908 260.729 986.605 246.297C1006.41 259.446 1027.08 271.873 1043.1 288.765C1126.71 277.789 1194.73 223.125 1278.1 213.999C1335.26 207.74 1394.35 217.847 1451.66 221.373C1464.99 218.758 1473.14 206.45 1485.91 202.154C1551.24 180.166 1815.54 273.724 1880.7 302.37C1927.97 289.27 1984.82 241.965 2018.95 209.815C2141.28 220.195 2120.61 177.727 2198.68 166.463C2234.23 161.326 2575.57 227.316 2670.18 227.835C2695.52 227.968 2725.84 226.188 2749.76 218.366C2785.31 206.731 2823.39 179.521 2856.65 162.307C2925.61 126.68 2997.03 104.615 3055.38 53.512C3075.73 53.2947 3097.03 58.6497 3116.98 62.0702Z",
};
/** The phone's ranges (Figma: Mobile Footer, 3793:1903), drawn for a 2362-wide screen. */
const RIDGE_PHONE = {
  viewBox: "0 0 2397.36 676.238",
  d: "M1098.86 87.0558C1083.39 75.2845 1060.63 58.398 1057.08 56.0457C1054.96 54.3834 1038.33 40.1348 1036.29 38.3213C1028.02 31.0671 1016.42 23.5482 1003.24 16.5985C981.203 6.92737 965.513 -4.46648 937.131 1.79171C917.708 6.07434 873.306 26.5835 820.299 37.958C806.087 41.0077 793.526 44.3989 779.885 46.1126C756.277 49.0784 725.962 48.6564 706.563 57.655C691.133 64.8121 675.307 75.4165 664.113 80.7188C653.684 85.6586 644.284 95.8196 621.517 96.0277C580.395 96.4037 569.918 93.8522 554.189 90.0218L554.017 89.9799C536.495 85.7131 526.004 82.3633 508.6 78.0225C497.345 75.2153 468.999 72.1155 446.617 76.0875C413.278 82.0039 390.447 87.5155 373.671 93.0844C359.133 97.9104 343.261 104.124 325.232 109.114C311.669 112.867 298.823 116.25 286.748 109.648C273.445 102.374 260.346 82.7445 244.737 82.3265C232.272 81.9928 217.454 83.4249 205.304 85.6691C188.567 88.7605 165.123 96.2187 151.078 99.7588C139.558 102.662 125.903 107.86 95.7537 118.775C53.7517 133.981 6.74661 141.209 0 141.361V676.238H2397.36V418.226C2395.55 417.218 2394 416.511 2389.56 414.335C2378.01 408.621 2369.24 403.768 2365.24 400.987C2355.45 395.04 2348.2 390.535 2342.32 385.165C2333.6 377.203 2321.29 366.677 2315.59 360.104C2303.46 346.113 2294.79 335.702 2290.64 329.876C2286.6 324.208 2282.27 313.822 2273.46 308.604C2267.12 304.849 2259.65 303.314 2257.4 303.314C2253.44 306.234 2232.05 313.019 2225.14 316.922C2218.23 320.825 2207.24 327.177 2200.31 331.023C2174.11 346.106 2137.57 374.077 2115.41 377.409C2092.56 380.846 2057.22 382.16 2044.78 369.419C2030.88 355.193 2021.54 341.606 2012.8 327.122C2005.28 314.653 1999.2 298.714 1987.23 298.604C1981.7 298.553 1968.74 312.271 1956.21 306.553C1945.08 301.47 1937.02 293.382 1930.26 283.146C1921.67 270.139 1915.83 290.17 1902.93 288.637C1897.16 287.952 1862.75 285.6 1843.43 299.193C1822.74 313.739 1824.3 302.973 1811.5 299.193C1799.58 295.671 1665.18 327.948 1653.93 327.122C1566.93 320.737 1548.81 243.102 1534.43 229.193C1509.94 205.517 1461.89 204.201 1446.43 204.237C1434.94 204.264 1402.79 223.023 1390.93 218.637C1378.08 213.891 1345.53 218.268 1333.43 204.237C1324.53 193.92 1289.21 170.918 1274.97 154.819C1264.38 142.832 1200.8 109.908 1181.37 113.927C1167.95 116.701 1150.74 125.128 1139.07 118.929C1124.99 111.454 1111.54 96.698 1098.86 87.0558Z",
};
const BLACK_PHONE = {
  viewBox: "0 0 3162.5 567",
  d: "M1791.96 27.3253C1777.23 22.4809 1760.06 10.2525 1748.72 0.600631C1732.39 -2.80591 1712.54 9.07995 1698.44 16.0813C1679.16 25.6622 1574.02 87.8223 1569.32 102.186C1556.85 100.048 1524.2 85.6283 1513.96 88.4702C1508.43 90.0007 1499.48 100.949 1493.87 104.614C1474.9 117.09 1409.57 137.331 1388.96 140.874C1353.66 146.937 1319.14 131.043 1292.3 114.458C1288.36 116.346 1284.71 118.173 1281.26 120.743C1261.38 135.656 1224.51 134.903 1199.51 140.874C1176.43 146.391 1122.88 120.901 1103.59 133.611C1079.85 129.501 1072.45 113.883 1050.17 105.216C1003.87 130.444 970.923 100.361 935.725 138.793C927.126 148.191 915.219 551.671 916.612 564.446C1079.51 569.123 1244.01 565.183 1407.05 565.183L2341.92 567L2595.97 565.179L2850.03 565.192C2947.53 565.189 3065.02 567.025 3162.5 565.192C3130.17 543.365 3096.61 231.088 3068.18 205.369C3050.74 189.586 3018.28 175.213 3003.33 135.631C2985.84 139.445 2941 149.014 2924.4 155.182C2885.71 144.837 2875.22 144.512 2838.47 135.631C2801.91 126.794 2765.93 114.781 2728.69 108.428C2719.98 114.217 2710.89 119.688 2703.85 127.124C2667.08 122.292 2637.17 98.2271 2600.52 94.2096C2575.38 91.4541 2549.4 95.9036 2524.2 97.4557C2518.34 96.3047 2514.76 90.8863 2509.14 88.9948C2480.41 79.3152 2364.2 120.502 2335.55 133.113C2314.77 127.346 2289.77 106.521 2274.76 92.3674C2220.98 96.9372 2230.06 78.2414 2195.74 73.2827C2180.1 71.021 2030.02 100.072 1988.41 100.301C1977.27 100.359 1963.94 99.5754 1953.43 96.1319C1937.79 91.0097 1921.05 79.0313 1906.43 71.453C1876.1 55.7687 1844.7 46.0551 1819.04 23.5578C1810.09 23.4621 1800.73 25.8196 1791.96 27.3253Z M884.66 118.543C872.244 117.677 859.932 115.989 847.543 114.953C791.462 154.197 706.564 133.261 659.212 179.281C629.678 183.886 602.222 189.632 573.845 199.436C552.506 193.017 527.293 182.761 505.166 181.184L476.5 209L434.5 199.436L335.5 565.51H1880.5L1835.01 407.381C1773.02 407.899 1730.33 392.481 1681.39 352.852C1655.97 354.815 1630.49 357.219 1605.02 358.36C1566.14 326.384 1524.19 299.26 1485.19 267.791C1457.85 245.724 1437.81 218.529 1406.91 200.889C1354.3 202.896 1268.5 231.525 1212.81 242.801C1190.33 213.185 1099.98 98.9994 1068.55 93.7004C1066.09 93.2868 1064.72 93.2095 1062.35 93C1010.52 138.508 962.692 123.957 884.66 118.543Z M66.6875 118.893C37.8444 99.3005 36.4275 559.511 0 566.4H656.197V182.786C607.635 178.658 519.673 146.664 475.03 124.195C445.187 143.592 415.119 159.08 383.279 174.667C358.573 166.674 340.09 161.742 321.09 143.197L270.423 133.654C262.75 139.956 255.203 144.785 246.452 149.47C200.824 123.342 156.025 94.5971 104.573 82.1738C88.5625 92.1346 78.4462 104.465 66.6875 118.893Z",
};
/** How much scrolling past the bottom of the page each range rises over, px:
    the study's range over the first half, then the black one over the second. */
const RISE = 520;
/** The range as a mask, so the glass (colour plus blur of what is behind) takes its shape. */
const maskOf = (r: { viewBox: string; d: string }) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.viewBox}" preserveAspectRatio="none"><path d="${r.d}"/></svg>`,
  )}")`;
const RIDGE_MASK = maskOf(RIDGE);
const BLACK_MASK = maskOf(BLACK);
const RIDGE_MASK_PHONE = maskOf(RIDGE_PHONE);
const BLACK_MASK_PHONE = maskOf(BLACK_PHONE);

const PAGES = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
];

/** The links on the black range, in the Figma's order and colours. */
/** On a phone the row runs LinkedIn, Instagram, GitHub, Letterboxd, Dribbble, Behance (the Mobile Footer's order). */
const SOCIALS: { label: string; href: string; color?: string; style?: React.CSSProperties; seams?: boolean }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kaissempa", color: "#006699" },
  { label: "GitHub", href: "https://github.com/kaincor", color: "#f5f5f5" },
  { label: "Instagram", href: "https://www.instagram.com/kaincor/", color: "#ff039a" },
  {
    label: "Letterboxd",
    href: "https://boxd.it/4aEoT",
    // Letterboxd's three dots, run across the word.
    style: {
      backgroundImage: "linear-gradient(90deg, #fe8c12 29.8%, #2ad12b 50%, #5bc0f8 70%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    },
  },
  // Pink, with the ball's two seams running through the letters (Kai's
  // Intersect layer, cut to the glyphs).
  { label: "Dribbble", href: "https://dribbble.com/kitalala", color: "#e74d89", seams: true },
  { label: "Behance", href: "https://www.behance.net/kaissempa", color: "#005be3" },
];

export default function CaseStudyFooter() {
  const pathname = usePathname();
  const theme = THEMES.find((t) => (t.exact ? pathname === t.prefix : pathname?.startsWith(t.prefix)));
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
  const pinned = useScroll({ target: tail, offset: ["start end", "end end"] });
  // The site's pages have no thumbnails to hold on screen, so there the
  // footer is not pinned: the ranges rise as it scrolls into view instead,
  // rather than over a screenful of empty grey.
  const entering = useScroll({ target: ref, offset: ["start end", "end end"] });
  const progress = theme.site ? entering.scrollYProgress : pinned.scrollYProgress;
  // The study's range rises first; the black one only once it is up.
  const y = useTransform(progress, [0, 0.5], ["100%", "0%"]);
  const yBlack = useTransform(progress, [0.5, 1], ["100%", "0%"]);

  // On a phone the black range runs along the whole foot of the screen once
  // it is up, so Safari's bottom bar (ThemeColor) should be black too. It
  // can't see the black range itself, which lets clicks through to the row
  // under it, so the range in front of it says so while the black is up.
  const front = useRef<HTMLDivElement>(null);
  // What has arrived: the name and year once the first range is up, and the
  // links, one after another, once the black one is. Scrolling back up
  // takes them away again, so they come in afresh each time.
  // Written straight onto the footer (data-stage), as the scroll moves.
  const settle = (v: number) => {
    if (ref.current) ref.current.dataset.stage = String(reduced ? 2 : v >= 0.97 ? 2 : v >= 0.47 ? 1 : 0);
    const el = front.current;
    if (!el) return;
    if (reduced || v > 0.8) el.dataset.themeColorBottom = "#000000";
    else delete el.dataset.themeColorBottom;
  };
  useMotionValueEvent(progress, "change", settle);
  // Opened at the foot of the page, there is no scroll to report it.
  useEffect(() => {
    const id = requestAnimationFrame(() => settle(progress.get()));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, reduced]);

  // Pinned with its foot on the bottom of the screen, however tall it is.
  useEffect(() => {
    const f = ref.current;
    if (!f || theme.site) return;
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
  }, [theme.site]);

  return (
    <div style={{ position: "relative", background: theme.bg }}>
      <footer
        ref={ref}
        data-stage="0"
        style={{
          position: reduced || theme.site ? "relative" : "sticky",
          overflow: "hidden",
          background: theme.bg,
          paddingTop: "clamp(64px, 10vh, 120px)",
        }}
      >
        {theme.site ? null : (
          <div className="csf-grid">
            <ProjectThumbs
              fill
              sizes="(max-width: 1000px) 50vw, 34vw"
              maxWidth={700}
            />
          </div>
        )}

        {/* Room for the part of the ranges that does not overlap the grid:
            the study's range, less half its own proportion (5.52vw), which
            hangs over the thumbnails. */}
        <div aria-hidden="true" className={theme.site ? "csf-room csf-room-full" : "csf-room"} />

        {/* The study's range, rising first. */}
        <motion.div className="csf-range" style={{ y: reduced ? 0 : y, zIndex: 2 }}>
          {/* The navbar's glass in the shape of the range: its colour and
              opacity, over a short blur of the thumbnails behind. */}
          <div
            ref={front}
            aria-hidden="true"
            className="csf-shape"
            style={{
              inset: 0,
              background: theme.ridge,
              // Glass over the thumbnails; the site's grey range is solid.
              backdropFilter: theme.site ? undefined : "blur(8px)",
              WebkitBackdropFilter: theme.site ? undefined : "blur(8px)",
              ["--csf-mask" as string]: RIDGE_MASK,
              ["--csf-mask-phone" as string]: RIDGE_MASK_PHONE,
            }}
          />
          <nav aria-label="Footer" className="csf-row csf-pages">
            <Link href="/" className="csf-link csf-k" aria-label="Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={theme.k.src} alt="" style={{ display: "block", height: "100%", width: "auto", aspectRatio: theme.k.ar }} />
            </Link>
            {theme.site ? (
              <p className="csf-name" style={theme.ink ? { color: theme.ink } : undefined}>
                <span>Kai Ssempa</span>
                {/* Kai's copyright mark: a Kaicords C in a hand-drawn ring. */}
                <span className="csf-copy" role="img" aria-label="copyright">
                  <i aria-hidden="true" />
                  <span aria-hidden="true">C</span>
                </span>
                <span suppressHydrationWarning>{new Date().getFullYear()}</span>
              </p>
            ) : (
              PAGES.map((l, i) => (
                <Link key={l.href} href={l.href} className="csf-link csf-page" style={{ color: "#f5f5f5", ["--i" as string]: i }}>
                  {l.label}
                </Link>
              ))
            )}
          </nav>
        </motion.div>

        {/* The black range in front, rising second, with the links out. */}
        <motion.div className="csf-range" style={{ y: reduced ? 0 : yBlack, zIndex: 3, pointerEvents: "none" }}>
          <div
            aria-hidden="true"
            className="csf-shape csf-black"
            style={{
              background: "#000",
              ["--csf-mask" as string]: BLACK_MASK,
              ["--csf-mask-phone" as string]: BLACK_MASK_PHONE,
            }}
          />
          <ul aria-label="Elsewhere" className="csf-row csf-socials">
            {SOCIALS.map((l, i) => (
              <li key={l.href} style={{ ["--i" as string]: i }}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="csf-link"
                  style={{ color: l.color, ...l.style }}
                >
                  {l.seams ? (
                    <span style={{ position: "relative", display: "inline-block" }}>
                      {l.label}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/footer/dribbble-seams.svg" alt="" aria-hidden="true" className="csf-seams" />
                    </span>
                  ) : (
                    l.label
                  )}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <style>{`
          .csf-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: clamp(6px, 1.4vw, 10px);
            padding: 0 clamp(10px, 1.4vw, 24px);
          }
          @media (min-width: 1001px) { .csf-grid { grid-template-columns: repeat(3, 1fr); } }

          /* Both ranges share one box, the study's range's proportion of the
             frame (7000 x 773), so their rows of links line up. */
          footer { --csf-h: 11.043vw; --csf-fs: 1.619vw; --csf-k: 1.679vw; }
          .csf-room { height: calc(var(--csf-h) - 5.52vw); }
          .csf-room-full { height: var(--csf-h); }
          .csf-range {
            position: absolute; left: 0; right: 0; bottom: 0;
            height: var(--csf-h);
            will-change: transform;
          }
          .csf-shape {
            position: absolute;
            mask-image: var(--csf-mask); -webkit-mask-image: var(--csf-mask);
            mask-size: 100% 100%; -webkit-mask-size: 100% 100%;
            mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat;
          }
          /* In the frame the black range starts 2106 in, is 5108 wide and runs
             214 past the right edge, and stands 686 of the 773. */
          .csf-black { left: 30.086%; width: 72.971%; bottom: 0; height: 88.75%; }

          /* One row across both ranges, centred 74% of the way down, set at
             two thirds of the frame's 170 of 7000 (Kai took it down a third), with
             its 130 gaps and the K in proportion, and its 100 margins. */
          .csf-row {
            position: absolute; top: 74.06%; transform: translateY(-50%);
            display: flex; align-items: center;
            gap: 0.765em; margin: 0; padding: 0; list-style: none;
            font-size: var(--csf-fs); line-height: 1; white-space: nowrap;
          }
          .csf-pages { left: 1.4286vw; }
          .csf-k { height: var(--csf-k); }
          /* KAI SSEMPA, the copyright mark, then the year, as in the frame
             (3793:1893): the ring 130 x 133 at 170, about 62 either side. */
          .csf-name { display: flex; align-items: center; gap: 0.37em; margin: 0; color: #f5f5f5; }
          .csf-copy { position: relative; display: block; width: 0.762em; height: 0.784em; flex: none; }
          /* The ring's stroke runs 7% past its box, as drawn. It is a mask in
             the text's colour, so it follows the name's ink. */
          .csf-copy i {
            position: absolute; left: -7.33%; top: -7.13%; width: 114.67%; height: 114.26%;
            background: currentColor;
            mask: url(/footer/copyright-ring.svg) center / 100% 100% no-repeat;
            -webkit-mask: url(/footer/copyright-ring.svg) center / 100% 100% no-repeat;
          }
          /* The C at 128 of 170, centred in the ring (Kaicords' caps sit a
             touch above the middle of the line, hence the nudge down). */
          .csf-copy span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.753em; transform: translateY(0.04em); }
          .csf-row { font-family: var(--font-display); font-weight: 400; text-transform: uppercase; }
          .csf-socials { right: 1.4286vw; }
          .csf-socials a { pointer-events: auto; }
          /* The seams, cut to DRIBBBLE's glyphs in the frame (565 x 82 at 170),
             so they start where the ink does: 8.5 in, and, in this line-height-1
             row, 0.211em down (Kaicords' cap top). */
          .csf-seams {
            position: absolute; pointer-events: none;
            left: 0.05em; top: 0.2112em; width: 3.3238em; height: 0.48em; max-width: none;
          }

          /* Arrivals (data-stage on the footer): the name and year, or Home,
             Work and About one by one, rise in as the first range lands, then
             the links one by one, left to right, as the black one does.
             Leaving, they go at once. */
          .csf-name, .csf-page, .csf-socials li {
            opacity: 0; transform: translateY(0.7em);
            transition: opacity 0.25s ease, transform 0.25s ease;
          }
          footer[data-stage="1"] .csf-name, footer[data-stage="2"] .csf-name,
          footer[data-stage="1"] .csf-page, footer[data-stage="2"] .csf-page,
          footer[data-stage="2"] .csf-socials li {
            opacity: 1; transform: none;
            transition: opacity 0.5s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
          }
          footer[data-stage="1"] .csf-page, footer[data-stage="2"] .csf-socials li { transition-delay: calc(var(--i) * 70ms); }
          /* Home, Work and About still dim on hover, at once. */
          footer[data-stage] .csf-page:hover { opacity: 0.75; transition-delay: 0s; }
          @media (prefers-reduced-motion: reduce) {
            .csf-name, .csf-page, .csf-socials li { opacity: 1; transform: none; transition: none; }
          }

          .csf-link { display: block; text-decoration: none; transition: opacity 0.2s ease; }
          .csf-link:hover { opacity: 0.75; }
          .csf-link:focus-visible { outline: 2px solid #fff; outline-offset: 6px; border-radius: 4px; }

          /* A phone (Figma: Mobile Footer, 3793:1903, 2362 wide, so 23.62 to
             the vw): the thumbnails one to a row, then the phone's own ranges,
             the study's standing 609 above the foot (676 tall) and the black
             one 433 (3162 wide from 174 off the left, 567 tall). The K and the
             page links on the first, centred 402 up, at 85; the six links in
             one row on the black, centred 149 up. */
          @media (max-width: 639px) {
            footer { --csf-h: 25.78vw; --csf-fs: 3.6vw; --csf-k: 4.572vw; }
            .csf-grid { grid-template-columns: 1fr; gap: 2.54vw; padding: 0 2.58vw; }
            .csf-room { height: calc(var(--csf-h) - 13.68vw); }
            .csf-room-full { height: var(--csf-h); }
            .csf-shape { mask-image: var(--csf-mask-phone); -webkit-mask-image: var(--csf-mask-phone); }
            .csf-range .csf-shape:not(.csf-black) { inset: auto; left: -0.272vw; width: 101.5vw; top: 0; height: 28.63vw; }
            .csf-black { left: -7.39vw; width: 133.89vw; top: 7.45vw; bottom: auto; height: 24vw; }
            .csf-row { top: auto; transform: translateY(50%); }
            .csf-pages { left: 3.175vw; bottom: 17.02vw; gap: 3.6vw; }
            /* Home, Work and About each start 335 after the last. */
            .csf-pages > a:not(.csf-k) { width: 14.18vw; }
            .csf-name { gap: 0.37em; }
            .csf-socials { left: 2.58vw; right: 2.86vw; bottom: 6.31vw; justify-content: space-between; gap: 0; }
            .csf-socials li:nth-child(2) { order: 3; }
            .csf-socials li:nth-child(3) { order: 2; }
            .csf-socials li:nth-child(n+4) { order: 4; }
          }
        `}</style>
      </footer>
      {/* The scroll the ranges rise over once the page has reached the
          bottom; nothing on the site's pages or with reduced motion, but
          always mounted, as useScroll needs its target in the page. */}
      <div ref={tail} aria-hidden="true" style={{ height: reduced || theme.site ? 0 : RISE }} />
    </div>
  );
}
