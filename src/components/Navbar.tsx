"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LINKS = [
  { label: "Work", href: "/" },
  { label: "About", href: "/about" },
];

/**
 * Geometry. The current build is 263px wide because its logo forced a minimum
 * width; nothing here does, so the bar can be narrower.
 */
const NAV_WIDTH = 220;
const BAR_HEIGHT = 52;
const MENU_GAP = 12;

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
          justifyContent: "space-between",
          padding: "0 16px",
          borderRadius: 10,
          background: BAR_TINT,
        }}
      >
        <Link href="/" aria-label="Kai Ssempa, home" style={{ display: "flex" }}>
          {logo ?? <Mark />}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
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
          panels. Inert-by-default via pointer-events, so a closed menu does not
          leave an invisible hover target sitting over the hero. */}
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
  const shift = which === "top" ? 3.5 : -3.5;
  const angle = which === "top" ? 45 : -45;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: 13,
        height: 1,
        background: "currentColor",
        transform: open ? `translateY(${shift}px) rotate(${angle}deg)` : "none",
        transition: `transform 0.25s ${EASE}`,
      }}
    />
  );
}

/** Placeholder. Pass a `logo` prop to replace it without touching this file. */
function Mark() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true">
      <path
        d="M2 1 L2 19 M2 10 L13 1 M2 10 L13 19"
        stroke="#fff"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Ported from the Framer HideOnScroll override: hides on scroll down, reveals
 * on scroll up, always visible within 10px of the top. Reads scroll inside a
 * rAF so a fast flick is one state update per frame, not one per event.
 */
function useHideOnScroll(forceVisible: boolean) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    last.current = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      if (y <= 10) setHidden(false);
      else setHidden(y > last.current);
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

  return forceVisible ? false : hidden;
}
