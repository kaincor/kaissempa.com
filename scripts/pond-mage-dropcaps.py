"""Illuminated drop caps in the style of Kai's A: a Kaisteel capital on a
rough black block, the room around it packed with olive leaves, red pebbles
and flowers, each kept a black gap from the letter and from each other.

    python3 scripts/pond-mage-dropcaps.py "assets/Case Studies/Pond Mage/Kaisteel-Regular.otf" [LETTERS]

writes caps.json ({letter: {block, letter, shapes}}), which was folded into
src/content/pond-mage-dropcaps.json beside Kai's own A (ground = block,
art = shapes, coordinates rounded to whole units)."""
import json, math, random, sys
import numpy as np
from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

VW, VH = 195, 203
RX0, RY0, RX1, RY1 = 6, 10, 186, 196  # the block, as in Kai's A
K = 3  # raster px per unit
W, H = VW * K, VH * K
HALO = 4.0
GAP = 2.0
INSET = 4.2

font = TTFont(sys.argv[1] if len(sys.argv) > 1 else "k.otf")
gs = font.getGlyphSet()
cmap = font.getBestCmap()


class Flat(BasePen):
    def __init__(self, gs):
        super().__init__(gs)
        self.contours, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, a, b, c):
        p0 = self.cur[-1]
        for i in range(1, 17):
            t = i / 16
            mt = 1 - t
            self.cur.append(tuple(mt**3 * p0[k] + 3 * mt * mt * t * a[k] + 3 * mt * t * t * b[k] + t**3 * c[k] for k in (0, 1)))

    def _closePath(self):
        self.contours.append(self.cur)
        self.cur = []

    _endPath = _closePath


def raster_polys(polys, fill_rule="nonzero"):
    acc = np.zeros((H, W), np.int16)
    for poly in polys:
        if len(poly) < 3:
            continue
        im = Image.new("L", (W, H), 0)
        ImageDraw.Draw(im).polygon([(x * K, y * K) for x, y in poly], fill=1)
        m = np.asarray(im, np.int16)
        a = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly)))
        acc += m if a > 0 else -m
    return acc != 0


def one(poly):
    im = Image.new("L", (W, H), 0)
    ImageDraw.Draw(im).polygon([(x * K, y * K) for x, y in poly], fill=1)
    return np.asarray(im, bool)


def dist(free):
    """Approximate Euclidean distance (units) inside `free` to the nearest blocked px."""
    d = np.zeros(free.shape, np.float32)
    cur = free.copy()
    i = 0
    while cur.any():
        i += 1
        d[cur] = i
        p = np.pad(cur, 1, constant_values=False)
        n = p[1:-1, :-2] & p[1:-1, 2:] & p[:-2, 1:-1] & p[2:, 1:-1]
        if i % 3 != 0:  # octagonal: mostly 8-neighbour
            n &= p[:-2, :-2] & p[:-2, 2:] & p[2:, :-2] & p[2:, 2:]
        cur = n
        if i > 400:
            break
    return d / K * 0.94


def dilate(m, r):
    """m grown by r units."""
    free = ~m
    return ~(dist(free) > r) if r > 0 else m


