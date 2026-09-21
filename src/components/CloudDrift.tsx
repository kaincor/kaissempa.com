"use client";

import { useEffect, useRef, useState } from "react";

export type CloudLayerSpec = {
  src: string;
  /** Tile height as a percentage of the container, so it scales with the box. */
  heightPct: number;
  /** Tile width / height. */
  aspect: number;
  /** Seconds for one tile to pass. */
  duration: number;
};

/** Must match the -16.6667% travel in the cloud-drift keyframe. */
const TILE_COUNT = 6;

/**
 * Two cloud layers drifting at different speeds behind the Zorzal art.
 *
 * Ported from the Framer component with two changes. Sizing is percentage
 * rather than fixed pixels — the original's tiles were a fixed height whatever
 * the container, so the loop only lined up at one width. And the motion is a
 * CSS keyframe rather than a JS-driven transform, so it runs on the compositor
 * and can be frozen in place while the card is off screen.
 */
export default function CloudDrift({ layers }: { layers: CloudLayerSpec[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);

  // No reason to keep animating a card nobody is looking at.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setRunning(entries.some((e) => e.isIntersecting)),
      { rootMargin: "100px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {layers.map((layer, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div
            className="cloud-row"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              display: "flex",
              // max-content, not a percentage of the container: a tile is
              // height x aspect, and the two only agree by accident otherwise.
              width: "max-content",
              height: `${layer.heightPct}%`,
              animationDuration: `${layer.duration}s`,
              animationPlayState: running ? "running" : "paused",
            }}
          >
            {Array.from({ length: TILE_COUNT }).map((_, t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={t}
                src={layer.src}
                alt=""
                style={{
                  height: "100%",
                  aspectRatio: layer.aspect,
                  // Without this the tiles squash to fit and the tile width
                  // stops matching the travel distance.
                  flexShrink: 0,
                  width: "auto",
                  maxWidth: "none",
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
