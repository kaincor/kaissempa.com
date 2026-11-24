"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import FortunaWordmark from "../FortunaWordmark";
import { FOREST, GREEN, ORANGE } from "../reel/cards";

/**
 * The app's screens, as markup, for the case study's mockups.
 *
 * Every screen is drawn at the app's own 375 x 812 and placed in its units,
 * transcribed from the New Colors page of the Fortuna file: the cream, the
 * dark green buttons, the field boxes, the fit badges. Built rather than
 * exported so the type stays sharp at any size, and so no stock photo or
 * sample person from the file comes along with it. Names and places are the
 * case study's own stand-ins: Sarah, Jonathan, his grocery in Miami.
 */

export const W = 375;
export const H = 812;

export const C = {
  cream: "#f7f5f0",
  creamDeep: "#f2f0eb",
  card: "#fffdf9",
  line: "#ddd8cc",
  ink: "#111",
  grey: "#616161",
  soft: "#8a8a8a",
  green: GREEN,
  greenDark: "#298800",
  greenLight: "#ade495",
  greenTint: "#dfeadb",
  forest: FOREST,
  sage: "#6f8b81",
  orange: ORANGE,
  orangeTint: "#fde3cc",
  red: "#f34545",
};

export const abs = (s: CSSProperties): CSSProperties => ({ position: "absolute", ...s });
export const t = (size: number, weight = 400, color: string = C.ink): CSSProperties => ({
  fontFamily: "var(--f-body)",
  fontSize: size,
  fontWeight: weight,
  color,
  letterSpacing: "-0.01em",
  lineHeight: 1.3,
});

/** A screen at the app's size. Its children are placed in the app's units. */
export function Screen({ children, bg = C.cream, wire = false }: { children?: ReactNode; bg?: string; wire?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        overflow: "hidden",
        background: wire ? "#fafafa" : bg,
        // The wireframes were greyscale: the same layout, drained.
        filter: wire ? "grayscale(1)" : undefined,
      }}
    >
      <StatusBar />
      {children}
    </div>
  );
}

/**
 * A screen scaled to the width it's given, with the rounded corners of a
 * phone's display. The scaling is one transform on the whole screen, so the
 * text inside it stays text.
 */
export function Fit({ children, radius = 30, shadow = true }: { children: ReactNode; radius?: number; shadow?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setK(el.clientWidth / W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={box}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${W} / ${H}`,
        borderRadius: `${(radius / W) * 100}% / ${(radius / H) * 100}%`,
        overflow: "hidden",
        boxShadow: shadow ? "0 1px 2px rgba(40,40,30,0.08), 0 18px 40px rgba(40,40,30,0.14)" : undefined,
        background: C.cream,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${k})`, transformOrigin: "0 0", visibility: k ? "visible" : "hidden" }}>{children}</div>
    </div>
  );
}

export function StatusBar({ light = false }: { light?: boolean }) {
  const c = light ? "#fff" : C.ink;
  return (
    <div style={abs({ left: 0, right: 0, top: 0, height: 44, zIndex: 5, pointerEvents: "none" })}>
      <div style={abs({ left: 32, top: 14, ...t(15, 600, c) })}>9:41</div>
      <svg style={{ position: "absolute", right: 24, top: 17 }} width="66" height="12" viewBox="0 0 66 12" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={9 - i * 2.6} width="3.2" height={3 + i * 2.6} rx="0.8" fill={c} />
        ))}
        <path d="M27 4.6a8 8 0 0 1 11 0M29.3 7a4.6 4.6 0 0 1 6.4 0" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="32.5" cy="9.6" r="1.2" fill={c} />
        <rect x="42" y="1" width="21" height="10" rx="3" fill="none" stroke={c} strokeOpacity="0.4" />
        <rect x="43.6" y="2.6" width="16" height="6.8" rx="1.6" fill={c} />
        <rect x="64" y="4" width="1.6" height="4" rx="0.8" fill={c} fillOpacity="0.4" />
      </svg>
    </div>
  );
}

/* ---------- Pieces ---------- */

export function Title({ children, top = 92, size = 24, center = false }: { children: ReactNode; top?: number; size?: number; center?: boolean }) {
  return <div style={abs({ left: 24, right: 24, top, textAlign: center ? "center" : "left", ...t(size, 600), lineHeight: 1.2 })}>{children}</div>;
}

