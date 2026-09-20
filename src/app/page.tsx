import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
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
      >
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>
    </main>
  );
}
