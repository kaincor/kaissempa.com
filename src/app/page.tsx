import About from "@/components/About";
import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeDivider from "@/components/RidgeDivider";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

/**
 * Two depth planes around the transparent Spline scene.
 *
 * `drop` is negative on both, which lifts each baseline ABOVE the fold. That
 * matters: every range tapers to roughly zero height at x=0 and x=640, so with
 * the baseline sitting below the fold the bottom corners of the screen carry no
 * black at all and the ridge looks like it stops short of the edges. Lifting it
 * puts the solid fill under the whole width.
 *
 * Both planes are pure black, so the back ridge only shows where it clears the
 * front one's outline. It gets the taller clamp of the two despite being the
 * more distant layer — sink it and it vanishes behind the foreground.
 *
 * Depth reads from the gap between the rates, not their size: 45 against 180.
 */
const BACK = rangeById(15);
const FRONT = rangeById(4);
/** Flipped, so its peaks hang down out of the black section. */
const CLOSING = rangeById(13);

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero
        behind={
          <RidgeLayer
            range={BACK}
            height="clamp(105px, 16vw, 240px)"
            rise={45}
            drop={-10}
          />
        }
      />

      <MountainRange
        range={FRONT}
        height="clamp(75px, 11vw, 190px)"
        rise={180}
        drop={-24}
        // The divider below extends black upward behind itself, so the default
        // reserve here would only add dead space above the ridge.
        padBottom={0}
      >
        <About />
      </MountainRange>

      {/* padBottom 0 + pullUp 180 sits this block flush against the bottom of
          the black section. MountainRange's lift is saturated at -rise by the
          time this is on screen, so a constant 180 cancels it.

          It must meet that edge and never cross it: pulled over the black
          section, the ridge's notches show black from behind instead of the
          page grey, and the silhouette vanishes into a straight line.

          rise is 70, not the 180 above. Both blocks parallax, so the gap is the
          difference of two transforms; at 180 it swung by that much. */}
      <RidgeDivider range={CLOSING} rise={70} pullUp={180}>
        <div style={{ minHeight: "80vh" }} />
      </RidgeDivider>
    </main>
  );
}
