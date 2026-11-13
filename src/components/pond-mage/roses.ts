/**
 * Kai's roses, and the crayon that draws the title, replayed stroke by stroke.
 *
 * The drawing is Kai's own (Figma, "Font with Roses Drawing"). Every petal,
 * centre and leaf in it is a scatter-brush stroke: one crayon stamp repeated
 * along his pen path, in the order he drew it. public/pond-mage/roses.json
 * keeps exactly that: the stamp's outline once, and for each stroke the
 * centre, size and turn of every stamp along it, in drawing order. Painting
 * the stamps in that order is the pen going round again.
 *
 * Drawn on canvas, from the vector outline, at the screen's pixel density, so
 * it is as sharp as the SVG at any size; 4,700 SVG <use> elements would be
 * far heavier to keep in the page. Each frame only paints the stamps the pen
 * has reached since the last one.
 */

export type Stamp = [x: number, y: number, scale: number, deg: number];
type Stroke = { c: string; p: Stamp[] };
export type Cluster = {
  center: [number, number];
  size: [number, number];
  roses: Stroke[];
  leaves: Stroke[];
};
export type RosesData = {
  stamp: { d: string; cx: number; cy: number; w: number };
  clusters: Record<string, Cluster>;
  title: {
    w: number;
    h: number;
    letters: { box: [number, number, number, number]; p: Stamp[] }[];
    roses: { c: string; x: number; y: number; k: number }[];
  };
};

let loading: Promise<RosesData> | null = null;
let stampPath: Path2D | null = null;

export function loadRoses(): Promise<RosesData> {
  loading ??= fetch("/pond-mage/roses.json").then((r) => r.json() as Promise<RosesData>);
  return loading;
}

function stamp(data: RosesData) {
  stampPath ??= new Path2D(data.stamp.d);
  return stampPath;
}

/**
 * Paints stamps [from, to) of a stroke. `base` maps drawing units to canvas
 * pixels: [scale, offsetX, offsetY].
 */
export function paint(
  ctx: CanvasRenderingContext2D,
  data: RosesData,
  pts: Stamp[],
  from: number,
  to: number,
  base: [number, number, number],
  color: string,
  mirror = false,
) {
  const path = stamp(data);
  const { cx, cy } = data.stamp;
  const [k, ox, oy] = base;
  const m = mirror ? -1 : 1;
  ctx.fillStyle = color;
  for (let i = from; i < to; i++) {
    const [x, y, s, deg] = pts[i];
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a) * s;
    const sn = Math.sin(a) * s;
    // translate(x, y) · rotate · scale · translate(-centre), in drawing units;
    // mirrored across the cluster's centre line by flipping x, then scaled
    // and offset onto the canvas.
    const A = c, B = sn, C = -sn, D = c;
    const E = x - (c * cx - sn * cy);
    const F = y - (sn * cx + c * cy);
    ctx.setTransform(m * A * k, B * k, m * C * k, D * k, m * E * k + ox, F * k + oy);
    ctx.fill(path);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** One stroke's place in the drawing's timeline, in seconds. */
export type Timed = { stroke: Stroke; start: number; dur: number; leaf: boolean };

/**
 * When each stroke of a rose is drawn. The roses in Kai's paint order (the
 * dark base, then the lighter orange, then the dark centres), each starting
 * as the one before is most of the way round; then the leaves behind. A
 * stroke takes as long as its length, the pen moving at one steady pace,
 * within limits so a centre dot still registers and a long petal does not
 * drag.
 */
export function schedule(cluster: Cluster, speed = 1): { strokes: Timed[]; end: number } {
  const dur = (n: number) => Math.min(0.75, Math.max(0.16, n / 520)) / speed;
  const strokes: Timed[] = [];
  let t = 0;
  for (const s of cluster.roses) {
    const d = dur(s.p.length);
    strokes.push({ stroke: s, start: t, dur: d, leaf: false });
    t += d * 0.6;
  }
  let end = t;
  for (const s of strokes) end = Math.max(end, s.start + s.dur);
  let lt = end - 0.15 / speed;
  for (const s of cluster.leaves) {
    const d = dur(s.p.length) * 0.9;
    strokes.push({ stroke: s, start: lt, dur: d, leaf: true });
    lt += d * 0.45;
    end = Math.max(end, lt + d * 0.55);
  }
  return { strokes, end };
}

/** How far along its stroke the pen is: quick off the mark, easing at the end. */
export function reach(t: number, s: Timed) {
  const f = Math.min(1, Math.max(0, (t - s.start) / s.dur));
  return Math.round((1 - (1 - f) * (1 - f) * 0.35 - 0.65 * (1 - f)) * s.stroke.p.length);
}
