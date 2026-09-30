"""
Lift a Figma export off the flat colour it was rendered on.

Figma's exports come back on a solid ground — cream for some renders, the
canvas grey #E5E5E5 for others — and that ground shows as a hard rectangle
on any other colour. This takes it away.

The background is found by flooding in from the image's edges rather than by
colour alone, so a region inside the art that happens to match the ground (a
cream screen inside a phone's bezel) is walled off and kept.

Soft shadows are the reason this is more than a flood fill. A card's drop
shadow darkens the ground around it, and removing only the pure ground
leaves that darkened ring behind as a grey halo on the new colour. So the
flood carries on through pixels darker than the ground, and turns each one
into black at the opacity that would darken the ground to that value — a
real, see-through shadow that darkens whatever it now sits on.

    python3 scripts/cut-background.py in.png out.webp [--bg 229,229,229] [--quality 84]
"""
import sys
from collections import deque
from PIL import Image


def cut(src, dst, bg=(229, 229, 229), quality=84):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()
    lum_bg = sum(bg) / 3

    def diff(p):
        return max(abs(p[0] - bg[0]), abs(p[1] - bg[1]), abs(p[2] - bg[2]))

    def ground_or_shadow(p):
        # Near the ground, and not brighter than it: the ground itself, or a
        # shadow falling on it. Anything brighter is the art.
        return diff(p) <= 70 and sum(p) / 3 <= lum_bg + 2

    seen = bytearray(w * h)
    q = deque((x, y) for x in range(w) for y in (0, h - 1))
    q.extend((x, y) for y in range(h) for x in (0, w - 1))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i] or not ground_or_shadow(px[x, y]):
            continue
        seen[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))

    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if not seen[y * w + x]:
                op[x, y] = (r, g, b, 255)
                continue
            a = max(0.0, 1 - (sum((r, g, b)) / 3) / lum_bg)
            op[x, y] = (0, 0, 0, round(a * 255)) if a > 0.01 else (0, 0, 0, 0)

    out.save(dst, "WEBP", quality=quality, method=6)
    return out.size


if __name__ == "__main__":
    args = sys.argv[1:]
    bg = (229, 229, 229)
    q = 84
    if "--bg" in args:
        bg = tuple(int(v) for v in args[args.index("--bg") + 1].split(","))
    if "--quality" in args:
        q = int(args[args.index("--quality") + 1])
    print(cut(args[0], args[1], bg, q))
