"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CREAM, FOREST } from "../reel/cards";
import { PHONE_BODY } from "../reel/phone-shape";

/**
 * The phone from the Motion Vectors page's mockup — the forest body with its
 * side buttons, the notch and the speaker — with a screen inside it.
 *
 * Drawn at the mockup's own 415 x 838 and scaled as one piece to whatever
 * width it is given, so everything on the screen is placed in the app's own
 * units (the screen is 375 x 801).
 */
export const PHONE = { w: 415, h: 838 };
export const SCREEN = { x: 20, y: 18, w: 375, h: 801 };

export default function PhoneMockup({ width, children }: { width: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setK(el.clientWidth / PHONE.w);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} style={{ position: "relative", width, aspectRatio: `${PHONE.w} / ${PHONE.h}` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PHONE.w,
          height: PHONE.h,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          visibility: k ? "visible" : "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: "6px 4px", borderRadius: 60, boxShadow: "0 40px 80px rgba(20, 30, 27, 0.25)" }} />
        <svg width={PHONE.w} height={PHONE.h} viewBox="0 0 415 837.998" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <path d={PHONE_BODY} fill={FOREST} fillRule="evenodd" clipRule="evenodd" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: SCREEN.x,
            top: SCREEN.y,
            width: SCREEN.w,
            height: SCREEN.h,
            borderRadius: 44,
            overflow: "hidden",
            background: CREAM,
          }}
        >
          {children}
        </div>
        {/* The notch, over the screen. */}
        <div style={{ position: "absolute", left: 107, top: 18, width: 201, height: 30, borderRadius: "0 0 22px 22px", background: FOREST }}>
          <div style={{ position: "absolute", left: 77, top: 11, width: 46, height: 5, borderRadius: 3, background: "#26352f" }} />
        </div>
      </div>
    </div>
  );
}

/**
 * The dot grid the demos sit on: a designer's canvas, so the phone reads as
 * a mockup of how the app is used rather than a product shot. Faint, and
 * fading out toward its edges.
 */
export function DotField({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "clamp(36px, 6vw, 64px) 0",
        margin: "8px 0",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(50, 68, 62, 0.28) 1.1px, transparent 1.6px)",
          backgroundSize: "14px 14px",
          backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse 70% 62% at 50% 50%, #000 45%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 62% at 50% 50%, #000 45%, transparent 100%)",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
