# Builds verdant-top-soft-v1.png: feathered-alpha twins of the current
# square tileset (verdant-top-v5). Used ONLY for border cells in the
# continuous-ground bake — each frame's alpha ramps from 0 at the edge
# to full 10px in (smoothstep), so a surface melts into whatever lies
# beneath instead of ending at a hard square edge (Tín, 2026-11-12:
# "cỏ phải vẽ cỏ thật luôn, không vẽ ô vuông nữa").
from PIL import Image

SRC = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-top-v5.png"
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-top-soft-v1.png"
S = 64
RAMP = 10

sheet = Image.open(SRC).convert("RGBA")
out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
for i in range(18):
    ox, oy = (i % 9) * S, (i // 9) * S
    tile = sheet.crop((ox, oy, ox + S, oy + S))
    px = tile.load()
    for y in range(S):
        for x in range(S):
            d = min(x, y, S - 1 - x, S - 1 - y)
            t = max(0.0, min(1.0, d / RAMP))
            f = t * t * (3 - 2 * t)
            if f < 1:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, int(a * f))
    out.paste(tile, (ox, oy))

out.save(OUT)
chk = out.load()
c11 = ((11 % 9) * S, (11 // 9) * S)
print("frame 11 alpha: corner", chk[c11[0], c11[1]][3],
      "| edge-mid", chk[c11[0] + 32, c11[1]][3],
      "| centre", chk[c11[0] + 32, c11[1] + 32][3])
print("wrote", OUT, out.size)
