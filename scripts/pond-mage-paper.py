"""
Kai's Lake Lagunita photos, printed on sheets of handmade paper, for the
Pond Mage case study (PaperDeal.tsx deals them out).

The paper is generated, not photographed: warm off-white pulp with a little
mottling and grain, tan and grey fibres matted through it, a few long red
threads, and dark specks. It is matched by eye to Kai's references in
assets/Case Studies/Pond Mage (the long-numbered sheet, Green merino wool,
Vinko Visuals), which are not used directly: two of them are stock.

Edges: three of each sheet's sides are softly furrowed, wandering a few
pixels in and out with a fine ragged fringe (the merino sheet); one is torn,
a wide fibrous deckle with threads pulled out past it (the top left of the
Vinko sheet). Each sheet also gets a cut notch or two, a small tear, and a
faint fold or two across it.

The photo is printed into the paper rather than laid on it: its blacks lift
to the paper's tone, it takes on the paper's colour where it is light, and
the paper's fibres and folds run through it.

    python3 scripts/pond-mage-paper.py

Writes public/pond-mage/lagunita/paper-<name>.webp (with alpha) and prints
each sheet's size.
"""

import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = "public/pond-mage/lagunita/{}.jpg"
OUT = "public/pond-mage/lagunita/paper-{}.webp"
# The long side of each sheet, px (it shows at up to about half that).
LONG = 1200
# Which side tears, per photo, for variety.
PHOTOS = [("2861", "left"), ("5888", "top"), ("6383", "right"), ("0456", "top")]

PULP = np.array([226, 219, 202], np.float32) / 255


