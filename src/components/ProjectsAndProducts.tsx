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
/**
 * Space between the boxes, and between the heading and the first of them.
 *
 * Responsive rather than fixed: 75px is right beside a 560px-tall box and far
 * too much beside the 160px one a phone renders, where it left the column
 * reading as five unrelated items rather than a set. The ceiling keeps the
 * desktop spacing exactly where it was.
 */
const GAP = "clamp(30px, 6.7vw, 75px)";

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

/**
 * A line or two about each project, shown under its thumbnail on the Work
 * page. `filler` marks copy Kai has yet to write: faded and tagged, so it
 * cannot pass for the real thing.
 */
type Info = { role: string; year: string; blurb: string; filler?: boolean };
const INFO: Record<string, Info> = {
  Fortuna: {
    role: "Product designer",
    year: "2022",
    blurb: "A swipe-to-work app that launched in Miami. I worked on the brand, the app, and everything in between.",
  },
  Zorzal: { role: "Role", year: "Year", blurb: "A line about the project, and what you did on it.", filler: true },
  "Mark of the Witch": { role: "Role", year: "Year", blurb: "A line about the project, and what you did on it.", filler: true },
  "Pond Mage": { role: "Role", year: "Year", blurb: "A line about the project, and what you did on it.", filler: true },
};

/**
 * `detailed` is the Work page: the same thumbnails, each with its role, year
 * and a line about it, and the heading set as the page's own title.
 */
export default function ProjectsAndProducts({ detailed = false }: { detailed?: boolean } = {}) {
  const info = (label: string) => (detailed ? INFO[label] : undefined);
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Small, because the lift the block above sheds already leaves about
        // 180px of grey between the last thumbnail and the section below.
        padding: "0 10px 24px",
        gap: GAP,
      }}
    >
      <SectionHeading paddingTop={detailed ? "clamp(110px, 18svh, 170px)" : 40} as={detailed ? "h1" : undefined}>
        Projects &amp; Products
      </SectionHeading>

      <Thumb label="Fortuna" href={null} shadow={FORTUNA_GREEN} info={info("Fortuna")}>
        <FortunaThumb href="/fortuna" label="Fortuna" />
      </Thumb>

      <Thumb label="Zorzal" background="#ffffff" shadow={ZORZAL_WINE} info={info("Zorzal")}>
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

      <Thumb label="Mark of the Witch" info={info("Mark of the Witch")}>
        <Image
          src="/case-studies/mark-of-the-witch.jpg"
          alt="Mark of the Witch"
          fill
          sizes={`(max-width: ${MAX_WIDTH}px) 100vw, ${MAX_WIDTH}px`}
          quality={85}
          style={{ objectFit: "cover" }}
        />
      </Thumb>

      <Thumb label="Pond Mage" shadow={POND_MAGE_PURPLE} info={info("Pond Mage")}>
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
  info,
  children,
}: {
  label: string;
  /** The Work page's line about the project, under the thumbnail. */
  info?: Info;
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
      {info ? <Details label={label} info={info} /> : null}
    </motion.div>
  );
}

function Details({ label, info }: { label: string; info: Info }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "6px 24px",
        padding: "18px 6px 0",
        opacity: info.filler ? 0.55 : 1,
      }}
    >
      <div>
        <div className="display" style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "#111" }}>
          {label}
        </div>
        <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
          {info.role} · {info.year}
        </div>
      </div>
      <p style={{ margin: 0, flex: "1 1 320px", maxWidth: 520, fontSize: 15, lineHeight: 1.5, color: "#333" }}>
        {info.filler ? (
          <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c2410c", marginRight: 8 }}>
            filler
          </span>
        ) : null}
        {info.blurb}
      </p>
    </div>
  );
}
