/**
 * The Zorzal daytime sky: a pale blue that thins to white above the
 * landscape, with a faint band of stars along the very top edge, visible
 * even in daylight. The stars twinkle in CSS (src/app/zorzal/theme.css);
 * positions come from a fixed seed so server and client agree.
 */

const STARS = (() => {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 70 }, () => {
    const y = Math.pow(rand(), 1.6) * 52; // crowd toward the top edge
    return {
      x: rand() * 100,
      y,
      size: 1.3 + rand() * 1.9,
      // fainter the lower they sit, gone by about half an inch down
      alpha: (1 - y / 56) * (0.75 + rand() * 0.25),
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
          "linear-gradient(180deg, #b8cce0 0px, #d3e0ec 46px, #e8f0f6 22%, #f4f8fb 42%, #ffffff 68%)",
      }}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="z-star"
          style={{
            position: "absolute",
            left: `${s.x.toFixed(2)}%`,
            top: `${s.y.toFixed(1)}px`,
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
  );
}
