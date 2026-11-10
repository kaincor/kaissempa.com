"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { scrollToSection } from "@/lib/scrollToSection";

/**
 * Work and About point at their sections on the home page for now. The
 * /work and /about pages exist but are not linked until they are built out.
 */
const LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
];

/**
 * A link into the home page, from the home page, glides there rather than
 * reloading: a reload would throw away the live hero and make the reader wait
 * for it all over again, for a page they are already on. Home goes to the
 * top; the others to their section. Anywhere else it is an ordinary link,
 * and the router scrolls to the section once the home page is up.
 */
function glideIfHome(e: React.MouseEvent, href: string, pathname: string | null) {
  if (pathname !== "/" || !href.startsWith("/")) return;
  const hash = href.slice(1);
  if (hash && !hash.startsWith("#")) return;
  e.preventDefault();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = still ? "auto" : "smooth";
  if (hash) scrollToSection(hash.slice(1), behavior);
  else window.scrollTo({ top: 0, behavior });
  // Keep the address bar honest without adding a history entry per click.
  history.replaceState(null, "", href);
}

const NAV_WIDTH = 264;
const BAR_HEIGHT = 42;
const MENU_GAP = 12;

/** Hamburger bars. Open, both slide to the midpoint and overlap into one line. */
const LINE_WIDTH = 13;
const LINE_THICKNESS = 2;
const LINE_GAP = 6;
const LINE_SHIFT = (LINE_THICKNESS + LINE_GAP) / 2;

/** Measured off the current build. */
const BAR_TINT = "rgba(5, 5, 5, 0.15)";
const MENU_TINT =
  "linear-gradient(270deg, rgba(5, 5, 5, 0.16) 0%, rgba(5, 5, 5, 0.2) 100%)";

/**
 * Each case study carries its own brand, and the navbar travels with it.
 *
 * The glass composition is unchanged — same blur, same squircle, same
 * geometry. Only the tint and the face move, so the bar reads as the same
 * object wearing the page's colour rather than a different component. Keyed
 * by path prefix, which is the only thing the bar knows about where it is.
 */
const CASE_THEMES: {
  prefix: string;
  bar: string;
  menu: string;
  /** Overrides .glass for this theme. */
  blur: number;
  /**
   * The menu's face on this route, replacing the site's own display font.
   * Declared by the case study's stylesheet on :root, since the bar sits
   * outside the page's wrapper and cannot see a variable scoped to it.
   */
  font?: string;
  /**
   * Point size and weight to go with it.
   *
   * Kaicords is drawn small for its em — twenty is what it takes to read as
   * a menu — and any face set on a normal body pattern looks oversized at
   * the same number. Carried with the face so the three cannot be changed
   * apart.
   */
  size?: number;
  weight?: number;
  /** Set the menu in capitals. */
  caps?: boolean;
  /**
   * A route's own touch: hovering the bar, or the open menu, picks it like a
   * frame in a design tool, with a small square at each corner in this colour.
   */
  corners?: string;
}[] = [
  {
    prefix: "/fortuna",
    // Opacity was only half the problem. The blur radius was the other half:
    // at 26px a line of body copy is averaged into flat grey before the tint
    // is even applied, so no amount of transparency brings it back. A short
    // blur keeps the smear legible as text, and at that point the bar can
    // stay properly green and still read as glass.
    bar: "rgba(105, 189, 69, 0.42)",
    menu: "linear-gradient(270deg, rgba(105, 189, 69, 0.46) 0%, rgba(105, 189, 69, 0.52) 100%)",
    blur: 8,
    // Tiempos Headline, the case study's own display face, in place of
    // Kaicords. Defined in src/app/fortuna/theme.css.
    font: "var(--f-display-stack)",
    // Fourteen: sixteen still read large against the bar. Tiempos and Aktiv
    // measure near identically (cap height 0.702em against 0.714), so the
    // number is the apparent size.
    size: 14,
    // Semibold, the same weight the headings are set in.
    weight: 600,
  },
  {
    prefix: "/zorzal",
    // Fortuna's glass recipe in the Zorzal wordmark's wine, #983c44. Wine is
    // a dark colour, so at Fortuna's 0.42 it thins to dusty pink over the pale
    // sky; it needs more body than the green to read as the wordmark's red.
    bar: "rgba(152, 60, 68, 0.74)",
    menu: "linear-gradient(270deg, rgba(152, 60, 68, 0.76) 0%, rgba(152, 60, 68, 0.82) 100%)",
    blur: 8,
    // Captain Kai Bold, the chapter-title face, declared in
    // src/app/zorzal/theme.css. Thirteen: at Fortuna's fourteen the all-caps
    // face read large against the bar, and at twelve the bold thinned out.
    font: "var(--z-captain-stack)",
    size: 13,
    weight: 700,
  },
  {
    prefix: "/mint",
    // Zorzal's recipe in the MINT wordmark's red, #b7272b, over the page's
    // studio grey. Keeps the site's own menu face.
    bar: "rgba(183, 39, 43, 0.74)",
    menu: "linear-gradient(270deg, rgba(183, 39, 43, 0.76) 0%, rgba(183, 39, 43, 0.82) 100%)",
    blur: 8,
    // Fahkwang Bold in capitals, the page's caption face, declared on :root
    // by src/app/mint/page.tsx. Fifteen: wide capitals read large at twenty.
    font: "var(--mint-fahkwang)",
    size: 15,
    weight: 700,
    caps: true,
    // The red squares the page uses round its photos, wordmark and magazine.
    corners: "#b7272b",
  },
];

