/**
 * The Zorzal daytime sky: a pale blue that thins to white above the
 * landscape, with a band of faint stars across the top whose lower edge arcs
 * like the hill Zorzal sits on (Kai's "Curve Guideline"): high in the middle,
 * dropping and flattening out toward both sides.
 *
 * The band is an SVG stretched to the hero, its edge feathered with a blur so
 * it reads as sky rather than a shape. Stars are placed under the same curve
 * and fade as they near it. They twinkle in CSS (src/app/zorzal/theme.css);
 * positions come from a fixed seed so server and client agree.
 */

/** Height of the band's edge at x (0–1), as a fraction of the hero. */
const EDGE_CENTRE = 0.05;
const EDGE_SIDES = 0.21;
const WIDTH = 0.24; // how broad the crest is
function edge(x: number) {
  const g = Math.exp(-(((x - 0.5) / WIDTH) ** 2));
  return EDGE_SIDES - (EDGE_SIDES - EDGE_CENTRE) * g;
}

// The band's outline in a 1000 × 1000 box, stretched to the hero.
const BAND_PATH = (() => {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const x = i / 40;
    return `${(x * 1000).toFixed(1)},${(edge(x) * 1000).toFixed(1)}`;
  });
  return `M0,0 L1000,0 L${pts.reverse().join(" L")} Z`;
})();

const STARS = (() => {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 90 }, () => {
    const x = rand();
    const depth = Math.pow(rand(), 1.4); // crowd toward the top
    const y = depth * edge(x) * 0.88;
    return {
      x: x * 100,
      y: y * 100,
      size: 1.2 + rand() * 1.9,
      alpha: (1 - depth * 0.85) * (0.7 + rand() * 0.3),
      dur: 2.4 + rand() * 3.2,
      delay: -rand() * 6,
    };
  });
})();

export default function DaySky() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, #dfe8f1 0%, #e9f0f6 20%, #f4f8fb 42%, #ffffff 68%)",
      }}
    >
      {/* The band and its stars share a box sized off the width, capped at
          the hero, so the arc keeps the hill's proportions on a tall phone
          instead of stretching into a narrow cone. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "min(100%, 62.5vw)",
        }}
      >
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id="z-band" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#b6cadf" />
              <stop offset="1" stopColor="#d4e0ec" />
            </linearGradient>
            <filter
              id="z-band-soft"
              x="-5%"
              y="-20%"
              width="110%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="0 14" />
            </filter>
          </defs>
          <path d={BAND_PATH} fill="url(#z-band)" filter="url(#z-band-soft)" />
        </svg>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="z-star"
            style={{
              position: "absolute",
              left: `${s.x.toFixed(2)}%`,
              top: `${s.y.toFixed(2)}%`,
              width: s.size.toFixed(2) + "px",
              height: s.size.toFixed(2) + "px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 3px rgba(255, 255, 255, 0.9)",
              ["--a" as string]: s.alpha.toFixed(2),
              animationDuration: `${s.dur.toFixed(2)}s`,
              animationDelay: `${s.delay.toFixed(2)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
