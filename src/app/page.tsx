import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

/**
 * Four depth planes. Perceived depth comes from the spread between rates, not
 * their size, so these are deliberately far apart: -120 / +15 / +60 / +220.
 *
 * Every plane is pure black, so a background ridge is only ever visible where
 * it clears the outline of the ridge in front. Each one therefore has to peak
 * HIGHER than the next one forward, not lower — sink them and they vanish
 * behind the foreground entirely. Visible height is `height - drop`, and since
 * height is a clamp() that shrinks on narrow viewports, drop has to stay small.
 */
const HORIZON = rangeById(10);
const FAR = rangeById(15);
const NEAR = rangeById(7);

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero
        rise={-120}
        behind={
          <>
            <RidgeLayer
              range={HORIZON}
              height="clamp(110px, 18vw, 260px)"
              rise={15}
              drop={20}
            />
            <RidgeLayer
              range={FAR}
              height="clamp(90px, 14vw, 210px)"
              rise={60}
              drop={25}
            />
          </>
        }
      />

      <MountainRange range={NEAR} height="clamp(75px, 11vw, 190px)" rise={220}>
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>
    </main>
  );
}