/** How long the colour takes to run across the bar, and its head start. */
const WIPE_MS = 0.95;
const WIPE_DELAY = 0.35;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function Navbar({ logo }: { logo?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const hidden = useHideOnScroll(open);

  const pathname = usePathname();
  const theme = CASE_THEMES.find((t) => pathname?.startsWith(t.prefix));

  // Arriving on the home page with a section in the address (Work or About
  // from another page): the router's own jump measures the section before
  // the parallax has settled, so it is corrected here, without a glide.
  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    const t = setTimeout(() => scrollToSection(id, "auto"), 60);
    return () => clearTimeout(t);
  }, [pathname]);
  // The bar keeps its own grey underneath; the theme rides over it as a wipe.
  // The menu is never on screen while that runs, so it just takes the colour.
  const menuTint = theme?.menu ?? MENU_TINT;
  // Inline, so it beats the .glass rule for themed routes only — the home
  // page sits over the 3D scene, where the long blur is the right call.
  const glass = theme ? { backdropFilter: `blur(${theme.blur}px) saturate(170%)`, WebkitBackdropFilter: `blur(${theme.blur}px) saturate(170%)` } : undefined;

  // Hover opens on pointer devices; touch gets tap-to-toggle, since a hover
  // that cannot be undone by moving away is a trap on a phone.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // pointerleave never arrives when the cursor crosses into a cross-origin
  // iframe — the Spline hero swallows it, and the menu would hang open. The
  // browser still keeps :hover accurate, so poll that as the source of truth.
  useEffect(() => {
    if (!open || !canHover) return;
    const id = setInterval(() => {
      const el = navRef.current;
      if (el && !el.matches(":hover")) setOpen(false);
    }, 150);
    return () => clearInterval(id);
  }, [open, canHover]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      // pointerenter/leave follow the DOM tree, not the painted box. The bridge
      // and menu are absolutely positioned children, so crossing the gap between
      // bar and menu never leaves the nav and never fires a close.
      onPointerEnter={(e) => {
        if (canHover && e.pointerType !== "touch") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (canHover && e.pointerType !== "touch") setOpen(false);
      }}
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        width: NAV_WIDTH,
        zIndex: 10,
        transform: `translateX(-50%) translateY(${hidden ? "-120px" : "0"})`,
        transition: `transform 0.35s ${EASE}`,
        willChange: "transform",
      }}
    >
      <div
        className="glass nav-bar"
        style={{
          position: "relative",
          // The wipe is a child laid over the whole bar, so it has to be
          // trimmed to the bar's own corners on the way past them.
          overflow: "hidden",
          height: BAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: logo ? "space-between" : "flex-end",
          padding: "0 16px",
          borderRadius: 10,
          background: BAR_TINT,
          ...glass,
        }}
      >
        {/* The case study's colour, run across the bar rather than swapped in.
            Keyed on the theme so moving between case studies replays it, and
            unmounting on the way home puts the bar back to its own grey.

            It is a layer over the tint rather than a change to it because a
            background cannot be wiped — clip-path can, and clipping an opaque
            layer is one compositor property, so the whole thing stays off the
            main thread. */}
        {theme ? (
          <motion.span
            key={theme.prefix}
            aria-hidden="true"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{
              duration: WIPE_MS,
              ease: [0.22, 1, 0.36, 1],
              delay: WIPE_DELAY,
            }}
            style={{
              position: "absolute",
              inset: 0,
              background: theme.bar,
              pointerEvents: "none",
            }}
          />
        ) : null}

        {logo ? (
          <Link
            href="/"
            onClick={(e) => glideIfHome(e, "/", pathname)}
            aria-label="Kai Ssempa, home"
            style={{ display: "flex", position: "relative", zIndex: 1 }}
          >
            {logo}
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          style={{
            // Above the wipe: the colour runs behind the hamburger, which
            // stays white the whole way through.
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: LINE_GAP,
            padding: 8,
            margin: -8,
            color: "#fff",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Line open={open} which="top" />
          <Line open={open} which="bottom" />
        </button>
      </div>

      {theme?.corners ? (
        <div className="nav-corners nav-bar-corners" aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR_HEIGHT }}>
          <CornerSquares color={theme.corners} />
        </div>
      ) : null}

      {/* Fills the gap so the pointer never lands on bare page between the two
          panels. pointer-events: none while closed, so a collapsed menu does
          not leave an invisible hover target sitting over the hero. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: BAR_HEIGHT,
          left: 0,
          right: 0,
          height: MENU_GAP,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      <div
        id="main-menu"
        className="glass"
        inert={!open}
        style={{
          position: "absolute",
          top: BAR_HEIGHT + MENU_GAP,
          left: 0,
          width: "100%",
          padding: 15,
          borderRadius: 13.5,
          background: menuTint,
          ...glass,
          display: "flex",
          flexDirection: "column",
          gap: 7.5,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition: `opacity 0.25s ${EASE}, transform 0.25s ${EASE}`,
        }}
      >
        {theme?.corners ? (
          <div className="nav-corners" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
            <CornerSquares color={theme.corners} />
          </div>
        ) : null}
        {LINKS.map((l) => (
          <MenuLink
            key={l.label}
            href={l.href}
            font={theme?.font}
            size={theme?.size}
            weight={theme?.weight}
            caps={theme?.caps}
            onNavigate={(e) => {
              glideIfHome(e, l.href, pathname);
              setOpen(false);
            }}
          >
            {l.label}
          </MenuLink>
        ))}
      </div>
    </nav>
  );
}

/**
 * A small square just outside each corner of its parent. Hidden until the
 * bar or the menu under it is hovered (styles in globals.css, .nav-corners).
 */
function CornerSquares({ color }: { color: string }) {
  return (
    <>
      {[
        { left: -9, top: -9 },
        { right: -9, top: -9 },
        { left: -9, bottom: -9 },
        { right: -9, bottom: -9 },
      ].map((pos, i) => (
        <span key={i} style={{ position: "absolute", width: 5, height: 5, background: color, ...pos }} />
      ))}
    </>
  );
}

/** Height of one menu row, px: the home menu's 20px type at line-height 1.1. */
const ROW_HEIGHT = 22;

function MenuLink({
  href,
  children,
  font,
  size,
  weight,
  caps,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  /** The route theme's face, if it has one. Falls back to .display. */
  font?: string;
  size?: number;
  weight?: number;
  caps?: boolean;
  onNavigate: (e: React.MouseEvent) => void;
}) {
  const [hot, setHot] = useState(false);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      className="display"
      style={{
        // Inline, so it wins over .display on themed routes and leaves it
        // alone everywhere else. The menu is never open while the route
        // changes, so there is nothing to animate between the two faces.
        fontFamily: font,
        fontWeight: weight,
        // .display uppercases because Kaicords' capitals are its heavy style
        // and its lowercase is the light one. No other face has that quirk,
        // and a case study set in mixed case should not have a shouting menu.
        textTransform: caps ? "uppercase" : font ? "none" : undefined,
        fontSize: size ?? 20,
        // A fixed row, the home menu's 20px at 1.1, so a theme's smaller type
        // keeps the same menu height instead of shrinking the panel with it.
        lineHeight: `${ROW_HEIGHT}px`,
        color: hot ? "#ccc" : "#fff",
        textDecoration: "none",
        transition: "color 0.2s ease",
      }}
    >
      {children}
    </Link>
  );
}

function Line({ open, which }: { open: boolean; which: "top" | "bottom" }) {
  const shift = which === "top" ? LINE_SHIFT : -LINE_SHIFT;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: LINE_WIDTH,
        height: LINE_THICKNESS,
        borderRadius: LINE_THICKNESS,
        background: "currentColor",
        // No rotation: the two bars meet in the middle and read as a minus.
        transform: open ? `translateY(${shift}px)` : "none",
        transition: `transform 0.25s ${EASE}`,
      }}
    />
  );
}

/**
 * Hides on scroll down, reveals on scroll up, always visible within 10px of the
 * top. Reads scroll inside a rAF so a fast flick is one state update per frame.
 *
 * While `pinned` (the menu is open) scrolling never hides the bar, and when the
 * menu closes the bar stays put until the reader scrolls *again* — otherwise it
 * snaps away the instant the cursor leaves, which is not how the original
 * behaves.
 */
function useHideOnScroll(pinned: boolean) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const ticking = useRef(false);
  const pinnedRef = useRef(pinned);

  useEffect(() => {
    const was = pinnedRef.current;
    pinnedRef.current = pinned;
    if (was && !pinned) {
      setHidden(false);
      last.current = window.scrollY;
    }
  }, [pinned]);

  useEffect(() => {
    last.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      if (pinnedRef.current) {
        // Track position but never hide while the menu is open.
      } else if (y <= 10) {
        setHidden(false);
      } else {
        setHidden(y > last.current);
      }
      last.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return pinned ? false : hidden;
}
