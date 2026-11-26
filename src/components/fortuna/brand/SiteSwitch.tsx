"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import FortunaWordmark from "../FortunaWordmark";
import { JOBS as REEL_JOBS } from "../reel/cards";
import { Avatar, Fit, FitBadge, type FitLevel } from "../screens/kit";
import { ScreenById } from "../screens/index";

/**
 * The marketing site, one page per side, with the switch the real header had
 * between them. Pressing it here does what it did there: the page changes
 * audience, and the address changes with it.
 *
 * Drawn at a fixed desktop width and scaled to whatever room it gets, so a
 * phone sees the same page in miniature instead of a reflowed one.
 */

const SITE_W = 1200;
const SITE_H = 780;

type Side = "seekers" | "employers";

function Underlined({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ color, textDecoration: "underline", textDecorationColor: "var(--f-green)", textDecorationThickness: 5, textUnderlineOffset: 10 }}>{children}</span>
  );
}

function Cta({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-block", padding: "14px 26px", borderRadius: 999, background: "var(--f-green)", color: "#fff", fontFamily: "var(--f-grotesk)", fontWeight: 600, fontSize: 16 }}>{children}</span>
  );
}

/** The four cards from the site's hero, as the reel draws them too. */
const JOBS = REEL_JOBS.filter((j) => ["Printer", "Waiter", "Forklift Driver", "Barista"].includes(j.title)).slice(0, 4);

function MiniJob({ job, style }: { job: (typeof REEL_JOBS)[number]; style: React.CSSProperties }) {
  return (
    <div style={{ position: "absolute", width: 170, borderRadius: 14, background: "#fffdf9", boxShadow: "0 10px 28px rgba(40,40,30,0.10)", overflow: "hidden", ...style }}>
      <div style={{ position: "relative", height: 108 }}>
        <Image src={job.photo} alt="" fill sizes="200px" style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "11px 14px 13px", fontFamily: "var(--f-grotesk)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{job.title}</div>
        <div style={{ fontSize: 11.5, color: "#616161", marginTop: 2 }}>{job.place}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8, fontSize: 11.5, color: "#616161" }}>
          <span>{job.hours}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>{job.pay}</span>
        </div>
      </div>
    </div>
  );
}

function Seekers() {
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div style={{ textAlign: "center", paddingTop: 64 }}>
        <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 54, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--f-forest)" }}>
          Swipe right to find
          <br />
          your next job in <Underlined color="var(--f-orange)">Miami</Underlined>
        </div>
        <p style={{ margin: "26px auto 28px", maxWidth: 470, fontFamily: "var(--f-body)", fontSize: 17, lineHeight: 1.5, color: "#616161" }}>
          Fortuna is the fastest and most stress free way for you to discover job opportunities in your community.
        </p>
        <Cta>Download the App</Cta>
      </div>
      <MiniJob job={JOBS[0]} style={{ left: 70, top: 470, transform: "rotate(-4deg)" }} />
      <MiniJob job={JOBS[1]} style={{ left: 270, top: 440, transform: "rotate(2deg)" }} />
      <MiniJob job={JOBS[2]} style={{ right: 270, top: 440, transform: "rotate(-2deg)" }} />
      <MiniJob job={JOBS[3]} style={{ right: 70, top: 470, transform: "rotate(4deg)" }} />
      <div style={{ position: "absolute", left: "50%", top: 400, width: 230, marginLeft: -115, padding: 9, borderRadius: 40, background: "var(--f-forest)", boxShadow: "0 24px 50px rgba(40,40,30,0.2)" }}>
        <Fit radius={34} shadow={false}>
          <ScreenById id="home" />
        </Fit>
      </div>
    </div>
  );
}

const APPLICANTS: { name: string; job: string; fit: FitLevel; tone: string }[] = [
  { name: "Sarah Anderson", job: "Applying for Cashier", fit: "best", tone: "#6f8b81" },
  { name: "Marcus Bell", job: "Applying for Cashier", fit: "good", tone: "#c98b5a" },
  { name: "Elena Ruiz", job: "Applying for Cashier", fit: "good", tone: "#8a7fb0" },
];