def smooth_path(pts):
    n = len(pts)
    out = [f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    return "".join(out) + "Z"


def blob(cx, cy, a, b, ang, rnd, wob=0.07, n=14):
    ph = [rnd.uniform(0, 6.3) for _ in range(3)]
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        w = 1 + wob * (math.sin(2 * t + ph[0]) + 0.6 * math.sin(3 * t + ph[1]) + 0.4 * math.sin(5 * t + ph[2]))
        x, y = a * math.cos(t) * w, b * math.sin(t) * w
        pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
    return pts


def leaf(cx, cy, a, b, ang, rnd, n=16):
    """A pointed leaf: full in the middle, tapering to tips."""
    ph = rnd.uniform(0, 6.3)
    bend = rnd.uniform(-0.18, 0.18) * b
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = a * math.cos(t)
        prof = abs(math.sin(t)) ** 0.75
        y = b * prof * (1 if math.sin(t) >= 0 else -1) * (1 + 0.06 * math.sin(3 * t + ph))
        y += bend * (1 - (x / a) ** 2)
        pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
    return pts


def rough_block(rnd):
    pts = []
    corners = [(RX0, RY0), (RX1, RY0), (RX1, RY1), (RX0, RY1)]
    for i in range(4):
        (x0, y0), (x1, y1) = corners[i], corners[(i + 1) % 4]
        L = math.hypot(x1 - x0, y1 - y0)
        nx, ny = (y1 - y0) / L, -(x1 - x0) / L  # outward
        m = 14
        for j in range(m):
            t = j / m
            r = 2.2 + rnd.uniform(-0.9, 0.9)
            if j == 0:
                r = 0.6  # rounded corners pull in
            pts.append((x0 + (x1 - x0) * t + nx * r, y0 + (y1 - y0) * t + ny * r))
    return pts


def letter(ch):
    g = cmap[ord(ch)]
    fl = Flat(gs)
    gs[g].draw(fl)
    xs = [p[0] for c in fl.contours for p in c]
    ys = [p[1] for c in fl.contours for p in c]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    gw, gh = x1 - x0, y1 - y0
    s = min(176 / gh, 150 / gw)
    cx, cy = (RX0 + RX1) / 2 + 0.5, (RY0 + RY1) / 2 - 1
    # font y-up -> svg y-down
    tx = cx - (x0 + gw / 2) * s
    ty = cy + (y0 + gh / 2) * s
    T = (s, 0, 0, -s, tx, ty)
    sp = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    gs[g].draw(TransformPen(sp, T))
    polys = [[(tx + x * s, ty - y * s) for x, y in c] for c in fl.contours]
    return sp.getCommands(), polys


def make(ch, seed):
    rnd = random.Random(seed)
    d_letter, polys = letter(ch)
    L = raster_polys(polys)
    yy, xx = np.mgrid[0:H, 0:W] / K
    inner = (xx > RX0 + INSET) & (xx < RX1 - INSET) & (yy > RY0 + INSET) & (yy < RY1 - INSET)
    blocked = dilate(L, HALO) | ~inner
    shapes = []  # (kind, colour, path)

    def place(poly, colour, kind="blob"):
        nonlocal blocked
        m = one(poly)
        if (m & blocked).sum() > 2:
            return False
        shapes.append((kind, colour, smooth_path(poly)))
        blocked = blocked | dilate(m, GAP)
        return True

    def at(D, px, py):
        ix, iy = int(px * K), int(py * K)
        if not (0 <= ix < W and 0 <= iy < H):
            return 0.0
        return float(D[iy, ix])

    def flower(cx, cy, r, rosette):
        nonlocal blocked
        if rosette:
            pr = r * 0.42
            a0 = rnd.uniform(0, 6.3)
            for k in range(5):
                t = a0 + k * 2 * math.pi / 5
                shapes.append(("petal", "red", smooth_path(blob(cx + math.cos(t) * r * 0.56, cy + math.sin(t) * r * 0.56, pr, pr * 0.9, t, rnd, 0.05, 10))))
            shapes.append(("heart", "dark", smooth_path(blob(cx, cy, r * 0.2, r * 0.2, 0, rnd, 0.05, 8))))
        else:
            shapes.append(("bloom", "red", smooth_path(blob(cx, cy, r * 0.95, r * 0.9, rnd.uniform(0, 3), rnd, 0.05, 16))))
            shapes.append(("bloom-in", "dark", smooth_path(blob(cx, cy, r * 0.6, r * 0.56, rnd.uniform(0, 3), rnd, 0.06, 12))))
            shapes.append(("bloom-heart", "red", smooth_path(blob(cx + r * 0.05, cy - r * 0.05, r * 0.27, r * 0.25, 0, rnd, 0.08, 8))))
        blocked = blocked | dilate(one(blob(cx, cy, r, r, 0, rnd, 0, 20)), GAP)

    def ribbon(pts, ws):
        left, right = [], []
        n = len(pts)
        for i, (x, y) in enumerate(pts):
            x0, y0 = pts[max(i - 1, 0)]
            x1, y1 = pts[min(i + 1, n - 1)]
            L = math.hypot(x1 - x0, y1 - y0) or 1
            nx, ny = -(y1 - y0) / L, (x1 - x0) / L
            ww = ws[i] / 2 * (1 + rnd.uniform(-0.08, 0.08)) * (0.75 if i == n - 1 else 1)
            left.append((x + nx * ww, y + ny * ww))
            right.append((x - nx * ww, y - ny * ww))
        return left + right[::-1]

    def leaf_at(bx, by, ang, a, b, colour="leaf"):
        for shrink in (1, 0.85, 0.7, 0.58, 0.48):
            aa, bb = a * shrink, b * max(shrink, 0.6)
            cx, cy = bx + math.cos(ang) * (aa + 0.4), by + math.sin(ang) * (aa + 0.4)
            if place(leaf(cx, cy, aa, bb, ang, rnd), colour):
                return True
        return False

    # Vines first: they grow up from the foot of the block, through the
    # widest room, a leaf off them every so often, a flower where they end.
    SW = 6.4
    D = dist(~blocked)
    seeds = []
    row = RY1 - INSET - 4
    cand = sorted(((at(D, x / 2, row), x / 2) for x in range(2 * (RX0 + 8), 2 * (RX1 - 8))), reverse=True)
    for d, x in cand:
        if d < 3.4:
            break
        if all(abs(x - sx) > 30 for sx in seeds):
            seeds.append(x)
        if len(seeds) >= 3:
            break
    for sx in seeds:
        D = dist(~blocked)
        p = (sx, row)
        th = -math.pi / 2
        pts = [p]
        length = 0
        ph = rnd.uniform(0, 6.3)
        while length < 150:
            best = None
            for dd in range(-24, 25, 6):
                t = th + math.radians(dd)
                q = (p[0] + 1.6 * math.cos(t), p[1] + 1.6 * math.sin(t))
                ahead = at(D, p[0] + 5 * math.cos(t), p[1] + 5 * math.sin(t))
                here = at(D, *q)
                if here < 2.3:
                    continue
                score = min(ahead, 6) - 0.02 * abs(dd) - 3.2 * math.sin(t)
                if best is None or score > best[0]:
                    best = (score, t, q)
            if best is None:
                break
            _, t, q = best
            th = t + 0.05 * math.sin(length / 14 + ph)
            # never turn back on itself
            if math.sin(th) > 0.35:
                break
            p = q
            pts.append(p)
            length += 1.6
        if length < 14 or row - min(q[1] for q in pts) < 0.55 * length:
            continue
        pts = pts[::2] if len(pts) > 6 else pts
        ws = [max(3.4, min(SW, at(D, *q) * 0.95)) for q in pts]
        ws = [sum(ws[max(0, j - 2) : j + 3]) / len(ws[max(0, j - 2) : j + 3]) for j in range(len(ws))]
        ws = [min(w, 2 * (at(D, *q) - 0.4)) for w, q in zip(ws, pts)]
        rib = ribbon(pts, ws)
        m = one(rib)
        shapes.append(("stem", "leaf", smooth_path(rib)))
        stem_halo = dilate(m, GAP)
        # leaves along it, alternating sides
        side = rnd.choice((1, -1))
        acc = 7 + rnd.uniform(0, 4)
        for i in range(1, len(pts) - 1):
            seg = math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
            acc -= seg
            if acc > 0:
                continue
            hx, hy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
            hd = math.atan2(hy, hx)
            ang = hd + side * math.radians(rnd.uniform(38, 58))
            bx, by = pts[i][0] + math.cos(hd + side * math.pi / 2) * (ws[i] / 2 - 0.6), pts[i][1] + math.sin(hd + side * math.pi / 2) * (ws[i] / 2 - 0.6)
            if leaf_at(bx, by, ang, rnd.uniform(10, 14), rnd.uniform(4.4, 5.6)):
                side = -side
            acc = 10 + rnd.uniform(0, 5)
        blocked = blocked | stem_halo
        # a flower at the tip, if there is room
        D = dist(~blocked)
        tx, ty = pts[-1]
        hd = math.atan2(pts[-1][1] - pts[-2][1], pts[-1][0] - pts[-2][0])
        best = None
        for s in (3, 5, 7, 9, 11):
            fx, fy = tx + s * math.cos(hd), ty + s * math.sin(hd)
            d = at(D, fx, fy)
            if best is None or d > best[0]:
                best = (d, fx, fy)
        if best and best[0] >= 5.5:
            flower(best[1], best[2], min(best[0] - 0.8, 11), rnd.random() < 0.5)
        else:
            leaf_at(tx, ty, hd, 5, 2.3)

    # Flowers in the roomiest spots left, such as the counters.
    D = dist(~blocked)
    flowers = 0
    while flowers < 2:
        i = int(np.argmax(D))
        y, x = divmod(i, W)
        d = float(D[y, x])
        if d < 9:
            break
        flower(x / K, y / K, min(d - 1.2, 16), rnd.random() < 0.65)
        flowers += 1
        D = dist(~blocked)

    # Red pebbles hugging the head and foot of the block.
    band = ((yy < RY0 + 24) | (yy > RY1 - 20))
    D = dist(~blocked)
    for _ in range(40):
        Db = np.where(band, D, 0)
        i = int(np.argmax(Db))
        y, x = divmod(i, W)
        d = float(Db[y, x])
        if d < 3.2:
            break
        cx, cy = x / K, y / K
        b = min(d * 0.9, 6.5)
        reach = []
        for sgn in (1, -1):
            s_ = 0.0
            while s_ < 20 and at(D, cx + sgn * (s_ + 0.5), cy) >= b * 0.8:
                s_ += 0.5
            reach.append(s_)
        a = max(b * 1.1, min(sum(reach) / 2, b * 2.6))
        cx += (reach[0] - reach[1]) / 2
        ok = False
        for shrink in (1, 0.85, 0.7):
            if place(blob(cx, cy, a * shrink, b * shrink, rnd.uniform(-0.15, 0.15), rnd, 0.1, 14), (rnd.choice(["red", "dark", "leaf"]) if cy < RY0 + 24 else rnd.choice(["red", "red", "dark"]))):
                ok = True
                break
        if not ok:
            blocked[max(y - 3, 0) : y + 4, max(x - 3, 0) : x + 4] = True
        D = dist(~blocked)

    # Then whatever room is left: small flowers where it is wide, leaves
    # lying along it where it is narrow, a few seeds.
    tries = 0
    nfl = sum(1 for k, _, _ in shapes if k in ("heart", "bloom-heart"))
    while tries < 300:
        tries += 1
        i = int(np.argmax(D))
        y, x = divmod(i, W)
        d = float(D[y, x])
        if d < 2.0:
            break
        cx, cy = x / K, y / K
        if d >= 7.5 and nfl < 4:
            flower(cx, cy, min(d - 0.6, 12), rnd.random() < 0.55)
            nfl += 1
            D = dist(~blocked)
            continue
        y0, y1 = max(y - 4, 0), min(y + 4, H - 1)
        x0, x1 = max(x - 4, 0), min(x + 4, W - 1)
        gx = float(D[y, x1] - D[y, x0])
        gy = float(D[y1, x] - D[y0, x])
        ang = math.atan2(gy, gx) + math.pi / 2 if (gx or gy) else rnd.uniform(0, 3.14)
        b = min(d * 0.9, 6.2)
        reach = []
        for sgn in (1, -1):
            s_ = 0.0
            while s_ < 22:
                s_ += 0.5
                if at(D, cx + sgn * s_ * math.cos(ang), cy + sgn * s_ * math.sin(ang)) < b * 0.6:
                    break
            reach.append(s_)
        a = min(sum(reach) / 2, b * 3.4, 15)
        off = (reach[0] - reach[1]) / 2
        cx, cy = cx + off * math.cos(ang), cy + off * math.sin(ang)
        ok = False
        if a < b * 1.6:
            # no length to it: a seed
            if d >= 2.6 and rnd.random() < 0.5:
                ok = place(blob(cx, cy, min(b, 2.6), min(b, 2.6) * 0.9, 0, rnd, 0.06, 10), "leaf")
            if not ok:
                blocked = blocked | dilate(one(blob(cx, cy, d, d, 0, rnd, 0, 12)), 0.5)
                D = dist(~blocked)
                continue
        else:
            for shrink in (1, 0.85, 0.72):
                if place(leaf(cx, cy, a * shrink, b * max(shrink, 0.85), ang, rnd), "leaf"):
                    ok = True
                    break
        if not ok:
            blocked[max(y - 2, 0) : y + 3, max(x - 2, 0) : x + 3] = True
        D = dist(~blocked)

    return {
        "block": smooth_path(rough_block(rnd)),
        "letter": d_letter,
        "shapes": [[c, p] for _, c, p in shapes],
    }


if __name__ == "__main__":
    letters = sys.argv[2] if len(sys.argv) > 2 else "BCDEFGHIJKLMNOPQRSTUVWXYZ"
    out = {}
    for i, ch in enumerate(letters):
        out[ch] = make(ch, 1000 + ord(ch))
        print(ch, len(out[ch]["shapes"]), flush=True)
    json.dump(out, open("caps.json", "w"))
