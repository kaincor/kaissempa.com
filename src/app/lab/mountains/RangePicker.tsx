"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { MOUNTAIN_RANGES } from "@/data/mountainRanges";

const HEIGHTS = ["clamp(60px, 7vw, 120px)", "clamp(70px, 10vw, 180px)", "clamp(110px, 16vw, 280px)"];
const HEIGHT_LABELS = ["S", "M", "L"];

export default function RangePicker() {
  const [near, setNear] = useState(0);
  const [far, setFar] = useState(9);
  const [h, setH] = useState(1);
  const [showFar, setShowFar] = useState(true);
  const [editing, setEditing] = useState<"near" | "far">("near");

  const nearRange = MOUNTAIN_RANGES[near];
  const farRange = MOUNTAIN_RANGES[far];
  const active = editing === "near" ? near : far;
  const setActive = editing === "near" ? setNear : setFar;

  return (
    <>
      <Hero
        behind={
          showFar ? (
            // Slower rise and a shorter silhouette read as further away.
            <RidgeLayer range={farRange} height="clamp(50px, 7vw, 120px)" rise={45} />
          ) : null
        }
      />

      <MountainRange range={nearRange} height={HEIGHTS[h]} rise={150}>
        <div className="px-8 py-32 sm:px-16" style={{ minHeight: "70vh" }}>
          <p className="display text-3xl sm:text-5xl" style={{ color: "#d4d4d4" }}>
            The section below
          </p>
        </div>
      </MountainRange>

      <div
        className="glass"
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(5, 5, 5, 0.62)",
          color: "#fff",
          fontSize: 12,
          maxWidth: "94vw",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
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

        {MOUNTAIN_RANGES.map((r, idx) => (
          <button
            key={r.id}
            onClick={() => setActive(idx)}
            style={{ ...btn, opacity: idx === active ? 1 : 0.4, minWidth: 22 }}
          >
            {r.id}
          </button>
        ))}

        <span style={{ opacity: 0.4 }}>|</span>

        {HEIGHT_LABELS.map((label, idx) => (
          <button key={label} onClick={() => setH(idx)} style={{ ...btn, opacity: idx === h ? 1 : 0.4 }}>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

const btn: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "none",
  color: "#fff",
  borderRadius: 7,
  padding: "5px 8px",
  cursor: "pointer",
  font: "inherit",
  lineHeight: 1,
};