function Employers() {
  return (
    <div style={{ position: "relative", height: "100%", display: "grid", gridTemplateColumns: "1.15fr 1fr", alignItems: "center", padding: "0 72px 40px" }}>
      <div>
        <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 52, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--f-forest)" }}>
          The <Underlined color="var(--f-orange)">fastest</Underlined> way to hire
          <br />
          the right people in
          <br />
          your community
        </div>
        <p style={{ margin: "26px 0 30px", maxWidth: 470, fontFamily: "var(--f-body)", fontSize: 17, lineHeight: 1.5, color: "#616161" }}>
          Create job posts on the run and let Fortuna put the fastest candidates on top of your pile, so you can find the right person for a job, even during the most hectic weeks.
        </p>
        <Cta>Download the App</Cta>
      </div>
      <div style={{ position: "relative", height: 460 }}>
        <div aria-hidden style={{ position: "absolute", inset: -40, borderRadius: "50%", border: "1.5px dashed rgba(50,68,62,0.14)" }} />
        {APPLICANTS.map((a, i) => (
          <div
            key={a.name}
            style={{
              position: "absolute",
              left: [10, 150, 40][i],
              top: [30, 170, 310][i],
              width: 290,
              padding: "18px 20px",
              borderRadius: 14,
              background: "#fffdf9",
              boxShadow: "0 12px 30px rgba(40,40,30,0.10)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              fontFamily: "var(--f-grotesk)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>{a.name}</div>
              <div style={{ fontSize: 13, color: "#616161", margin: "4px 0 12px" }}>{a.job}</div>
              <FitBadge fit={a.fit} />
            </div>
            <Avatar name={a.name} size={46} tone={a.tone} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SiteSwitch() {
  const reduced = useReducedMotion();
  const [side, setSide] = useState<Side>("seekers");
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setK(el.clientWidth / SITE_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const small = k > 0 && k < 0.6;
  const pill = (value: Side, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={side === value}
      onClick={(e) => {
        e.stopPropagation();
        setSide(value);
      }}
      style={{
        padding: "9px 18px",
        borderRadius: 999,
        border: side === value ? "1.5px solid var(--f-forest)" : "1.5px solid transparent",
        background: side === value ? "#fff" : "transparent",
        color: "var(--f-forest)",
        fontFamily: "var(--f-grotesk)",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
        transition: "border-color 0.3s ease, background 0.3s ease",
      }}
    >
      {label}
    </button>
  );

  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div style={{ borderRadius: "clamp(10px, 1.4vw, 16px)", overflow: "hidden", background: "#e9e6df", boxShadow: "0 1px 2px rgba(40,40,30,0.08), 0 24px 56px rgba(40,40,30,0.14)" }}>
        {/* Browser chrome. */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1.4vw, 16px)", padding: "clamp(8px, 1.1vw, 12px) clamp(10px, 1.6vw, 18px)" }}>
          <div style={{ display: "flex", gap: 6 }} aria-hidden>
            {["#e0796b", "#e8be5a", "#8cc36a"].map((c) => (
              <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, maxWidth: 420, margin: "0 auto", padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.7)", fontFamily: "var(--f-grotesk)", fontSize: "clamp(10px, 1.1vw, 13px)", color: "#616161", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            fortuna.app/<span style={{ color: "var(--f-forest)", fontWeight: 600 }}>{side === "seekers" ? "job-seekers" : "employers"}</span>
          </div>
          <div style={{ width: 42 }} aria-hidden />
        </div>
        <div
          ref={box}
          // In miniature the header's switch is too small to hit, so the whole
          // page becomes the switch instead.
          onClick={small ? () => setSide((v) => (v === "seekers" ? "employers" : "seekers")) : undefined}
          style={{ position: "relative", width: "100%", aspectRatio: `${SITE_W} / ${SITE_H}`, overflow: "hidden", background: "#f7f5f0", cursor: small ? "pointer" : undefined }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: SITE_W, height: SITE_H, transform: `scale(${k})`, transformOrigin: "0 0", visibility: k ? "visible" : "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 48px" }}>
              <div style={{ fontSize: 30, lineHeight: 1, width: 180 }}>
                <FortunaWordmark color="var(--f-forest)" title="fortuna." />
              </div>
              <div role="tablist" aria-label="Which side of the site" style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "rgba(50,68,62,0.06)" }}>
                {pill("seekers", "Job Seekers")}
                {pill("employers", "Employers")}
              </div>
              <div style={{ width: 180, display: "flex", justifyContent: "flex-end" }}>
                <span style={{ padding: "10px 20px", borderRadius: 999, background: "var(--f-forest)", color: "#fff", fontFamily: "var(--f-grotesk)", fontWeight: 600, fontSize: 14 }}>Download</span>
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 100, bottom: 0 }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={side}
                  style={{ position: "absolute", inset: 0 }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {side === "seekers" ? <Seekers /> : <Employers />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <figcaption aria-live="polite" style={{ marginTop: 14, fontFamily: "var(--f-body)", fontSize: "clamp(12px, 1.25vw, 14px)", lineHeight: 1.5, color: "var(--f-ink)", textAlign: "center" }}>
        {side === "seekers"
          ? `The job seekers' page: a job in Miami, a swipe away. ${small ? "Tap the page" : "Press Employers in the header"} to switch sides.`
          : `The employers' page: the fastest way to hire, and a shortlist already waiting. ${small ? "Tap the page" : "Press Job Seekers"} to switch back.`}
      </figcaption>
    </figure>
  );
}
