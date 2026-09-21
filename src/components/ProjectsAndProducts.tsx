"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import CloudDrift from "@/components/CloudDrift";

/** Every box is 2:1 and 1120 wide at most, matching the Framer build. */
const MAX_WIDTH = 1120;
const RADIUS = 20;
const GAP = 75;

/** Where the case studies point until the real pages exist. */
const WIP = "/wip";

export default function ProjectsAndProducts() {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 10px 120px",
        gap: GAP,
      }}
    >
      <SectionTitle>Projects &amp; Products</SectionTitle>

      {/* The scene keeps its pointer events, so this box is NOT a whole-box
          link — a cross-origin iframe swallows the event and the parent never
          sees the click. The corner chip carries the link instead. */}
      <Thumb label="Fortuna" href={null} corner={{ label: "Fortuna", href: WIP }}>
        <iframe
          src="https://my.spline.design/untitled-LJJusTxa5gWBBga8bpLjm42w-3v2/"
          title="Fortuna — interactive scene"
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
          }}
        />
      </Thumb>

      <Thumb label="Zorzal" background="#ffffff">
        <CloudDrift
          layers={[
            { src: "/case-studies/cloud-1.svg", heightPct: 94.6, aspect: 2.452, duration: 26 },
            { src: "/case-studies/cloud-2.svg", heightPct: 85.2, aspect: 1.487, duration: 40 },
          ]}
        />
        {/* Percentages of the Framer frame: the landscape overhangs 60px either
            side of 1120 and sits 195px below a 560 tall box, clipped by it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/case-studies/zorzal-landscape.svg"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-5.36%",
            right: "-5.36%",
            bottom: "-34.8%",
            width: "110.72%",
            height: "75.5%",
            // Nudged right; the art is not centred within its own viewBox.
            transform: "translateX(22px)",
            zIndex: 10,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/case-studies/zorzal-typography.svg"
          alt="Reserva Zorzal"
          style={{
            position: "absolute",
            top: "9.1%",
            left: "53%",
            transform: "translateX(-50%)",
            width: "32.9%",
            zIndex: 20,
          }}
        />
      </Thumb>

      <Thumb label="Mark of the Witch">
        <Image
          src="/case-studies/mark-of-the-witch.jpg"
          alt="Mark of the Witch"
          fill
          sizes={`(max-width: ${MAX_WIDTH}px) 100vw, ${MAX_WIDTH}px`}
          quality={85}
          style={{ objectFit: "cover" }}
        />
      </Thumb>

      <Thumb label="Pond Mage">
        <Image
          src="/case-studies/pond-mage.jpg"
          alt="Pond Mage"
          fill
          sizes={`(max-width: ${MAX_WIDTH}px) 100vw, ${MAX_WIDTH}px`}
          quality={85}
          style={{ objectFit: "cover" }}
        />
      </Thumb>

      {/* Placeholder for work still to come. */}
      <Thumb label="More work coming" href={null} background="#8c8c8c" />
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const play = reduced ? true : inView;

  return (
    <motion.h2
      ref={ref}
      className="display"
      initial={false}
      animate={play ? { opacity: 1, y: 0 } : { opacity: 0, y: -28 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      }
      style={{
        margin: "0 auto",
        paddingTop: 40,
        fontSize: "clamp(28px, 4.4vw, 56px)",
        lineHeight: 1.05,
        color: "var(--foreground)",
        textAlign: "center",
      }}
    >
      {children}
    </motion.h2>
  );
}

function Thumb({
  label,
  href = WIP,
  background,
  corner,
  children,
}: {
  label: string;
  /**
   * null means "not a link". It cannot be undefined: a default parameter only
   * applies to undefined, so `href={undefined}` silently falls back to WIP and
   * wraps the box in an anchor — which nested the corner chip's anchor inside
   * it and broke hydration.
   */
  href?: string | null;
  background?: string;
  /** Link chip for boxes whose content needs its own pointer events. */
  corner?: { label: string; href: string };
  children?: ReactNode;
}) {
  const frame = (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 1",
        borderRadius: RADIUS,
        overflow: "hidden",
        background,
        // Contains the absolutely positioned art and clips it to the radius.
        isolation: "isolate",
      }}
    >
      {children}
      {corner ? (
        <Link
          href={corner.href}
          className="display"
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            zIndex: 30,
            padding: "9px 14px",
            borderRadius: 999,
            background: "rgba(5, 5, 5, 0.62)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1,
            textDecoration: "none",
          }}
        >
          {corner.label}
        </Link>
      ) : null}
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: MAX_WIDTH }}>
      {href ? (
        <Link href={href} aria-label={label} style={{ display: "block" }}>
          {frame}
        </Link>
      ) : (
        <div role="img" aria-label={label}>
          {frame}
        </div>
      )}
    </div>
  );
}
