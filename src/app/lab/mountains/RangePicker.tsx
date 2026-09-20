"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import { MOUNTAIN_RANGES } from "@/data/mountainRanges";

const HEIGHTS = ["clamp(60px, 7vw, 120px)", "clamp(70px, 10vw, 180px)", "clamp(110px, 16vw, 280px)"];
const HEIGHT_LABELS = ["S", "M", "L"];

export default function RangePicker() {
  const [i, setI] = useState(0);
  const [h, setH] = useState(1);
  const range = MOUNTAIN_RANGES[i];

  return (
    <>
      <Hero />

      <MountainRange range={range} height={HEIGHTS[h]}>
        <div className="px-8 py-32 sm:px-16" style={{ minHeight: "70vh" }}>
          <p className="display text-3xl sm:text-5xl" style={{ color: "#d4d4d4" }}>
            The section below
          </p>
          <p className="mt-4 max-w-prose text-sm" style={{ color: "#8a8a8a" }}>
            Same black as the ridge, so the silhouette reads as the top edge of
            this section rather than an image sitting on top of it.
          </p>
        </div>
      </MountainRange>

      {/* Controls */}
      <div
        className="glass"
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(5, 5, 5, 0.55)",
          color: "#fff",
          fontSize: 12,
          maxWidth: "94vw",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button onClick={() => setI((v) => (v - 1 + MOUNTAIN_RANGES.length) % MOUNTAIN_RANGES.length)} style={btn}>
          ‹
        </button>
        <span style={{ minWidth: 118, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          Range {range.id} of {MOUNTAIN_RANGES.length} · {range.width}×{range.height}
        </span>
        <button onClick={() => setI((v) => (v + 1) % MOUNTAIN_RANGES.length)} style={btn}>
          ›
        </button>

        <span style={{ opacity: 0.45 }}>|</span>

        {MOUNTAIN_RANGES.map((r, idx) => (
          <button
            key={r.id}
            onClick={() => setI(idx)}
            style={{ ...btn, opacity: idx === i ? 1 : 0.45, minWidth: 24 }}
          >
            {r.id}
          </button>
        ))}

        <span style={{ opacity: 0.45 }}>|</span>

        {HEIGHT_LABELS.map((label, idx) => (
          <button
            key={label}
            onClick={() => setH(idx)}
            style={{ ...btn, opacity: idx === h ? 1 : 0.45 }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

const btn: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  border: "none",
  color: "#fff",
  borderRadius: 7,
  padding: "5px 8px",
  cursor: "pointer",
  font: "inherit",
  lineHeight: 1,
};
