import HeroMotion from "./HeroMotion";
import SkySwitch from "./SkySwitch";
import TapestryLandscape from "./TapestryLandscape";
import ShootingStars from "./ShootingStars";

/**
 * The Zorzal hero: a pale daytime sky with faint stars along the top edge,
 * Kai's layered landscape pieced together from the screen edges on load, and
 * the wordmark settling in once the ground is down. The wordmark is fixed to
 * the screen, so the hill scrolls up over it, and the bottom of the hill
 * hangs over the next section. A shooting star crosses the starry band now and then.
 * ?sky=clouds swaps the sky for the original clouds.
 *
 * HeroMotion adds the depth: the sky lags behind the scroll and the hill tips back.
 * The styles live in src/app/zorzal/theme.css: .z-sky and .z-title are fixed
 * to the screen, .z-land tips back, and .z-title fades a little.
 *
 * The landscape is about three times as wide as it is tall, so on a phone it
 * is a strip along the bottom of a lot of sky. Kai is designing phone, iPad
 * and desktop framings; this is the desktop one stretched.
 */
export default function ZorzalHero() {
  return (
    <HeroMotion>
      {/* Sky and wordmark are clipped to the hero; the hill is not, so its
          bottom edge can hang over the next section. The clip has no z-index
          of its own, so the wordmark still sorts under the hill. */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: "inset(0)" }}>
        <div className="z-sky">
          <SkySwitch />
          <ShootingStars />
        </div>
        {/* The hill's ragged bottom corners show what's behind them, so the
            last few vw of the hero warm to the next section's peach. */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "8vw", background: "linear-gradient(180deg, rgba(255, 226, 206, 0), #ffe2ce)" }}
        />
        <div
          className="z-title"
          style={{ top: "24svh", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 5 }}
        >
          <h1 style={{ margin: 0, width: "clamp(200px, 34vw, 520px)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="z-wordmark" src="/case-studies/zorzal-typography.svg" alt="Zorzal" style={{ display: "block", width: "100%" }} />
          </h1>
        </div>
      </div>
      <div className="z-land-stage" style={{ position: "absolute", inset: 0, zIndex: 10 }}>
        <div
          className="z-land"
          style={{ position: "absolute", left: "-5%", bottom: "-8%", width: "110%" }}
        >
          <TapestryLandscape />
        </div>
      </div>
    </HeroMotion>
  );
}
