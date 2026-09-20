"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { MOUNTAIN_RANGES } from "@/data/mountainRanges";

export default function RangePicker() {
  // Defaults mirror the live page: 7 behind, 1 in front.
  const [far, setFar] = useState(6);
  const [near, setNear] = useState(0);
  const [showFar, setShowFar] = useState(true);
  const [editing, setEditing] = useState<"near" | "far">("near");

  const farRange = MOUNTAIN_RANGES[far];
  const nearRange = MOUNTAIN_RANGES[near];
  const active = editing === "near" ? near : far;
  const setActive = editing === "near" ? setNear : setFar;

  return (
    <>
      <Hero
        behind={
          showFar ? (
            <RidgeLayer range={farRange} height="clamp(60px, 9vw, 160px)" rise={45} />
          ) : null
        }
      />

      <MountainRange range={nearRange} height="clamp(70px, 10vw, 180px)" rise={140}>
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>

      <div className="glass" style={panel}>
        <button onClick={() => setEditing("far")} style={{ ...btn, opacity: editing === "far" ? 1 : 0.4 }}>
          far {farRange.id}
        </button>
        <button onClick={() => setEditing("near")} style={{ ...btn, opacity: editing === "near" ? 1 : 0.4 }}>
          near {nearRange.id}
        </button>
        <button onClick={() => setShowFar((v) => !v)} style={{ ...btn, opacity: showFar ? 1 : 0.4 }}>
          {showFar ? "far on" : "far off"}
        </button>
        <span style={{ opacity: 0.4 }}>|</span>
        {MOUNTAIN_RANGES.map((r, i) => (
          <button key={r.id} onClick={() => setActive(i)}
            style={{ ...btn, minWidth: 22, opacity: i === active ? 1 : 0.4 }}>
            {r.id}
          </button>
        ))}
      </div>
    </>
  );
}

const panel: React.CSSProperties = {
  position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
  zIndex: 50, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
  justifyContent: "center", padding: "10px 14px", borderRadius: 14,
  background: "rgba(5,5,5,0.62)", color: "#fff", fontSize: 12, maxWidth: "94vw",
};
const btn: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
  borderRadius: 7, padding: "5px 8px", cursor: "pointer", font: "inherit", lineHeight: 1,
};
