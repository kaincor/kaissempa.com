"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/" },
];

/** Measured off the Framer build. */
const BAR_WIDTH = 263;
const BAR_HEIGHT = 52;
const MENU_GAP = 12;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const hidden = useHideOnScroll(open);
  const ref = useRef<HTMLElement>(null);

  // Escape closes; a click outside closes. Neither exists in the Framer
  // version, but a menu you can only dismiss via its own button is a trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
      ref={ref}
      aria-label="Main"
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        width: BAR_WIDTH,
        zIndex: 10,
        transform: `translateX(-50%) translateY(${hidden ? "-120px" : "0"})`,
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "transform",
      }}
    >
      <div
        style={{
          height: BAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderRadius: 10,
          background: "rgba(0, 0, 0, 0.04)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
      >
        <Link href="/" aria-label="Kai Ssempa, home" style={{ display: "flex" }}>
          <Mark />
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
            padding: 6,
            margin: -6,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Line rotated={open} which="top" />
          <Line rotated={open} which="bottom" />
        </button>
      </div>

      <div
        id="main-menu"
        // Kept mounted so the links stay in the DOM for crawlers; hidden from
        // assistive tech and taken out of the tab order while collapsed.
        inert={!open}
        style={{
          marginTop: MENU_GAP,
          padding: 15,
          borderRadius: 13.5,
          background: "#232323",
          display: "flex",
          flexDirection: "column",
          gap: 7.5,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition:
            "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={() => setOpen(false)}
            className="display"
            style={{
              fontSize: 20,
              lineHeight: 1.1,
              color: "#fff",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ccc")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Line({ rotated, which }: { rotated: boolean; which: "top" | "bottom" }) {
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
        transform: rotated
          ? `translateY(${shift}px) rotate(${angle}deg)`
          : "none",
        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    />
  );
}

/** Placeholder wordmark. Swap for the real exported SVG. */
function Mark() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true">
      <path
        d="M2 1 L2 19 M2 10 L13 1 M2 10 L13 19"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Ported from the Framer HideOnScroll override: hides on scroll down, reveals
 * on scroll up, always visible within 10px of the top.
 *
 * Reads scroll inside a rAF rather than straight from the scroll handler, so a
 * fast flick coalesces into one state update per frame instead of dozens.
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

  // An open menu that slides away underneath the reader is just confusing.
  return forceVisible ? false : hidden;
}
