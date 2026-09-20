import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

/**
 * Two depth planes around the transparent Spline scene.
 *
 * Both planes are pure black, so the back ridge is only ever visible where it
 * clears the outline of the front one. It therefore has to stand TALLER on
 * screen than the ridge in front, not shorter — sink it and it disappears
 * behind the foreground entirely. Visible height is `height - drop`, and since
 * height is a clamp() that shrinks on narrow viewports, `drop` stays small.
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
            drop={16}
          />
        }
      />

      <MountainRange range={FRONT} height="clamp(75px, 11vw, 190px)" rise={180}>
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>
    </main>
  );
}
