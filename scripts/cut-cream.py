"""
Cut a Figma render out of the cream canvas it was exported on.

Figma's screenshot export has no transparency: every render comes back sat on
Fortuna cream, #f7f5f0. That is invisible on a cream band and a hard-edged
cream rectangle on any other colour, so the phones in the reveal have to be
lifted off it before they can sit on forest green.

The background is found by flooding in from the edges of the image, not by
colour alone. The screens inside the phones are nearly the same cream, and a
colour key would punch holes through the middle of the UI; the flood cannot
reach them because the bezel walls them off.

The one- or two-pixel band where bezel meets background is antialiased, so it
is given partial alpha in proportion to how far each pixel has moved from
cream, and its colour is un-mixed from the cream it was blended against.
Without that the phones get a pale halo on a dark ground.

    python3 scripts/cut-cream.py in.png out.webp [--quality 82]
"""
import sys
from collections import deque
from PIL import Image

CREAM = (247, 245, 240)
# How close to cream a pixel has to be to count as background.
FLOOD = 3
# A pixel this far from cream is fully opaque. The bezels measure ~170-199.
SOLID = 170


def diff(p):
    return max(abs(p[0] - CREAM[0]), abs(p[1] - CREAM[1]), abs(p[2] - CREAM[2]))


def cut(src, dst, quality=82):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i] or diff(px[x, y]) > FLOOD:
            continue
        bg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))

    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            r, g, b = px[x, y]
            if bg[i]:
                op[x, y] = (0, 0, 0, 0)
                continue
            edge = (
                (x > 0 and bg[i - 1]) or (x < w - 1 and bg[i + 1])
                or (y > 0 and bg[i - w]) or (y < h - 1 and bg[i + w])
            )
            if not edge:
                op[x, y] = (r, g, b, 255)
                continue
            a = min(1.0, diff((r, g, b)) / SOLID)
            if a <= 0:
                op[x, y] = (0, 0, 0, 0)
                continue
            un = lambda c, k: max(0, min(255, round((c - (1 - a) * k) / a)))
            op[x, y] = (un(r, CREAM[0]), un(g, CREAM[1]), un(b, CREAM[2]), round(a * 255))

    # Trim to what is left, so the element is the size of the object and not
    # the size of the canvas it was rendered on.
    out = out.crop(out.getbbox())
    out.save(dst, "WEBP", quality=quality, method=6)
    return out.size


if __name__ == "__main__":
    q = 82
    if "--quality" in sys.argv:
        q = int(sys.argv[sys.argv.index("--quality") + 1])
    print(cut(sys.argv[1], sys.argv[2], q))
