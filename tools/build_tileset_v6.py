# Builds verdant-v6.png: keeps verdant-v5's 10 frames at the same indices
# and appends 7 new ground tiles sliced from the approved atlas sheet
# (shots/tile-mock/gen/media-generation-tileset-atlas-v6-*.webp):
#   10 sand · 11 dirt · 12 shore (foam south) · 13 shore flipped (foam
#   north) · 14 swamp · 15 rocky · 16 plank
# New gids in map JSONs: 7 sand, 8 dirt, 9 shore, 13 shoreN, 10 swamp,
# 11 rocky, 12 plank (WorldScene bake maps gid -> frame).
# ALPHA DISCIPLINE (bug fix): tiles are diamonds — the frame corners MUST
# stay transparent. v5 is opened as RGBA (convert("RGB") once turned its
# transparent corners opaque black and the whole ground rendered as a
# black lattice), and each sliced tile gets an explicit diamond alpha
# mask so the atlas background never leaks into a frame.
# Pixel-lean pass matches extract_art_v3: half-size LANCZOS, back up
# NEAREST (uniform 2px blocks), 64-colour palette.
import glob
from PIL import Image

ATLAS = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-atlas-v6-*.webp"))[-1]
V5 = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-v5.png"
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-v6.png"

atlas = Image.open(ATLAS).convert("RGB")
W, H = atlas.size
bg = atlas.getpixel((4, 4))

def is_bg(px):
    return sum(abs(px[i] - bg[i]) for i in range(3)) < 60

def diamond_mask():
    m = Image.new("L", (64, 32), 0)
    px = m.load()
    for y in range(32):
        for x in range(64):
            d = abs(x + 0.5 - 32) / 32 + abs(y + 0.5 - 16) / 16
            px[x, y] = 255 if d <= 1.0 else 0
    return m

MASK = diamond_mask()

def slice_tile(col, row):
    x0, y0 = col * W // 3, row * H // 2
    x1, y1 = (col + 1) * W // 3, (row + 1) * H // 2
    cell = atlas.crop((x0, y0, x1, y1))
    cw, ch = cell.size
    px = cell.load()
    minx, miny, maxx, maxy = cw, ch, -1, -1
    for y in range(ch):
        for x in range(cw):
            if not is_bg(px[x, y]):
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
    tile = cell.crop((minx, miny, maxx + 1, maxy + 1))
    tile = tile.resize((64, 32), Image.LANCZOS)
    tile = tile.resize((32, 16), Image.LANCZOS).resize((64, 32), Image.NEAREST)
    tile = tile.quantize(colors=64).convert("RGBA")
    tile.putalpha(MASK)
    return tile

# atlas order: row0 = sand, dirt, shore · row1 = swamp, rocky, plank
sand = slice_tile(0, 0)
dirt = slice_tile(1, 0)
shore = slice_tile(2, 0)
swamp = slice_tile(0, 1)
rocky = slice_tile(1, 1)
plank = slice_tile(2, 1)
shore_n = shore.transpose(Image.FLIP_TOP_BOTTOM)

v5 = Image.open(V5).convert("RGBA")  # 320x64, 5 cols x 2 rows of 64x32
sheet = Image.new("RGBA", (9 * 64, 2 * 32), (0, 0, 0, 0))
for i in range(10):  # copy old frames index-identical, alpha intact
    f = v5.crop(((i % 5) * 64, (i // 5) * 32, (i % 5) * 64 + 64, (i // 5) * 32 + 32))
    sheet.paste(f, ((i % 9) * 64, (i // 9) * 32))
for j, t in enumerate([sand, dirt, shore, shore_n, swamp, rocky, plank]):
    i = 10 + j
    sheet.paste(t, ((i % 9) * 64, (i // 9) * 32))
sheet.save(OUT)
print("wrote", OUT, sheet.size)
