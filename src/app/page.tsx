import Hero from "@/components/Hero";
import MountainRange from "@/components/MountainRange";
import RidgeLayer from "@/components/RidgeLayer";
import { rangeById } from "@/data/mountainRanges";

const FAR = rangeById(7);
const NEAR = rangeById(1);

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero
        behind={
          // Shorter and slower than the foreground ridge, which is what sells
          // it as distant. It shows through the transparent 3D canvas and is
          // occluded wherever the rock covers it.
          <RidgeLayer range={FAR} height="clamp(60px, 9vw, 160px)" rise={45} />
        }
      />

      <MountainRange range={NEAR} height="clamp(70px, 10vw, 180px)" rise={140}>
        <div style={{ minHeight: "70vh" }} />
      </MountainRange>
    </main>
  );
}
