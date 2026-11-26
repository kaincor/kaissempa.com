"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useState } from "react";

/**
 * The flyer, both sides of it. Employers on the front, job seekers on the
 * back, and a tab in the corner of each telling you to turn it over. Here
 * the tab works: press it, or the button under the card, and it flips.
 */
export default function FlyerFlip() {
  const reduced = useReducedMotion();
  const [back, setBack] = useState(false);
  const flip = () => setBack((v) => !v);
  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(40,40,30,0.08), 0 22px 48px rgba(40,40,30,0.16)",
  };
  // The tab sits top right on the front and top left on the back.
  const tab = (left: boolean): React.CSSProperties => ({
    position: "absolute",
    top: "6%",
    [left ? "left" : "right"]: 0,
    width: "22%",
    height: "25%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    borderRadius: left ? "0 999px 999px 0" : "999px 0 0 999px",
  });
  return (
    <figure className="f-wide" style={{ marginTop: "clamp(28px, 5vw, 56px)", marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "min(100%, 360px)", perspective: 1600 }}>
          <div
            style={{
              position: "relative",
              aspectRatio: "2 / 3",
              transformStyle: "preserve-3d",
              transform: back ? "rotateY(180deg)" : "none",
              transition: reduced ? "none" : "transform 0.9s cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          >
            <div style={face} aria-hidden={back}>
              <Image src="/fortuna/brand/flyer-employers.webp" alt="The employer side of the flyer: fortuna. Employers: Hiring made effortless. A character holds a phone with a QR code and the word Download. An orange tab in the corner reads Need a job?" fill sizes="360px" style={{ objectFit: "cover" }} />
              <button type="button" aria-label="Need a job? Turn the flyer over" onClick={flip} style={tab(false)} tabIndex={back ? -1 : 0} />
            </div>
            <div style={{ ...face, transform: "rotateY(180deg)" }} aria-hidden={!back}>
              <Image src="/fortuna/brand/flyer-job-seekers.webp" alt="The job seeker side of the flyer: fortuna. Job Seekers: Find your dream job today. A character holds a phone with a QR code and the word Download. A green tab in the corner reads Need to hire?" fill sizes="360px" style={{ objectFit: "cover" }} />
              <button type="button" aria-label="Need to hire? Turn the flyer over" onClick={flip} style={tab(true)} tabIndex={back ? 0 : -1} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={flip}
          style={{
            marginTop: "clamp(18px, 2.6vw, 28px)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 20px",
            borderRadius: 999,
            border: "none",
            background: back ? "var(--f-green)" : "var(--f-orange)",
            color: "#fff",
            fontFamily: "var(--f-grotesk)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "background 0.4s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M5 2v11M5 13l-2.5-2.5M5 13l2.5-2.5M11 14V3M11 3 8.5 5.5M11 3l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back ? "Need to hire? Turn it over" : "Need a job? Turn it over"}
        </button>
        <figcaption aria-live="polite" style={{ marginTop: 12, maxWidth: 380, fontFamily: "var(--f-body)", fontSize: "clamp(12px, 1.25vw, 14px)", lineHeight: 1.5, color: "var(--f-ink)", textAlign: "center" }}>
          {back
            ? "The back, for job seekers: dream job, in orange, and a green tab for the employers on the other side."
            : "The front, for employers: Hiring, in green, and an orange tab for the job seekers on the other side."}
        </figcaption>
      </div>
    </figure>
  );
}
