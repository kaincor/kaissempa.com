"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { MOUNTAIN_RANGES } from "@/data/mountainRanges";

const DEFAULTS = {
  farId: 9,
  nearId: 0,
  sceneRise: -80,
  farRise: 45,
  nearRise: 150,
  farH: 70,
  nearH: 120,
  showFar: true,
};

export default function RangePicker() {
  const [s, setS] = useState(DEFAULTS);
  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const farRange = MOUNTAIN_RANGES[s.farId];
  const nearRange = MOUNTAIN_RANGES[s.nearId];

  return (
    <>
      <Hero
        rise={s.sceneRise}
        behind={
          s.showFar ? (
            <RidgeLayer range={farRange} height={`${s.farH}px`} rise={s.farRise} />
          ) : null
        }
      />

      <MountainRange range={nearRange} height={`${s.nearH}px`} rise={s.nearRise}>
        <div className="px-8 py-32 sm:px-16" style={{ minHeight: "80vh" }}>
          <p className="display text-3xl sm:text-5xl" style={{ color: "#d4d4d4" }}>
            The section below
          </p>
        </div>
      </MountainRange>

      <div style={panel} className="glass">
        <Row label={`scene rise ${s.sceneRise}`}>
          <input type="range" min={-300} max={300} step={10} value={s.sceneRise}
            onChange={(e) => set("sceneRise", +e.target.value)} style={slider} />
        </Row>

        <Row label={`far rise ${s.farRise}`}>
          <input type="range" min={-200} max={300} step={5} value={s.farRise}
            onChange={(e) => set("farRise", +e.target.value)} style={slider} />
        </Row>
        <Row label={`far height ${s.farH}`}>
          <input type="range" min={30} max={260} step={5} value={s.farH}
            onChange={(e) => set("farH", +e.target.value)} style={slider} />
        </Row>

        <Row label={`near rise ${s.nearRise}`}>
          <input type="range" min={-200} max={400} step={5} value={s.nearRise}
            onChange={(e) => set("nearRise", +e.target.value)} style={slider} />
        </Row>
        <Row label={`near height ${s.nearH}`}>
          <input type="range" min={40} max={320} step={5} value={s.nearH}
            onChange={(e) => set("nearH", +e.target.value)} style={slider} />
        </Row>

        <Row label={`far range ${farRange.id}`}>
          <Picker value={s.farId} onChange={(v) => set("farId", v)} />
        </Row>
        <Row label={`near range ${nearRange.id}`}>
          <Picker value={s.nearId} onChange={(v) => set("nearId", v)} />
        </Row>

        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <button onClick={() => set("showFar", !s.showFar)}
            style={{ ...btn, opacity: s.showFar ? 1 : 0.4 }}>
            {s.showFar ? "far on" : "far off"}
          </button>
          <button onClick={() => setS(DEFAULTS)} style={btn}>reset</button>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "116px 1fr", alignItems: "center", gap: 8 }}>
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

function Picker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {MOUNTAIN_RANGES.map((r, i) => (
        <button key={r.id} onClick={() => onChange(i)}
          style={{ ...btn, minWidth: 20, padding: "3px 5px", opacity: i === value ? 1 : 0.35 }}>
          {r.id}
        </button>
      ))}
    </div>
  );
}

const panel: React.CSSProperties = {
  position: "fixed", bottom: 16, left: 16, zIndex: 50,
  display: "flex", flexDirection: "column", gap: 6,
  padding: 14, borderRadius: 14,
  background: "rgba(5,5,5,0.7)", color: "#fff",
  fontSize: 11, width: 330, maxWidth: "92vw",
};
const slider: React.CSSProperties = { width: "100%", accentColor: "#fff" };
const btn: React.CSSProperties = {
  background: "rgba(255,255,255,0.14)", border: "none", color: "#fff",
  borderRadius: 6, padding: "4px 8px", cursor: "pointer", font: "inherit", lineHeight: 1,
};
