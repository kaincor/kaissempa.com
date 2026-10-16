"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { PHOTOS } from "@/components/About";

/**
 * The rest of the About page, below More about me: more photographs, and a
 * few short sections of copy Kai has yet to write. On the same black, so the
 * page reads as one long section closing out into the footer.
 *
 * Filler is faded and tagged, as on the case study, so none of it can pass
 * for finished copy.
 */
const SECTIONS = [
  { title: "Where I'm from", text: "A few lines on growing up in rural Uganda, and how it shaped the way you see design." },
  { title: "How I work", text: "A few lines on moving between design and development, and what you enjoy about holding both." },
  { title: "Outside of work", text: "A few lines on bodybuilding, mountain biking, embroidery, and whatever else you're into lately." },
];

export default function AboutMore() {
  const reduced = useReducedMotion();
  return (
    <section
      style={{
        // Above the footer ridge's black backing, as More about me is.
        position: "relative",
        zIndex: 1,
        background: "#000",
        color: "#d9d9d9",
        padding: "0 30px clamp(70px, 12vw, 150px)",
      }}
    >
      <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 42vw), 1fr))",
            gap: "clamp(10px, 2vw, 22px)",
          }}
        >
          {PHOTOS.map((p, i) => (
            <motion.div
              key={p.src}
              initial={reduced ? false : { opacity: 0, y: 28, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: (i % 4) * 0.06, opacity: { duration: 0.5, delay: (i % 4) * 0.06 } }}
              style={{ position: "relative", aspectRatio: "3 / 4", borderRadius: 10, overflow: "hidden", boxShadow: "0 15px 35px rgba(0, 0, 0, 0.5)" }}
            >
              <Image src={p.src} alt={p.alt} fill sizes="(max-width: 640px) 45vw, 280px" quality={85} style={{ objectFit: "cover" }} />
            </motion.div>
          ))}
        </div>

        <div
          className="display"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "clamp(28px, 4vw, 56px)",
            marginTop: "clamp(56px, 9vw, 110px)",
          }}
        >
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 style={{ margin: "0 0 12px", fontSize: "clamp(17px, 1.8vw, 22px)", fontWeight: 400, color: "#d9d9d9" }}>{s.title}</h2>
              <p style={{ margin: 0, fontSize: "clamp(14px, 1.4vw, 17px)", lineHeight: 1.5, color: "#6e6e6e", opacity: 0.75 }}>
                <span style={{ fontSize: "0.7em", letterSpacing: "0.1em", color: "#f58120", marginRight: 8 }}>FILLER</span>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
