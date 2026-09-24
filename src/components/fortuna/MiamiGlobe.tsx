import GlobeFrame, { type MarkerSpec } from "./GlobeFrame";
import { DOTS, GLOBE } from "@/content/globe-dots";

/**
 * A dotted globe, built against the Hero 216 reference.
 *
 * What that image is doing, and what a first attempt misses, is that the
 * sphere is not made of the dots. There is a lit body underneath — near-white
 * in the middle, shading to grey at the rim — and the dots only mark land. The
 * oceans are where the curvature actually reads, because that is the only
 * place the body shows through unobstructed.
 *
 * The coastlines are real. They come from dotted-map's world geometry,
 * resampled onto an even sphere grid and projected by scripts/generate-globe,
 * so none of that library reaches the browser: 29,318 land samples go in at
 * build time and 953 positions come out.
 *
 * A server component, deliberately. It holds the dot array, so keeping it off
 * the client means the positions ship once, as markup, instead of twice.
 */

const { W, H, CX, CY, R, LON0, TILT } = GLOBE;

function project(lat: number, lon: number) {
  const la = (lat * Math.PI) / 180;
  const lo = ((lon - LON0) * Math.PI) / 180;
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(lo);
  return {
    x: CX + R * (Math.cos(la) * Math.sin(lo)),
    y: CY - R * (y * Math.cos(TILT) - z * Math.sin(TILT)),
  };
}

const PLACES = [
  { lat: 25.76, lon: -80.19, label: "Miami, Florida", delay: 0.45 },
  { lat: 19.43, lon: -99.13, label: "Mexico City", delay: 0.6 },
];

const MARKERS: MarkerSpec[] = PLACES.map((p) => ({
  ...project(p.lat, p.lon),
  delay: p.delay,
  label: p.label,
}));

export default function MiamiGlobe() {
  return (
    <GlobeFrame markers={MARKERS} width={W} height={H}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <defs>
          {/* Lit from the upper left, and never pure white — on cream that
              reads as a hole in the page rather than a lit sphere. */}
          <radialGradient id="fg-body" cx="36%" cy="28%" r="76%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="58%" stopColor="#fbf9f4" />
            <stop offset="100%" stopColor="#e9e7e1" />
          </radialGradient>

          {/* Contact shadow at the rim. Without it the body has no edge and
              the whole thing flattens into a pale disc. */}
          <radialGradient id="fg-rim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#32443e" stopOpacity="0" />
            <stop offset="84%" stopColor="#32443e" stopOpacity="0" />
            <stop offset="93%" stopColor="#32443e" stopOpacity="0.045" />
            <stop offset="100%" stopColor="#32443e" stopOpacity="0.13" />
          </radialGradient>

          {/* The reference is cut by the viewport. Mid-page a hard line reads
              as a clipping bug, so the last few per cent dissolve instead. */}
          <linearGradient id="fg-cut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="93%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="fg-cut-mask">
            <rect width={W} height={H} fill="url(#fg-cut)" />
          </mask>
        </defs>

        <g mask="url(#fg-cut-mask)">
          <circle cx={CX} cy={CY} r={R} fill="url(#fg-body)" />
          <circle cx={CX} cy={CY} r={R} fill="url(#fg-rim)" />
          <g fill="#404443">
            {DOTS.map(([x, y, r, o], i) => (
              <circle key={i} cx={x} cy={y} r={r} fillOpacity={o} />
            ))}
          </g>
        </g>
      </svg>
    </GlobeFrame>
  );
}
