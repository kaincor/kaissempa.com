import SkySwitch from "./SkySwitch";
import TapestryLandscape from "./TapestryLandscape";

/**
 * The Zorzal hero: a pale daytime sky with faint stars along the top edge,
 * Kai's layered landscape pieced together from the screen edges on load, and
 * the wordmark settling in once the ground is down. ?sky=clouds swaps the
 * sky for the original drifting clouds.
 *
 * The landscape is about three times as wide as it is tall, so on a phone it
 * is a strip along the bottom of a lot of sky. Kai is designing phone, iPad
 * and desktop framings; this is the desktop one stretched.
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
      <SkySwitch />
      <TapestryLandscape
        style={{
          position: "absolute",
          left: "-5%",
          bottom: "-8%",
          width: "110%",
          zIndex: 10,
        }}
      />
      <h1
        style={{
          margin: 0,
          position: "absolute",
          top: "24%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(200px, 34vw, 520px)",
          zIndex: 20,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="z-wordmark" src="/case-studies/zorzal-typography.svg" alt="Zorzal" style={{ display: "block", width: "100%" }} />
      </h1>
    </header>
  );
}
