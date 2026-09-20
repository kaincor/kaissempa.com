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
            {/* Furthest plane. Barely moves, sits low, and is tinted rather
                than black — atmospheric haze is a stronger distance cue than
                motion alone, and every layer being pure #000 flattens them
                into one plane no matter how differently they travel. */}
            <RidgeLayer
              range={HORIZON}
              height="clamp(38px, 5vw, 90px)"
              rise={15}
              drop={52}
              color="#6f6f6f"
            />
            <RidgeLayer
              range={FAR}
              height="clamp(55px, 8vw, 150px)"
              rise={60}
              drop={34}
              color="#2e2e2e"
            />
          </>
        }
      />

      {/* Foreground stays pure black so it reads as one shape with the section
          it carries. */}
      <MountainRange range={NEAR} height="clamp(75px, 11vw, 190px)" rise={220}>
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>
    </main>
  );
}
