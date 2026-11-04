import CloudDrift from "@/components/CloudDrift";

/**
 * A stand-in for the Zorzal hero, which Kai is designing for phone, iPad and
 * desktop from the layered landscape in Figma (3417:9). Until then it is the
 * home-page thumbnail at full screen: the two drifting cloud layers, the
 * landscape along the bottom and the wordmark above it.
 *
 * The landscape is about three times as wide as it is tall, so on a phone it
 * is a strip along the bottom of a lot of sky. That is expected; the real
 * hero reframes it.
 */
export default function ZorzalHero() {
  return (
    <header
      style={{
        position: "relative",
        height: "100svh",
        minHeight: 520,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <CloudDrift
        layers={[
          { src: "/case-studies/cloud-1.svg", heightPct: 70, aspect: 2.452, duration: 46 },
          { src: "/case-studies/cloud-2.svg", heightPct: 62, aspect: 1.487, duration: 70 },
        ]}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/case-studies/zorzal-landscape.svg"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-5%",
          bottom: "-8%",
          width: "110%",
          maxWidth: "none",
          height: "auto",
          zIndex: 10,
        }}
      />
      <h1 style={{ margin: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/case-studies/zorzal-typography.svg"
          alt="Zorzal"
          style={{
            position: "absolute",
            top: "24%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "clamp(200px, 34vw, 520px)",
            zIndex: 20,
          }}
        />
      </h1>
    </header>
  );
}