export function Sub({ children, top, center = false, color = C.grey }: { children: ReactNode; top: number; center?: boolean; color?: string }) {
  return <div style={abs({ left: 24, right: 24, top, textAlign: center ? "center" : "left", ...t(14, 400, color), lineHeight: 1.45 })}>{children}</div>;
}

export function StepTag({ children, top = 150 }: { children: ReactNode; top?: number }) {
  return <div style={abs({ left: 24, top, ...t(11, 700, C.greenDark), letterSpacing: "0.08em" })}>{children}</div>;
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...t(13, 600, "#3b3b3b"), marginBottom: 7, ...style }}>{children}</div>;
}

export function Input({ value, placeholder, focus = false, height = 46, prefix, right }: { value?: string; placeholder?: string; focus?: boolean; height?: number; prefix?: string; right?: ReactNode }) {
  return (
    <div
      style={{
        height,
        borderRadius: 6,
        background: "#fff",
        border: `1.5px solid ${focus ? C.green : C.line}`,
        boxSizing: "border-box",
        padding: "0 14px",
        display: "flex",
        alignItems: height > 60 ? "flex-start" : "center",
        paddingTop: height > 60 ? 12 : 0,
        gap: 6,
        ...t(14, 400, value ? C.ink : "#a3a3a3"),
      }}
    >
      {prefix && <span style={{ color: C.ink }}>{prefix}</span>}
      <span style={{ flex: 1 }}>{value ?? placeholder}</span>
      {right}
    </div>
  );
}

export function Field({ label, children, gap = 18 }: { label: string; children: ReactNode; gap?: number }) {
  return (
    <div style={{ marginBottom: gap }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** A column of content under the title, laid out in flow. */
export function Body({ top, children, gap }: { top: number; children: ReactNode; gap?: number }) {
  return <div style={abs({ left: 24, right: 24, top, display: "flex", flexDirection: "column", gap })}>{children}</div>;
}

export function Button({ children, top, left = 24, width = W - 48, kind = "green", height = 50 }: { children: ReactNode; top: number; left?: number; width?: number; kind?: "green" | "outline" | "light"; height?: number }) {
  const look: Record<string, CSSProperties> = {
    green: { background: C.greenDark, ...t(16, 600, "#fff") },
    outline: { border: `1.5px solid ${C.forest}`, ...t(15, 500) },
    light: { background: "#fff", border: `1.5px solid ${C.line}`, ...t(15, 500) },
  };
  return <div style={abs({ left, top, width, height, borderRadius: 6, boxSizing: "border-box", display: "grid", placeItems: "center", ...look[kind] })}>{children}</div>;
}

export function Chevron({ dir = "down", color = C.ink }: { dir?: "down" | "right"; color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ transform: dir === "right" ? "rotate(-90deg)" : undefined }}>
      <path d="M3 5l4 4 4-4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Back({ top = 54, color = C.ink }: { top?: number; color?: string }) {
  return (
    <svg style={{ position: "absolute", left: 22, top }} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Close({ top = 54, color = C.ink }: { top?: number; color?: string }) {
  return (
    <svg style={{ position: "absolute", right: 22, top }} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Chip({ children, on = true, small = false }: { children: ReactNode; on?: boolean; small?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "4px 9px" : "7px 12px",
        borderRadius: 5,
        background: on ? C.green : "#fff",
        border: on ? "none" : `1.5px solid ${C.line}`,
        ...t(small ? 11.5 : 12.5, 600, on ? "#fff" : C.ink),
      }}
    >
      {children}
    </span>
  );
}

export type FitLevel = "best" | "good" | "questionable";
/** The fit badge Fortuna put on every applicant. */
export function FitBadge({ fit }: { fit: FitLevel }) {
  const look = {
    best: { bg: C.greenDark, fg: "#fff", label: "Best Fit!", mark: "»" },
    good: { bg: C.greenLight, fg: "#1f5e0a", label: "Good Fit", mark: "›" },
    questionable: { bg: C.orangeTint, fg: "#b35400", label: "Questionable", mark: "?" },
  }[fit];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 4, background: look.bg, ...t(11.5, 700, look.fg) }}>
      <span style={{ fontWeight: 800, transform: fit === "questionable" ? undefined : "rotate(-90deg)", display: "inline-block" }}>{look.mark}</span>
      {look.label}
    </span>
  );
}

/** Initials in a circle, in place of the file's stock portraits. */
export function Avatar({ name, size = 48, tone = C.sage }: { name: string; size?: number; tone?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: tone, display: "grid", placeItems: "center", flex: "none", ...t(size * 0.36, 600, "#fff") }}>
      {initials}
    </div>
  );
}

