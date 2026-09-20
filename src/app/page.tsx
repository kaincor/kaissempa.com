import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

/**
 * Four depth planes. Perceived depth comes from the spread between rates, not
 * their size, so these are deliberately far apart: -120 / +15 / +60 / +220.
 */
const HORIZON = rangeById(10);
const FAR = rangeById(1);
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
              height="clamp(38px, 5vw, 90px)"
              rise={15}
              drop={74}
            />
            <RidgeLayer
              range={FAR}
              height="clamp(55px, 8vw, 150px)"
              rise={60}
              drop={56}
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
