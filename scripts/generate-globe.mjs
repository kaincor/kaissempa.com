/**
 * Generates the globe's dot grid from real world geography.
 *
 * Runs at build time, never in the browser. dotted-map ships 729KB plus proj4
 * and turf, which is exactly the weight this component exists to avoid — but
 * it has the one thing a hand-written mask cannot give us, which is real
 * coastlines. So it is used here, once, and what ships is the answer.
 *
 * It only makes flat Mercator maps, so its grid is converted back to latitude
 * and longitude and re-projected onto a sphere. Verified against eight known
 * land and ocean points before it was trusted.
 *
 *   npm run globe
 */
import DottedMapImport from "dotted-map";
import { writeFileSync } from "node:fs";

const DottedMap = DottedMapImport.default ?? DottedMapImport;

// ---- camera -------------------------------------------------------------
const W = 760;
const H = 430;
const CX = 380;
const CY = 470;
const R = 365;
const LON0 = -75;
const TILT = (4 * Math.PI) / 180;
/** Degrees between dots at the equator. Roughly triples the count from 1.9. */
/**
 * Degrees between dots at the equator.
 *
 * Tighter than it could be while the globe still turned. Nothing rotates now,
 * so only the hemisphere facing us is ever needed and the far side — most of
 * the sphere — costs nothing. That budget goes into density instead.
 */
const SPACING = 0.95;

/**
 * How the land sits on the body, applied after projection.
 *
 * Rotating the dots and not the sphere is the point: the body is a circle, so
 * turning it would change nothing, but turning the land reads as the planet
 * being on a tilted axis. Counterclockwise on screen, where y runs downward.
 *
 * Applied here rather than at runtime so it happens before the culling — a dot
 * shifted past the frame edge should be dropped, not carried.
 */
const LAND_ROTATE = 20;
const LAND_SHIFT_X = 34;
const LAND_SHIFT_Y = 12;

/**
 * How far the planet turns on its axis across the entrance, in degrees.
 *
 * Also the culling range. A real axial rotation moves land horizontally in the
 * sphere's own frame; the 20 degree screen rotation above then turns that into
 * up-and-to-the-right, which is the direction in the sketch. That is why the
 * arrow can be drawn curved and still be honest as a straight spin — the tilt
 * is doing the bending.
 */
const SPIN = 34;

const EARTH = 6378137;
const rad = (d) => (d * Math.PI) / 180;

// ---- land, from dotted-map ----------------------------------------------
// A tall grid so the coastline is sampled finely enough to resample from.
const map = new DottedMap({ height: 200, grid: "vertical" });
const raw = map.getPoints();
const gridYMax = Math.max(...raw.map((p) => p.y));

const land = raw.map(({ x, y }) => {
  const X = map.X_MIN + (x / (map.width - 1)) * map.X_RANGE;
  const Y = map.Y_MAX - (y / gridYMax) * map.Y_RANGE;
  return {
    lon: ((X / EARTH) * 180) / Math.PI,
    lat: ((2 * Math.atan(Math.exp(Y / EARTH)) - Math.PI / 2) * 180) / Math.PI,
  };
});

/**
 * A lookup keyed to whole degrees. Resampling the source grid onto our own
 * even-spaced sphere grid means asking "is there land near here", and a
 * bucketed index answers that without scanning 15,000 points per query.
 */
const buckets = new Map();
for (const p of land) {
  const k = `${Math.round(p.lat)}|${Math.round(p.lon)}`;
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push(p);
}
const NEAR = 1.15;
function isLand(lat, lon) {
  const la = Math.round(lat);
  const lo = Math.round(lon);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (const p of buckets.get(`${la + i}|${lo + j}`) ?? []) {
        // Longitude degrees shrink towards the poles; compare on the ground.
        const dx = (p.lon - lon) * Math.cos(rad(lat));
        if (Math.hypot(dx, p.lat - lat) < NEAR) return true;
      }
    }
  }
  return false;
}

// ---- project onto the sphere --------------------------------------------
function project(lat, lon) {
  const la = rad(lat);
  const lo = rad(lon - LON0);
  const x = Math.cos(la) * Math.sin(lo);
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(lo);
  const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
  const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
  return { sx: CX + R * x, sy: CY - R * y2, depth: z2 };
}

/**
 * Unit vectors again, not screen positions.
 *
 * The land turns during the entrance, so the projection is no longer fixed and
 * cannot be precomputed. What is precomputed is everything that never changes:
 * the camera tilt is baked into these, and the screen rotation, the shift and
 * the horizon clip are four constants applied in the draw loop.
 *
 * Only land that is on the visible side at some point during the spin is kept.
 * The far side of the planet is most of the sphere and would be payload for
 * nothing.
 */
const dots = [];
for (let lat = -82; lat <= 84; lat += SPACING) {
  const lonStep = SPACING / Math.max(Math.cos(rad(lat)), 0.2);
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (!isLand(lat, lon)) continue;
    const la = rad(lat);
    const lo = rad(lon - LON0);
    const x = Math.cos(la) * Math.sin(lo);
    const y = Math.sin(la);
    const z = Math.cos(la) * Math.cos(lo);
    const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
    const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);

    // Does it ever face us, and ever land inside the horizon, during the spin?
    let keep = false;
    for (let a = 0; a <= SPIN && !keep; a += 4) {
      const t = rad(a);
      const rxu = x * Math.cos(t) + z2 * Math.sin(t);
      const rzu = -x * Math.sin(t) + z2 * Math.cos(t);
      if (rzu <= 0.04) continue;
      const px = R * rxu;
      const py = -R * y2;
      const st = rad(LAND_ROTATE);
      const sx2 = px * Math.cos(st) + py * Math.sin(st) + LAND_SHIFT_X;
      const sy2 = -px * Math.sin(st) + py * Math.cos(st) + LAND_SHIFT_Y;
      if (Math.hypot(sx2, sy2) > R - 3) continue;
      if (CY + sy2 > H + 8) continue;
      keep = true;
    }
    if (!keep) continue;

    const r3 = (v) => Math.round(v * 1000) / 1000;
    dots.push([r3(x), r3(y2), r3(z2)]);
  }
}

const out = `// Generated by scripts/generate-globe.mjs — do not edit by hand.
// Real coastlines, sampled from dotted-map's world geometry at build time.
// Re-run \`npm run globe\` after changing the camera constants in that script.
//
// Unit vectors [x, y, z] with the camera tilt baked in. A frame is a rotation
// about y — two multiplies and an add — then the fixed screen transform.
export type GlobeDot = [number, number, number];

export const GLOBE = {
  W: ${W}, H: ${H}, CX: ${CX}, CY: ${CY}, R: ${R},
  SPIN: ${SPIN}, LAND_ROTATE: ${LAND_ROTATE},
  SHIFT_X: ${LAND_SHIFT_X}, SHIFT_Y: ${LAND_SHIFT_Y},
};

export const DOTS: GlobeDot[] = ${JSON.stringify(dots)};
`;
writeFileSync("src/content/globe-dots.ts", out);
console.log(`${dots.length} dots from ${land.length} land samples → src/content/globe-dots.ts`);
