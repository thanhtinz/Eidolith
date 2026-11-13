# Builds verdant-top-edge-v1.png: DIRECTIONAL feather variants of the
# square tileset (verdant-top-v5) for the continuous-ground bake.
# Each base frame gets 4 variants (index = frame*4 + dir); a variant's
# alpha ramps 0 -> full over 10px ONLY on one edge (dir 0=E, 1=W,
# 2=S, 3=N) and is fully opaque elsewhere, so a border cell melts into
# its neighbour across their shared edge only — no picture-frames.
from PIL import Image

SRC = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-top-v5.png"
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-top-edge-v1.png"
S = 64
RAMP = 10
COLS = 9

sheet = Image.open(SRC).convert("RGBA")
total = 18 * 4
rows = (total + COLS - 1) // COLS
out = Image.new("RGBA", (COLS * S, rows * S), (0, 0, 0, 0))

def factor(x, y, d):
    if d == 0: dist = S - 1 - x
    elif d == 1: dist = x
    elif d == 2: dist = S - 1 - y
    else: dist = y
    t = max(0.0, min(1.0, dist / RAMP))
    return t * t * (3 - 2 * t)

for i in range(18):
    base = sheet.crop(((i % 9) * S, (i // 9) * S, (i % 9) * S + S, (i // 9) * S + S))
    for d in range(4):
        tile = base.copy()
        px = tile.load()
        for y in range(S):
            for x in range(S):
                f = factor(x, y, d)
                if f < 1:
                    r, g, b, a = px[x, y]
                    px[x, y] = (r, g, b, int(a * f))
        idx = i * 4 + d
        out.paste(tile, ((idx % COLS) * S, (idx // COLS) * S))

out.save(OUT)
chk = out.load()
# frame 11 (dirt) dir 0 (E): index 44 -> its east edge alpha 0, west edge full
i44 = 11 * 4 + 0
ox, oy = (i44 % COLS) * S, (i44 // COLS) * S
print("dirt E-variant alpha: east edge", chk[ox + 63, oy + 32][3],
      "| west edge", chk[ox, oy + 32][3],
      "| centre", chk[ox + 32, oy + 32][3])
print("wrote", OUT, out.size)
