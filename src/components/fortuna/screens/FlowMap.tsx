"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { H, W } from "./kit";
import { ScreenById, type ScreenId } from "./index";

export type FlowStep = { title: string; text: string; focus: ScreenId[] };

/**
 * The employer's side of the app as one board, zoomed out: every screen from
 * an empty job board to a connection, wired together the way the Figma file
 * lays them out. The arrows walk through it a beat at a time — the board
 * glides in on that beat's screens, the rest fall back, and the caption
 * underneath says what's going on. Any screen can be tapped to jump to it,
 * and the arrow keys work once the board has focus.
 *
 * Laid out in the screens' own units (375 x 812), two rows of seven, and
 * scaled as one piece, so the screens stay text and the camera is a single
 * transform.
 */

const GAP = 150;
const PAD = { x: 120, top: 210, bottom: 140 };
const ROW_GAP = 320;
const ROWS: ScreenId[][] = [
  ["ghostEmail", "jobsEmpty", "post1", "post2", "posted", "picking", "applicants"],
  ["candidate", "video", "schedule", "scheduleFilled", "connected", "candidates", "connectedEmail"],
];
const BOARD = {
  w: PAD.x * 2 + 7 * W + 6 * GAP,
  h: PAD.top + 2 * H + ROW_GAP + PAD.bottom,
};
const POS = (() => {
  const p = {} as Record<ScreenId, { x: number; y: number }>;
  ROWS.forEach((row, r) => row.forEach((id, c) => (p[id] = { x: PAD.x + c * (W + GAP), y: PAD.top + r * (H + ROW_GAP) })));
  return p;
})();

/** The board's sections, as Figma labels them: a name over a run of screens. */
const PHASES: { label: string; from: ScreenId; to: ScreenId; dashed?: boolean }[] = [
  { label: "Another way in", from: "ghostEmail", to: "ghostEmail", dashed: true },
  { label: "1  Post a job", from: "jobsEmpty", to: "post2" },
  { label: "2  Fortuna picks", from: "posted", to: "applicants" },
  { label: "3  A closer look", from: "candidate", to: "video" },
  { label: "4  Contact", from: "schedule", to: "connected" },
  { label: "5  Connected", from: "candidates", to: "connectedEmail" },
];

const LINE = "rgba(173, 228, 149, 0.75)";
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

function Connectors() {
  const mid = H / 2;
  const segs: string[] = [];
  for (const row of ROWS)
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === "ghostEmail") continue;
      const a = POS[row[i]];
      const b = POS[row[i + 1]];
      segs.push(`M${a.x + W + 22} ${a.y + mid}H${b.x - 30}`);
    }
  // The end of the first row wraps round to the start of the second.
  const end = POS.applicants;
  const start = POS.candidate;
  const yTurn = end.y + H + ROW_GAP * 0.42;
  const r = 60;
  const wrap = `M${end.x + W / 2} ${end.y + H + 24}V${yTurn - r}q0 ${r} ${-r} ${r}H${start.x + W / 2 + r}q${-r} 0 ${-r} ${r}V${start.y - 34}`;
  // The ghost employer's email joins at the job post.
  const g = POS.ghostEmail;
  const p1 = POS.post1;
  const yG = g.y + H + ROW_GAP * 0.2;
  const ghost = `M${g.x + W / 2} ${g.y + H + 24}V${yG - r}q0 ${r} ${r} ${r}H${p1.x + W / 2 - r}q${r} 0 ${r} ${-r}V${p1.y + H + 30}`;
  const head = (x: number, y: number, dir: "r" | "d" | "u") => {
    const s = 22;
    const d = { r: `M${x - s} ${y - s}L${x} ${y}L${x - s} ${y + s}`, d: `M${x - s} ${y - s}L${x} ${y}L${x + s} ${y - s}`, u: `M${x - s} ${y + s}L${x} ${y}L${x + s} ${y + s}` }[dir];
    return <path d={d} fill="none" stroke={LINE} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />;
  };
  return (
    <svg width={BOARD.w} height={BOARD.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden="true">
      {segs.map((d) => (
        <g key={d}>
          <path d={d} stroke={LINE} strokeWidth="7" strokeLinecap="round" fill="none" />
          {head(Number(d.split("H")[1]), Number(d.split(" ")[1].split("H")[0]), "r")}
        </g>
      ))}
      <path d={wrap} stroke={LINE} strokeWidth="7" strokeLinecap="round" fill="none" />
      {head(start.x + W / 2, start.y - 34, "d")}
      <path d={ghost} stroke={LINE} strokeWidth="7" strokeLinecap="round" fill="none" strokeDasharray="4 22" />
      {head(p1.x + W / 2, p1.y + H + 30, "u")}
    </svg>
  );
}