/** The employer side's tab bar. */
export function EmployerTabs({ on }: { on: "jobs" | "candidates" | "profile" }) {
  const tabs = [
    { k: "jobs", label: "Jobs", icon: <path d="M3 8h18v12H3zM8 8V5h8v3" /> },
    { k: "candidates", label: "Candidates", icon: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-4 3-6 7-6s7 2 7 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2.5.6 4 2.6 4 6" /> },
    { k: "profile", label: "Profile", icon: <path d="M3 10l2-6h14l2 6M4 10v10h16V10M3 10h18M9 20v-6h6v6" /> },
  ] as const;
  return (
    <div style={abs({ left: 0, right: 0, bottom: 0, height: 84, background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex" })}>
      {tabs.map((tab) => {
        const active = tab.k === on;
        const c = active ? C.greenDark : C.sage;
        return (
          <div key={tab.k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4, borderTop: active ? `3px solid ${C.greenDark}` : "3px solid transparent", marginTop: -1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {tab.icon}
            </svg>
            <span style={t(11.5, 500, c)}>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** A modal over a dimmed screen, the 300-wide card the app used. */
export function Modal({ top = 210, height = 390, children }: { top?: number; height?: number; children: ReactNode }) {
  return (
    <>
      <div style={abs({ inset: 0, background: "rgba(0,0,0,0.32)", zIndex: 6 })} />
      <div style={abs({ left: 37.5, top, width: 300, height, borderRadius: 12, background: "#fff", boxShadow: "0 18px 40px rgba(0,0,0,0.18)", zIndex: 7, textAlign: "center" })}>{children}</div>
    </>
  );
}

/** A bottom sheet, as the waitlist and the scheduling slide up. */
export function Sheet({ top, children }: { top: number; children: ReactNode }) {
  return (
    <>
      <div style={abs({ inset: 0, background: "rgba(0,0,0,0.32)", zIndex: 6 })} />
      <div style={abs({ left: 0, right: 0, top, bottom: 0, borderRadius: "18px 18px 0 0", background: C.cream, zIndex: 7, boxShadow: "0 -8px 30px rgba(0,0,0,0.12)" })}>
        <div style={abs({ left: W / 2 - 20, top: 9, width: 40, height: 5, borderRadius: 3, background: "#cfc9bc" })} />
        {children}
      </div>
    </>
  );
}

export function Wordmark({ size = 30, color }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-flex", fontSize: size, lineHeight: 0 }}>
      <FortunaWordmark title="fortuna" color={color} />
    </span>
  );
}

/** A slider, at `at` along its track (0 to 1). */
export function Slider({ at }: { at: number }) {
  return (
    <div style={{ position: "relative", height: 24 }}>
      <div style={abs({ left: 0, right: 0, top: 10, height: 4, borderRadius: 2, background: "#d6d1c4" })} />
      <div style={abs({ left: 0, width: `${at * 100}%`, top: 10, height: 4, borderRadius: 2, background: C.greenDark })} />
      <div style={abs({ left: `calc(${at * 100}% - 12px)`, top: 0, width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 5px rgba(0,0,0,0.25)" })} />
    </div>
  );
}

export function Radio({ label, on = false }: { label: string; on?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...t(14, 400) }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? C.greenDark : "#b9b3a6"}`, boxSizing: "border-box", display: "grid", placeItems: "center" }}>
        {on && <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.greenDark }} />}
      </span>
      {label}
    </div>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: C.card, borderRadius: 10, boxShadow: "0 4px 14px rgba(40,40,30,0.08)", padding: 16, ...style }}>{children}</div>;
}

/* ---------- Spot illustrations, in the app's flat style ---------- */

export function Spot({ kind, size = 150 }: { kind: "newspaper" | "envelope" | "folder" | "clipboard" | "profile" | "cards" | "camera" | "map"; size?: number }) {
  const sage = "#a9c2b6";
  const deep = C.sage;
  const art: Record<string, ReactNode> = {
    newspaper: (
      <>
        <path d="M22 44l92-16 14 74-92 16z" fill={sage} />
        <path d="M22 44l92-16 4 20-92 16z" fill={deep} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M34 ${74 + i * 13}l66 -11.5`} stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        ))}
        <circle cx="112" cy="108" r="20" fill={C.green} />
        <path d="M103 108l6 6 12-12" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    envelope: (
      <>
        <rect x="18" y="40" width="114" height="76" rx="8" fill={sage} />
        <path d="M20 44l55 40 55-40" fill="none" stroke={deep} strokeWidth="4" strokeLinejoin="round" />
        <path d="M20 112l40-32M130 112l-40-32" stroke={deep} strokeWidth="3" opacity="0.6" />
      </>
    ),
    folder: (
      <>
        <path d="M22 42h40l10 10h56v62H22z" fill={deep} />
        <rect x="22" y="58" width="106" height="58" rx="5" fill={sage} />
        <circle cx="75" cy="87" r="17" fill={C.green} />
        <path d="M67 87l6 6 10-11" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    clipboard: (
      <>
        <rect x="38" y="26" width="74" height="98" rx="8" fill={C.forest} />
        <rect x="46" y="38" width="58" height="80" rx="4" fill="#fff" />
        <rect x="58" y="20" width="34" height="14" rx="4" fill={sage} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="54" y={52 + i * 14} width={i === 3 ? 26 : 42} height="5" rx="2.5" fill="#cfd8d3" />
        ))}
      </>
    ),
    profile: (
      <>
        <rect x="36" y="22" width="78" height="104" rx="8" fill="#fff" stroke="#e4e0d6" strokeWidth="2" />
        <rect x="36" y="70" width="78" height="56" rx="0" fill={sage} />
        <circle cx="75" cy="50" r="15" fill={C.green} />
        <path d="M63 70c2-8 7-11 12-11s10 3 12 11" fill={C.green} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="48" y={84 + i * 12} width={i === 2 ? 30 : 54} height="5" rx="2.5" fill="#fff" opacity="0.85" />
        ))}
      </>
    ),
    cards: (
      <>
        <g transform="rotate(-14 50 80)">
          <rect x="18" y="40" width="58" height="80" rx="8" fill={C.red} opacity="0.85" />
          <path d="M37 70l20 20M57 70L37 90" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        </g>
        <rect x="52" y="24" width="58" height="80" rx="8" fill="#e4e0d6" />
        <g transform="rotate(10 100 80)">
          <rect x="74" y="38" width="62" height="84" rx="8" fill={C.green} />
          <path d="M92 80l10 10 18-20" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </>
    ),
    camera: (
      <>
        <rect x="20" y="40" width="110" height="72" rx="10" fill={C.forest} />
        <rect x="28" y="48" width="94" height="56" rx="5" fill={sage} />
        <circle cx="75" cy="70" r="11" fill={C.green} />
        <path d="M58 104c2-12 9-17 17-17s15 5 17 17" fill={C.green} />
        <circle cx="114" cy="56" r="5" fill={C.red} />
      </>
    ),
    map: (
      <>
        <path d="M18 46l36-12 42 12 36-12v76l-36 12-42-12-36 12z" fill={sage} />
        <path d="M54 34v76M96 46v76" stroke="#fff" strokeWidth="2" opacity="0.6" />
        <path d="M75 46c-13 0-22 9-22 21 0 16 22 37 22 37s22-21 22-37c0-12-9-21-22-21z" fill={C.orange} />
        <circle cx="75" cy="67" r="8" fill="#fff" />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" aria-hidden="true">
      {art[kind]}
    </svg>
  );
}

export function Icon({ d, size = 20, color = C.ink, stroke = 1.8 }: { d: string; size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  cal: "M4 6h16v14H4zM4 10h16M9 3v5M15 3v5",
  pin: "M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  play: "M7 4l13 8-13 8z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  filter: "M4 6h16M7 12h10M10 18h4",
  plus: "M12 5v14M5 12h14",
  briefcase: "M3 8h18v12H3zM8 8V5h8v3",
  person: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7",
};
