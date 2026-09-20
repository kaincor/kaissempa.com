import MountainParallax, { Ridge } from "@/components/MountainParallax";

export const metadata = {
  title: "Parallax",
  robots: { index: false, follow: false },
};

// Placeholder ridges, back to front. Real exported SVGs drop in here unchanged.
const RIDGES = [
  { points: "0,320 0,140 220,60 470,170 700,90 980,180 1230,80 1440,160 1440,320", speed: 0.12, tone: 0.25, h: 300 },
  { points: "0,320 0,200 260,110 520,210 760,140 1040,230 1290,150 1440,210 1440,320", speed: 0.35, tone: 0.45, h: 280 },
  { points: "0,320 0,250 300,170 600,260 900,190 1180,265 1440,205 1440,320", speed: 0.62, tone: 0.7, h: 250 },
  { points: "0,320 0,290 240,230 540,300 840,245 1140,305 1440,255 1440,320", speed: 1, tone: 1, h: 210 },
];

export default function ParallaxLab() {
  return (
    <main className="flex-1">
      <section className="flex h-[70vh] items-center px-8 sm:px-16">
        <h1 className="display text-5xl sm:text-7xl">Scroll down</h1>
      </section>

      <MountainParallax
        height="170vh"
        travel={340}
        layers={RIDGES.map((r) => ({
          speed: r.speed,
          content: (
            <div style={{ color: "#232323" }}>
              <Ridge points={r.points} opacity={r.tone} height={r.h} />
            </div>
          ),
        }))}
      />

      <section className="flex h-[70vh] items-center px-8 sm:px-16">
        <p className="display text-3xl">Keep going</p>
      </section>
    </main>
  );
}