function Phases() {
  return (
    <>
      {PHASES.map((p) => {
        const a = POS[p.from];
        const b = POS[p.to];
        return (
          <div
            key={p.label}
            style={{
              position: "absolute",
              left: a.x,
              top: a.y - 120,
              width: b.x + W - a.x,
              borderTop: `4px ${p.dashed ? "dashed" : "solid"} rgba(247,245,240,0.28)`,
              paddingTop: 22,
              fontFamily: "var(--f-grotesk)",
              fontWeight: 600,
              fontSize: 44,
              letterSpacing: "-0.01em",
              color: "rgba(247,245,240,0.9)",
              whiteSpace: "pre",
            }}
          >
            {p.label}
          </div>
        );
      })}
    </>
  );
}

export default function FlowMap({ steps }: { steps: FlowStep[] }) {
  const reduced = useReducedMotion();
  const view = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [step, setStep] = useState(0);
  const last = steps.length - 1;

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const focus = useMemo(() => steps[step]?.focus ?? [], [steps, step]);
  const camera = useMemo(() => {
    if (!size.w) return { x: 0, y: 0, s: 0 };
    let box = { x: 0, y: 0, w: BOARD.w, h: BOARD.h };
    if (focus.length) {
      const xs = focus.map((id) => POS[id].x);
      const ys = focus.map((id) => POS[id].y);
      const pad = 90;
      box = { x: Math.min(...xs) - pad, y: Math.min(...ys) - 150, w: Math.max(...xs) + W - Math.min(...xs) + pad * 2, h: Math.max(...ys) + H - Math.min(...ys) + 150 + pad };
    }
    const s = Math.min(size.w / box.w, size.h / box.h, 1);
    return { s, x: (size.w - box.w * s) / 2 - box.x * s, y: (size.h - box.h * s) / 2 - box.y * s };
  }, [focus, size]);

  const go = useCallback((n: number) => setStep(Math.max(0, Math.min(last, n))), [last]);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(step === last ? 0 : step + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(step - 1);
    }
  };
  const jumpTo = (id: ScreenId) => {
    const i = steps.findIndex((s, k) => k > 0 && s.focus.includes(id));
    if (i > 0) go(i);
  };

  const s = steps[step];
  const ink = "var(--f-forest)";
  return (
    <motion.figure
      className="f-wide"
      style={{ marginTop: "clamp(32px, 6vw, 64px)", marginBottom: "clamp(32px, 6vw, 64px)" }}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={view}
        tabIndex={0}
        onKeyDown={onKey}
        role="region"
        aria-roledescription="flow map"
        aria-label="The employer flow, as a board of screens. Use the arrow keys or the buttons below to step through it."
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 10",
          minHeight: 420,
          borderRadius: "clamp(18px, 2.4vw, 30px)",
          overflow: "hidden",
          background: "#2a3a35",
          backgroundImage: "radial-gradient(rgba(247,245,240,0.12) 1.2px, transparent 1.4px)",
          backgroundSize: "18px 18px",
          outlineOffset: 4,
          cursor: "default",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: BOARD.w,
            height: BOARD.h,
            transformOrigin: "0 0",
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.s})`,
            transition: reduced ? undefined : `transform 0.9s ${EASE}`,
            visibility: camera.s ? "visible" : "hidden",
          }}
        >
          <Connectors />
          <Phases />
          {(Object.keys(POS) as ScreenId[]).map((id) => {
            const on = !focus.length || focus.includes(id);
            return (
              <button
                key={id}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => jumpTo(id)}
                style={{
                  position: "absolute",
                  left: POS[id].x,
                  top: POS[id].y,
                  width: W,
                  height: H,
                  padding: 0,
                  border: "none",
                  borderRadius: 40,
                  overflow: "hidden",
                  background: "none",
                  cursor: "pointer",
                  boxShadow: on && focus.length ? "0 0 0 8px rgba(173,228,149,0.55), 0 40px 80px rgba(0,0,0,0.35)" : "0 30px 60px rgba(0,0,0,0.3)",
                  opacity: on ? 1 : 0.3,
                  transition: `opacity 0.6s ${EASE}, box-shadow 0.6s ${EASE}`,
                  textAlign: "left",
                }}
              >
                <ScreenById id={id} />
              </button>
            );
          })}
        </div>
        {step === 0 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              bottom: 18,
              transform: "translateX(-50%)",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(247,245,240,0.12)",
              color: "var(--f-cream)",
              fontFamily: "var(--f-grotesk)",
              fontSize: 13,
              whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
            }}
          >
            Tap → to walk through it, or tap any screen
          </div>
        )}
      </div>

      {/* The caption and the controls. */}
      <div style={{ display: "flex", gap: "clamp(16px, 3vw, 40px)", alignItems: "flex-start", marginTop: "clamp(16px, 2.4vw, 26px)", flexWrap: "wrap" }}>
        <div aria-live="polite" style={{ flex: "1 1 320px", minHeight: 110 }}>
          <div style={{ fontFamily: "var(--f-grotesk)", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--f-orange)" }}>
            {step === 0 ? "The whole flow" : `Step ${String(step).padStart(2, "0")} of ${String(last).padStart(2, "0")}`}
          </div>
          <div style={{ margin: "6px 0 6px", fontFamily: "var(--f-serif)", fontWeight: 600, fontSize: "clamp(19px, 2.2vw, 23px)", lineHeight: 1.2, color: ink }}>{s.title}</div>
          <p style={{ margin: 0, maxWidth: 620, fontFamily: "var(--f-body)", fontSize: "clamp(14px, 1.4vw, 16px)", lineHeight: 1.55, letterSpacing: "-0.015em", color: "var(--f-ink)" }}>{s.text}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, marginLeft: "auto" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <MapButton label="Previous step" disabled={step === 0} onClick={() => go(step - 1)} dir="left" />
            <MapButton label={step === last ? "Back to the whole flow" : "Next step"} onClick={() => go(step === last ? 0 : step + 1)} dir={step === last ? "reset" : "right"} />
          </div>
          <div style={{ display: "flex", gap: 6 }} role="tablist" aria-label="Steps">
            {steps.map((st, i) => (
              <button
                key={st.title}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={i === 0 ? "The whole flow" : `Step ${i}: ${st.title}`}
                onClick={() => go(i)}
                style={{ width: i === step ? 22 : 8, height: 8, padding: 0, border: "none", borderRadius: 4, background: i === step ? "var(--f-forest)" : "rgba(50,68,62,0.25)", cursor: "pointer", transition: "width 0.3s ease, background 0.3s ease" }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.figure>
  );
}

function MapButton({ label, onClick, disabled, dir }: { label: string; onClick: () => void; disabled?: boolean; dir: "left" | "right" | "reset" }) {
  const d = { left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", reset: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" }[dir];
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="f-map-button"
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        border: "none",
        background: disabled ? "rgba(50,68,62,0.12)" : "var(--f-forest)",
        color: disabled ? "rgba(50,68,62,0.35)" : "var(--f-cream)",
        display: "grid",
        placeItems: "center",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={dir === "reset" ? 1.8 : 2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </button>
  );
}
