import HeroMotion from "./HeroMotion";
import SkySwitch from "./SkySwitch";
import TapestryLandscape from "./TapestryLandscape";

/**
 * The Zorzal hero: a pale daytime sky with faint stars along the top edge,
 * Kai's layered landscape pieced together from the screen edges on load, and
 * the wordmark settling in once the ground is down (it sits behind the hill,
 * so on scroll it sinks out of sight behind the houses). ?sky=clouds swaps the
 * sky for the original drifting clouds.
 *
 * HeroMotion adds the depth: scroll parallax between sky, wordmark and hill,
 * and a slight tilt of the scene toward the cursor. The transforms live in
 * src/app/zorzal/theme.css (.z-sky, .z-title, .z-land, .zl).
 *
 * The landscape is about three times as wide as it is tall, so on a phone it
 * is a strip along the bottom of a lot of sky. Kai is designing phone, iPad
 * and desktop framings; this is the desktop one stretched.
 */
export default function ZorzalHero() {
  return (
    <HeroMotion>
      <div className="z-sky" style={{ position: "absolute", inset: 0 }}>
        <SkySwitch />
      </div>
      <div className="z-land-stage" style={{ position: "absolute", inset: 0, zIndex: 10 }}>
        <div
          className="z-land"
          style={{ position: "absolute", left: "-5%", bottom: "-8%", width: "110%" }}
        >
          <TapestryLandscape />
        </div>
      </div>
      <div
        className="z-title"
        style={{ position: "absolute", top: "24%", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 5 }}
      >
        <h1 style={{ margin: 0, width: "clamp(200px, 34vw, 520px)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="z-wordmark" src="/case-studies/zorzal-typography.svg" alt="Zorzal" style={{ display: "block", width: "100%" }} />
        </h1>
      </div>
    </HeroMotion>
  );
}
