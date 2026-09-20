import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

const FAR = rangeById(1);
const NEAR = rangeById(7);

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero
        // Sinks as the reader scrolls down, so the ridges climb past it.
        rise={-60}
        behind={
          // Slower and sunk further than the foreground ridge, which is what
          // sells it as distant. It shows through the transparent 3D canvas
          // and is occluded wherever the rock covers it.
          <RidgeLayer
            range={FAR}
            height="clamp(55px, 8vw, 150px)"
            rise={40}
            drop={34}
          />
        }
      />

      <MountainRange range={NEAR} height="clamp(75px, 11vw, 190px)" rise={150}>
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>
    </main>
  );
}