def smooth_noise(h, w, cell, rng):
    """Value noise: a small random grid, upsampled smooth."""
    gh, gw = max(2, h // cell + 2), max(2, w // cell + 2)
    g = Image.fromarray((rng.random((gh, gw)) * 255).astype(np.uint8))
    g = g.resize((w + cell * 2, h + cell * 2), Image.BICUBIC)
    return np.asarray(g, np.float32)[cell : cell + h, cell : cell + w] / 255 * 2 - 1


def noise1d(n, cell, rng):
    k = max(2, n // cell + 3)
    pts = rng.random(k) * 2 - 1
    x = np.linspace(0, k - 3, n)
    i = np.floor(x).astype(int)
    t = x - i
    t = t * t * (3 - 2 * t)
    return pts[i] * (1 - t) + pts[i + 1] * t


def paper(w, h, rng):
    """The sheet's colour, before edges: pulp, mottling, grain, fibres, specks."""
    rgb = np.ones((h, w, 3), np.float32) * PULP
    mottle = smooth_noise(h, w, 110, rng) * 0.04 + smooth_noise(h, w, 30, rng) * 0.03 + smooth_noise(h, w, 8, rng) * 0.02
    grain = (rng.random((h, w)) * 2 - 1) * 0.05
    grain = np.asarray(
        Image.fromarray(((grain + 0.5) * 255).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)),
        np.float32,
    ) / 255 - 0.5
    rgb *= (1 + mottle + grain * 0.9)[..., None]

    # Fibres, drawn at twice the size and brought down, so they are fine and
    # smooth. Mostly tan and grey, some lighter than the pulp, a few red.
    S = 2
    layer = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    area = (w * h) / (1200 * 900)

    def fibre(colour, alpha, length, width, curl):
        x, y = rng.random() * w * S, rng.random() * h * S
        a = rng.random() * math.tau
        pts = [(x, y)]
        steps = max(3, int(length / 6))
        for _ in range(steps):
            a += (rng.random() - 0.5) * curl
            x += math.cos(a) * 6 * S
            y += math.sin(a) * 6 * S
            pts.append((x, y))
        d.line(pts, fill=(*colour, int(alpha * 255)), width=max(1, int(width * S)), joint="curve")

    # The pulp's own matted fibre: many, short, faint.
    for _ in range(int(9000 * area)):
        g = int(150 + rng.random() * 90)
        c = (g, int(g * 0.95), int(g * 0.84)) if rng.random() < 0.7 else (252, 249, 240)
        fibre(c, 0.06 + rng.random() * 0.12, 4 + rng.random() * 16, 0.4 + rng.random() * 0.4, 1.4)
    for _ in range(int(1600 * area)):
        tone = rng.random()
        if tone < 0.55:
            c = (int(150 + rng.random() * 40), int(128 + rng.random() * 35), int(90 + rng.random() * 30))
        elif tone < 0.8:
            g = int(130 + rng.random() * 50)
            c = (g, g, int(g * 0.97))
        else:
            c = (250, 246, 236)
        fibre(c, 0.14 + rng.random() * 0.24, 8 + rng.random() * 36, 0.4 + rng.random() * 0.6, 1.0)
    for _ in range(int(3 * area) + 2):
        fibre((160, 45, 45), 0.35 + rng.random() * 0.25, 50 + rng.random() * 90, 0.8 + rng.random() * 0.4, 0.6)
    for _ in range(int(220 * area)):
        x, y = rng.random() * w * S, rng.random() * h * S
        r = (0.35 + rng.random() * 0.8) * S
        dark = rng.random() < 0.85
        col = (55, 50, 45) if dark else random.choice([(60, 90, 160), (180, 50, 50), (70, 120, 70)])
        d.ellipse([x - r, y - r, x + r, y + r], fill=(*col, int((0.25 + rng.random() * 0.35) * 255)))
    layer = layer.resize((w, h), Image.LANCZOS)
    lay = np.asarray(layer, np.float32) / 255
    a = lay[..., 3:4]
    rgb = rgb * (1 - a) + lay[..., :3] * a
    return rgb.clip(0, 1)


def edges(w, h, torn, rng):
    """The sheet's alpha: three furrowed sides and one torn one, with cuts."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    fine = smooth_noise(h, w, 3, rng)
    fringe = smooth_noise(h, w, 1, rng)
    alpha = np.ones((h, w), np.float32)
    inset = {}
    for side in ("left", "right", "top", "bottom"):
        n = h if side in ("left", "right") else w
        heavy = side == torn
        # How far in the edge sits along its length: a slow wander, and for
        # the torn side a bigger, more broken one.
        wander = noise1d(n, 140, rng) * (7 if heavy else 3) + noise1d(n, 35, rng) * (5 if heavy else 1.5)
        base = 22 if heavy else 12
        e = base + wander
        inset[side] = e
        if side == "left":
            dist = xx - e[:, None]
        elif side == "right":
            dist = (w - 1 - xx) - e[:, None]
        elif side == "top":
            dist = yy - e[None, :]
        else:
            dist = (h - 1 - yy) - e[None, :]
        # A fringe of fibre: ragged within a band, wide on the torn side.
        band = 13 if heavy else 3.5
        dist = dist + fine * band * 0.55 + fringe * band * 0.45
        a = np.clip(dist / (band * 0.5) + 0.5, 0, 1)
        if heavy:
            # Thin paper at a torn edge: the fringe is half see-through.
            a = np.where(dist < band * 0.6, a * (0.55 + 0.45 * np.clip(dist / (band * 0.6), 0, 1)), a)
        alpha *= a

    # Cuts: a small clean wedge out of a furrowed side or two.
    img = Image.fromarray((alpha * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for _ in range(1 + int(rng.random() * 2)):
        side = random.choice([s for s in ("left", "right", "top", "bottom") if s != torn])
        depth = 8 + rng.random() * 14
        span = 6 + rng.random() * 10
        if side in ("left", "right"):
            y0 = 60 + rng.random() * (h - 120)
            x0 = inset[side][int(y0)] - 2
            if side == "left":
                d.polygon([(0, y0 - span), (x0 + depth, y0), (0, y0 + span)], fill=0)
            else:
                d.polygon([(w, y0 - span), (w - x0 - depth, y0), (w, y0 + span)], fill=0)
        else:
            x0 = 60 + rng.random() * (w - 120)
            y0 = inset[side][int(x0)] - 2
            if side == "top":
                d.polygon([(x0 - span, 0), (x0, y0 + depth), (x0 + span, 0)], fill=0)
            else:
                d.polygon([(x0 - span, h), (x0, h - y0 - depth), (x0 + span, h)], fill=0)
    alpha = np.asarray(img.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255

    # A tear: a ragged bite out of the torn side.
    n = h if torn in ("left", "right") else w
    at = 0.2 + rng.random() * 0.6
    r = 14 + rng.random() * 12
    if torn == "left":
        cx, cy = inset["left"][int(at * h)], at * h
    elif torn == "right":
        cx, cy = w - inset["right"][int(at * h)], at * h
    elif torn == "top":
        cx, cy = at * w, inset["top"][int(at * w)]
    else:
        cx, cy = at * w, h - inset["bottom"][int(at * w)]
    dd = np.hypot(xx - cx, (yy - cy) * 1.6) - r + fine * 6 + fringe * 4
    alpha *= np.clip(dd / 4 + 0.5, 0.0, 1)

    # Threads pulled out past the torn edge.
    S = 2
    th = Image.new("L", (w * S, h * S), 0)
    td = ImageDraw.Draw(th)
    for _ in range(int(n / 9)):
        t = rng.random() * n
        if torn in ("left", "right"):
            e = inset[torn][int(t)]
            x = (e if torn == "left" else w - 1 - e) * S
            y = t * S
            a = (math.pi if torn == "left" else 0) + (rng.random() - 0.5) * 1.4
        else:
            e = inset[torn][int(t)]
            x = t * S
            y = (e if torn == "top" else h - 1 - e) * S
            a = (-math.pi / 2 if torn == "top" else math.pi / 2) + (rng.random() - 0.5) * 1.4
        pts = [(x, y)]
        for _ in range(int(2 + rng.random() * 4)):
            a += (rng.random() - 0.5) * 0.8
            x += math.cos(a) * 4 * S
            y += math.sin(a) * 4 * S
            pts.append((x, y))
        td.line(pts, fill=int((0.35 + rng.random() * 0.4) * 255), width=1)
    th = np.asarray(th.resize((w, h), Image.LANCZOS), np.float32) / 255
    return np.maximum(alpha, th), inset


def folds(w, h, rng):
    """Brightness for one or two faint folds across the sheet."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    shade = np.ones((h, w), np.float32)
    for _ in range(1 + int(rng.random() * 2)):
        # Roughly across or down the sheet, a little off square.
        if rng.random() < 0.5:
            ang = (rng.random() - 0.5) * 0.25
            c = (0.3 + rng.random() * 0.4) * w
            dist = (xx - c) * math.cos(ang) + (yy - h / 2) * math.sin(ang)
        else:
            ang = (rng.random() - 0.5) * 0.25
            c = (0.3 + rng.random() * 0.4) * h
            dist = (yy - c) * math.cos(ang) - (xx - w / 2) * math.sin(ang)
        side = np.where(dist > 0, 1.012, 0.99)
        line = 1 - 0.06 * np.exp(-(dist / 1.6) ** 2) + 0.03 * np.exp(-((dist - 3.5) / 2.6) ** 2)
        shade *= side * line
    return shade


def make(name, torn, seed, src=None, dest=None, long=None):
    rng = np.random.default_rng(seed)
    random.seed(seed)
    photo = Image.open(src or SRC.format(name)).convert("RGB")
    LONG = long or globals()["LONG"]
    pw, ph = photo.size
    landscape = pw > ph
    # The sheet: the photo plus a paper margin, a little more at the foot.
    if landscape:
        w = LONG
        inner_w = int(w * 0.86)
        inner_h = int(inner_w * ph / pw)
        h = int(inner_h + w * 0.14)
    else:
        h = LONG
        inner_h = int(h * 0.84)
        inner_w = int(inner_h * pw / ph)
        w = int(inner_w + h * 0.12)
    rgb = paper(w, h, rng)
    alpha, inset = edges(w, h, torn, rng)

    # The print: centred, set a touch high, edges a hair soft and uneven.
    ox = (w - inner_w) // 2
    oy = int((h - inner_h) * 0.44)
    p = np.asarray(photo.resize((inner_w, inner_h), Image.LANCZOS), np.float32) / 255
    grey = p.mean(axis=2, keepdims=True)
    # A touch more colour than the photo, to make up for the paper's warmth.
    p = np.clip(grey + (p - grey) * 1.08, 0, 1)
    # Ink on paper: blacks lift toward the paper's own shade, and the paper's
    # colour and fibres show through where the print is light.
    sheet = rgb[oy : oy + inner_h, ox : ox + inner_w]
    tone = sheet / PULP
    # Kept clear: the paper shows through, but only just.
    printed = (0.035 + p * 0.975) * (tone ** 0.22) * (PULP * 0.1 + 0.9)
    yy, xx = np.mgrid[0:inner_h, 0:inner_w].astype(np.float32)
    edge = np.minimum.reduce([xx, inner_w - 1 - xx, yy, inner_h - 1 - yy])
    rough = smooth_noise(inner_h, inner_w, 6, rng) * 0.7 + smooth_noise(inner_h, inner_w, 2, rng) * 0.3
    ink = np.clip((edge + rough * 1.5 - 0.5) / 2.5, 0, 1)[..., None] * 0.985
    rgb[oy : oy + inner_h, ox : ox + inner_w] = sheet * (1 - ink) + printed * ink

    # The folds run through the print too, but softer there.
    fold = folds(w, h, rng)
    fold[oy : oy + inner_h, ox : ox + inner_w] = 1 + (fold[oy : oy + inner_h, ox : ox + inner_w] - 1) * 0.55
    rgb *= fold[..., None]
    out = np.dstack([rgb.clip(0, 1), alpha]).astype(np.float32)
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA")
    img.save(dest or OUT.format(name), "WEBP", quality=86, method=6)
    print(name, img.size)


if __name__ == "__main__":
    import sys
    only = sys.argv[1:]
    for i, (name, torn) in enumerate(PHOTOS):
        if only and name not in only:
            continue
        make(name, torn, 41 + i * 17)
    # The early version, the mage on her bed, printed the same way for the
    # Ideation section: one sheet, wider, so it holds the column.
    if not only or "bed" in only:
        make("bed", "right", 113, src="public/pond-mage/process/bed.jpg",
             dest="public/pond-mage/process/bed-paper.webp", long=1800)
