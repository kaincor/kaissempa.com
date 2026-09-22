"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import CloudDrift from "@/components/CloudDrift";
import SectionHeading from "@/components/SectionHeading";
import FortunaThumb from "@/components/FortunaThumb";

/** Every box is 2:1 and 1120 wide at most, matching the Framer build. */
const MAX_WIDTH = 1120;
const RADIUS = 20;
const GAP = 75;

/** Where the case studies point until the real pages exist. */
const WIP = "/wip";

/**
 * Per-project shadow colours, taken from the Framer colour styles rather than
 * sampled by eye: Zorzal Wine is the exact fill in zorzal-typography.svg, and
 * Fortuna Green is that project's accent.
 *
 * Coloured shadows need more alpha than black to carry the same weight — a
 * mid-tone at 0.45 reads considerably lighter than black at 0.45.
 */
const ZORZAL_WINE = { rgb: "152 60 68", alpha: 0.6 };
const FORTUNA_GREEN = { rgb: "105 189 69", alpha: 0.62 };
const POND_MAGE_PURPLE = { rgb: "157 114 170", alpha: 0.62 };

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
      <SectionHeading paddingTop={40}>Projects &amp; Products</SectionHeading>

      <Thumb label="Fortuna" href={null} shadow={FORTUNA_GREEN}>
        <FortunaThumb
          src="https://my.spline.design/untitled-LJJusTxa5gWBBga8bpLjm42w-3v2/"
          href={WIP}
          label="Fortuna"
        />
      </Thumb>

      <Thumb label="Zorzal" background="#ffffff" shadow={ZORZAL_WINE}>
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
            // Tailwind's preflight sets img { max-width: 100% }, which was
            // clamping the 110.72% back to the container width. The art then
            // sat 37px short of the right edge, which read as white space.
            maxWidth: "none",
            height: "75.5%",
            // Nudged right; the overhang is deliberately uneven.
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

      <Thumb label="Pond Mage" shadow={POND_MAGE_PURPLE}>
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

function Thumb({
  label,
  href = WIP,
  background,
  shadow,
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
  /** Overrides the default black shadow. */
  shadow?: { rgb: string; alpha: number };
  children?: ReactNode;
}) {
  const frame = (
    <div
      className="thumb-shadow"
      style={{
        ...(shadow
          ? ({
              "--thumb-shadow-rgb": shadow.rgb,
              "--thumb-shadow-alpha": String(shadow.alpha),
            } as React.CSSProperties)
          : null),
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
    </div>
  );

  return (
    <motion.div
      style={{ width: "100%", maxWidth: MAX_WIDTH }}
      initial={{ opacity: 0, y: 72, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      // once: the animation is a greeting, not a state. Replaying it on every
      // pass makes the page feel like it is reintroducing itself.
      viewport={{ once: true, amount: 0.2 }}
      // Springs on the movement so it overshoots and settles; a plain tween on
      // the fade, because a bouncing opacity flickers.
      transition={{
        y: { type: "spring", stiffness: 58, damping: 11, mass: 1.1 },
        scale: { type: "spring", stiffness: 58, damping: 11, mass: 1.1 },
        opacity: { duration: 0.75, ease: "easeOut" },
      }}
    >
      {href ? (
        <Link href={href} aria-label={label} style={{ display: "block" }}>
          {frame}
        </Link>
      ) : (
        <div role="img" aria-label={label}>
          {frame}
        </div>
      )}
    </motion.div>
  );
}
