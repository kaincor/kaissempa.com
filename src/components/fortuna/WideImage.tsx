"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

/**
 * A still, edge to edge, the way the reel is. It fades in as it comes on
 * screen, settling from a touch larger, slowly enough to be seen on
 * something this big (the text's quick fade would pass unnoticed).
 */
export default function WideImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const reduced = useReducedMotion();
  return (
    <figure
      style={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginTop: 0,
        marginBottom: "clamp(28px, 5vw, 56px)",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 1.04 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ opacity: { duration: 1.1, ease: "easeOut" }, scale: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }}
      >
        <Image src={src} alt={alt} width={width} height={height} sizes="100vw" style={{ display: "block", width: "100%", height: "auto" }} />
      </motion.div>
    </figure>
  );
}
