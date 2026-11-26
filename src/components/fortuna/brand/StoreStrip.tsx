"use client";

import { useRef, useState, type ReactNode } from "react";
import FortunaWordmark from "../FortunaWordmark";
import { Fit } from "../screens/kit";
import { ScreenById, type ScreenId } from "../screens/index";

/**
 * The App Store set, rebuilt: ten slides that sell both sides of the app in
 * turn. Each one says who it's for before anything else, in that side's
 * colour, and the switch above the strip picks one side out of the ten.
 *
 * The strip scrolls sideways like the store does, by touch, trackpad or the
 * arrows, and snaps to a slide.
 */

type Side = "seekers" | "employers" | "both";
type Slide = { side: Side; lines: [string, string]; screen: ScreenId; lead?: boolean };

const SLIDES: Slide[] = [
  { side: "seekers", lines: ["Swipe right to find", "your next job"], screen: "home", lead: true },
  { side: "employers", lines: ["Find and hire the", "best candidates"], screen: "applicants" },
  { side: "seekers", lines: ["Complete Your", "Profile"], screen: "bioProfile" },
  { side: "seekers", lines: ["Record Your", "Video Resume"], screen: "bioProfileVideo" },
  { side: "employers", lines: ["Meet Your", "Candidates"], screen: "candidates" },
  { side: "employers", lines: ["View Their", "Profile"], screen: "candidate" },
  { side: "both", lines: ["Get", "Matched"], screen: "connected" },
  { side: "employers", lines: ["Quickly", "Post Jobs"], screen: "post1" },
  { side: "seekers", lines: ["Track Your", "Applications"], screen: "myApplications" },
  { side: "employers", lines: ["In-App", "Scheduling"], screen: "scheduleFilled" },
];

const EYEBROW: Record<Side, ReactNode> = {
  seekers: <span style={{ color: "var(--f-orange)" }}>Job Seekers</span>,
  employers: <span style={{ color: "var(--f-green)" }}>Employers</span>,
  both: (
    <>
      <span style={{ color: "var(--f-orange)" }}>Job Seekers</span>
      <span style={{ color: "var(--f-forest)" }}> &amp; </span>
      <span style={{ color: "var(--f-green)" }}>Employers</span>
    </>
  ),
};
const EMPHASIS: Record<Side, string> = {
  seekers: "var(--f-orange)",
  employers: "var(--f-green)",
  both: "var(--f-forest)",
};

type Filter = "all" | "seekers" | "employers";

function StoreSlide({ slide, dim }: { slide: Slide; dim: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        flex: "none",
        width: "clamp(170px, 21vw, 224px)",
        aspectRatio: "1242 / 2688",
        borderRadius: 14,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 18% 30%, rgba(105,189,69,0.5) 0 1.5px, transparent 2.5px), radial-gradient(circle at 86% 22%, rgba(245,129,32,0.55) 0 1.5px, transparent 2.5px), radial-gradient(circle at 92% 44%, rgba(105,189,69,0.45) 0 1.2px, transparent 2.2px), #f7f5f0",
        boxShadow: "0 1px 2px rgba(40,40,30,0.06), 0 10px 26px rgba(40,40,30,0.10)",
        scrollSnapAlign: "start",
        containerType: "inline-size",
        opacity: dim ? 0.28 : 1,
        transform: dim ? "scale(0.96)" : "none",
        filter: dim ? "grayscale(0.6)" : "none",
        transition: "opacity 0.45s ease, transform 0.45s ease, filter 0.45s ease",
      }}
    >
      <div style={{ padding: "13cqw 8cqw 0", textAlign: slide.lead ? "left" : "center" }}>
        {slide.lead && (
          <div style={{ fontSize: "12cqw", lineHeight: 1, marginBottom: "6cqw" }}>
            <FortunaWordmark title="fortuna." />
          </div>
        )}
        <div style={{ fontFamily: "var(--f-display)", fontSize: "6.4cqw", fontWeight: 600, lineHeight: 1.2 }}>{EYEBROW[slide.side]}</div>
        <div style={{ fontFamily: "var(--f-display)", fontSize: slide.lead ? "8.6cqw" : "10.4cqw", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.02em", color: "var(--f-forest)", marginTop: "1.6cqw" }}>
          {slide.lines[0]}
          <br />
          <span style={{ color: EMPHASIS[slide.side], textDecoration: "underline", textDecorationColor: "var(--f-green)", textDecorationThickness: "0.9cqw", textUnderlineOffset: "1.6cqw" }}>{slide.lines[1]}</span>
        </div>
      </div>
      {/* The phone, in the slate the store set used, running off the bottom. */}
      <div
        style={{
          position: "absolute",
          left: "11%",
          right: "11%",
          top: slide.lead ? "46%" : "34%",
          padding: "3.4cqw",
          borderRadius: "11cqw",
          background: "#47535d",
          boxShadow: "0 12px 30px rgba(40,40,30,0.18)",
        }}
      >
        <Fit radius={34} shadow={false}>
          <ScreenById id={slide.screen} />
        </Fit>
      </div>
    </div>
  );
}

export default function StoreStrip() {
  const [filter, setFilter] = useState<Filter>("all");
  const strip = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) => {
    const el = strip.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 14 : 240;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };
  const chip = (value: Filter, label: string, color: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={filter === value}
      onClick={() => setFilter(value)}
      style={{
        padding: "9px 16px",
        border: "none",
        borderRadius: 999,
        background: filter === value ? color : "transparent",
        color: filter === value ? "#fff" : "var(--f-forest)",
        fontFamily: "var(--f-grotesk)",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {label}
    </button>
  );
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={dir === 1 ? "Next slides" : "Previous slides"}
      onClick={() => nudge(dir)}
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "1.5px solid rgba(50,68,62,0.25)",
        background: "transparent",
        color: "var(--f-forest)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }}>
        <path d="M5.5 2.5 11 8l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
  const dim = (s: Slide) => filter !== "all" && s.side !== "both" && s.side !== filter;
  const count = filter === "all" ? SLIDES.length : SLIDES.filter((s) => !dim(s)).length;

  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "clamp(14px, 2vw, 22px)" }}>
        <div role="tablist" aria-label="Show the slides for" style={{ display: "inline-flex", padding: 4, borderRadius: 999, background: "rgba(50,68,62,0.08)" }}>
          {chip("all", "All ten", "var(--f-forest)")}
          {chip("seekers", "Job Seekers", "var(--f-orange)")}
          {chip("employers", "Employers", "var(--f-green)")}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {arrow(-1)}
          {arrow(1)}
        </div>
      </div>
      <div
        ref={strip}
        className="f-strip"
        tabIndex={0}
        aria-label="App Store slides"
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          padding: "6px 2px 18px",
          scrollbarWidth: "none",
        }}
      >
        {SLIDES.map((s, i) => (
          <StoreSlide key={i} slide={s} dim={dim(s)} />
        ))}
      </div>
      <figcaption aria-live="polite" style={{ marginTop: 6, fontFamily: "var(--f-body)", fontSize: "clamp(12px, 1.25vw, 14px)", lineHeight: 1.5, color: "var(--f-ink)", textAlign: "center" }}>
        {filter === "all"
          ? "Ten slides, one story told to each side in turn, and once to both."
          : `${count} of the ten speak to ${filter === "seekers" ? "job seekers" : "employers"}, counting the one they share.`}
      </figcaption>
    </figure>
  );
}
