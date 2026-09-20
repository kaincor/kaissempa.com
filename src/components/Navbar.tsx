"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LINKS = [
  { label: "Work", href: "/" },
  { label: "About", href: "/about" },
];

const NAV_WIDTH = 220;
const BAR_HEIGHT = 52;
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
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function Navbar({ logo }: { logo?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const hidden = useHideOnScroll(open);

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
        className="glass"
        style={{
          position: "relative",
          height: BAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: logo ? "space-between" : "flex-end",
          padding: "0 16px",
          borderRadius: 10,
          background: BAR_TINT,
        }}
      >
        {logo ? (
          <Link href="/" aria-label="Kai Ssempa, home" style={{ display: "flex" }}>
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
          background: MENU_TINT,
          display: "flex",
          flexDirection: "column",
          gap: 7.5,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition: `opacity 0.25s ${EASE}, transform 0.25s ${EASE}`,
        }}
      >
        {LINKS.map((l) => (
          <MenuLink key={l.label} href={l.href} onNavigate={() => setOpen(false)}>
            {l.label}
          </MenuLink>
        ))}
      </div>
    </nav>
  );
}

function MenuLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  onNavigate: () => void;
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
        fontSize: 20,
        lineHeight: 1.1,
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
