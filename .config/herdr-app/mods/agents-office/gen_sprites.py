# Regenerates sprites/: python3 gen_sprites.py <this mod>/sprites
import os, sys
OUT = sys.argv[1]
W, H = 24, 20

WOOD, WOOD_L, WOOD_D = "#9c6b3f", "#b98355", "#6e4a2a"
BEZEL, KEY, PAPER, PAPER_L = "#1b1d2a", "#c9ccd6", "#f4f1e6", "#cfcab8"
CHAIR, CHAIR_D = "#4b5170", "#363a52"
SKIN = "#f2c9a0"
SCREEN = {"working": "#12546b", "blocked": "#d93a3a", "done": "#3fd16b", "idle": "#262b4a", "empty": "#15172a"}
SHIRTS = ["#e05a5a", "#4c8be0", "#4fbf6a", "#e8c34a", "#a070d8", "#ee8f4a"]
HAIRS = ["#2b1d14", "#8a5a2b", "#e0b04a"]

def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            g[(x, y)] = c

def px(g, pts, c):
    for p in pts:
        g[p] = c

def desk(g, status):
    rect(g, 2, 1, 21, 10, WOOD)
    rect(g, 2, 1, 21, 1, WOOD_L)
    rect(g, 2, 10, 21, 10, WOOD_D)
    rect(g, 8, 2, 15, 6, BEZEL)
    rect(g, 9, 3, 14, 5, SCREEN[status])
    if status == "working":
        rect(g, 9, 3, 12, 3, "#7ff0ff"); rect(g, 9, 4, 13, 4, "#7ff0ff"); rect(g, 9, 5, 11, 5, "#7ff0ff")
    if status == "blocked":
        rect(g, 11, 3, 12, 4, "#fff"); px(g, [(11, 5), (12, 5)], "#fff"); g[(11, 5)] = g[(12, 5)] = "#fff"
        g[(11, 5)] = SCREEN[status]; g[(12, 5)] = SCREEN[status]; px(g, [(11, 5)], "#fff")
    if status == "done":
        px(g, [(10, 4), (11, 5), (12, 4), (13, 3)], "#eafff0")
    if status == "idle":
        px(g, [(12, 4)], "#5a6396")
    rect(g, 11, 7, 12, 7, BEZEL)
    rect(g, 9, 8, 14, 9, KEY)
    rect(g, 9, 9, 14, 9, "#9da1b3")
    rect(g, 16, 8, 16, 9, KEY)
    px(g, [(4, 4), (5, 4)], "#4a2c17"); px(g, [(4, 5), (5, 5), (6, 5)], "#f4f4f4")
    rect(g, 17, 3, 20, 6, PAPER); rect(g, 17, 4, 20, 4, PAPER_L); rect(g, 17, 6, 19, 6, PAPER_L)

def chair(g):
    rect(g, 7, 12, 16, 18, CHAIR)
    for p in [(7, 12), (16, 12), (7, 18), (16, 18)]:
        g.pop(p, None)
    rect(g, 8, 18, 15, 18, CHAIR_D)

def person(g, status, shirt, hair, frame="a"):
    if status == "idle":
        rect(g, 8, 14, 15, 17, shirt)
        rect(g, 7, 14, 7, 17, shirt); rect(g, 16, 14, 16, 17, shirt)
        px(g, [(7, 18), (16, 18)], SKIN)
        rect(g, 10, 13, 13, 16, hair); rect(g, 10, 12, 13, 12, SKIN)
        px(g, [(9, 14), (9, 15), (14, 14), (14, 15)], SKIN)
        return
    rect(g, 8, 14, 15, 17, shirt)
    rect(g, 10, 12, 13, 15, hair); rect(g, 10, 11, 13, 11, SKIN)
    px(g, [(9, 13), (9, 14), (14, 13), (14, 14)], SKIN)
    if status == "working":
        rect(g, 8, 11, 8, 13, shirt); rect(g, 15, 11, 15, 13, shirt)
        if frame == "a":
            rect(g, 8, 10, 9, 10, SKIN); rect(g, 14, 10, 15, 10, SKIN)
        else:
            rect(g, 9, 10, 10, 10, SKIN); rect(g, 13, 10, 14, 10, SKIN)
    elif status == "blocked":
        rect(g, 8, 11, 8, 13, shirt); rect(g, 8, 10, 9, 10, SKIN)
        rect(g, 16, 10, 17, 14, shirt); rect(g, 17, 7, 18, 9, SKIN)
    elif status == "done":
        rect(g, 7, 10, 7, 14, shirt); rect(g, 16, 10, 16, 14, shirt)
        rect(g, 6, 8, 7, 9, SKIN); rect(g, 16, 8, 17, 9, SKIN)

def svg(g):
    rows = {}
    for (x, y), c in g.items():
        rows.setdefault((y, c), []).append(x)
    rects = []
    for (y, c), xs in sorted(rows.items()):
        xs.sort(); start = prev = xs[0]
        for x in xs[1:] + [None]:
            if x is None or x != prev + 1:
                rects.append(f'<rect x="{start}" y="{y}" width="{prev - start + 1}" height="1" fill="{c}"/>')
                start = x
            prev = x if x is not None else prev
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" shape-rendering="crispEdges">' + "".join(rects) + "</svg>"

def write(name, g):
    open(os.path.join(OUT, name + ".svg"), "w").write(svg(g))

count = 0
for si, shirt in enumerate(SHIRTS):
    for hi, hair in enumerate(HAIRS):
        for status in ["working", "blocked", "done", "idle"]:
            frames = ["a", "b"] if status == "working" else ["a"]
            for fr in frames:
                g = {}; desk(g, status); chair(g); person(g, status, shirt, hair, fr)
                write(f"{status}-{si}-{hi}" + ("-b" if fr == "b" else ""), g); count += 1
g = {}; desk(g, "empty"); chair(g); write("empty", g); count += 1
# plant, 8x10
p = {}
rect(p, 2, 7, 5, 9, "#8a4b2a"); rect(p, 2, 7, 5, 7, "#a65f38")
rect(p, 3, 3, 4, 6, "#2f8f4e"); rect(p, 1, 3, 2, 5, "#3fae62"); rect(p, 5, 3, 6, 5, "#3fae62"); rect(p, 3, 1, 4, 2, "#5ccf80")
open(os.path.join(OUT, "plant.svg"), "w").write(svg(p).replace('viewBox="0 0 24 20"', 'viewBox="0 0 8 10"'))
# preview sheet (HTML) for eyeballing
print(count, "sprites")
