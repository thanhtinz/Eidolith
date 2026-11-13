# Builds verdant-v7.png: the FULL ground redraw (Tín's order 2026-11-12
# "Vẽ lại nền đất") — all 17 frames re-drawn from two generated atlases
# (shots/tile-mock/gen/media-generation-tileset-atlas-v7-{greens,surfaces}-*.webp),
# frame indices identical to v6 so every map and the WorldScene bake keep
# working unchanged:
#   0 grass bright · 1 cobble · 2 deep water · 3 flower · 4 grove tint ·
#   5/6/7 grass variants · 8/9 dark grass · 10 sand · 11 dirt · 12 shore
#   (foam south) · 13 shore flipped · 14 swamp · 15 rocky · 16 plank
# Pipeline per tile: cell crop -> non-bg bbox -> 64x32 -> vignette
# flatten (divide by blurred self, the v4 grass lesson) -> background-
# gap fill (the rocky tile's cracks show the sheet bg; fill them with
# the tile's own dark tone) -> pixel-lean -> 96-colour quantize ->
# diamond alpha mask (RGBA discipline from the v6 alpha bug).
import glob
from PIL import Image, ImageFilter

GREENS = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-atlas-v7-greens-*.webp"))[-1]
SURFACES = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-atlas-v7-surfaces-*.webp"))[-1]
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-v7.png"

def diamond_mask():
    m = Image.new("L", (64, 32), 0)
    px = m.load()
    for y in range(32):
        for x in range(64):
            d = abs(x + 0.5 - 32) / 32 + abs(y + 0.5 - 16) / 16
            px[x, y] = 255 if d <= 1.0 else 0
    return m
MASK = diamond_mask()

def flatten(tile):
    blur = tile.filter(ImageFilter.GaussianBlur(5))
    tp, bp = tile.load(), blur.load()
    total, n = 0.0, 0
    for y in range(32):
        for x in range(64):
            r, g, b = bp[x, y][:3]
            total += 0.299 * r + 0.587 * g + 0.114 * b
            n += 1
    mean = total / n
    out = Image.new("RGB", (64, 32))
    op = out.load()
    for y in range(32):
        for x in range(64):
            r, g, b = bp[x, y][:3]
            lum = max(0.299 * r + 0.587 * g + 0.114 * b, 1.0)
            ratio = 1 + (mean / lum - 1) * 0.65
            tr, tg, tb = tp[x, y][:3]
            op[x, y] = (min(255, int(tr * ratio)), min(255, int(tg * ratio)), min(255, int(tb * ratio)))
    return out

def load_sheet(path):
    img = Image.open(path).convert("RGB")
    return img, img.getpixel((4, 4))

def slice_tile(img, bg, col, row):
    W, H = img.size
    x0, y0 = col * W // 4, row * H // 2
    x1, y1 = (col + 1) * W // 4, (row + 1) * H // 2
    cell = img.crop((x0, y0, x1, y1))
    cw, ch = cell.size
    px = cell.load()
    def is_bg(p):
        return sum(abs(p[i] - bg[i]) for i in range(3)) < 60
    minx, miny, maxx, maxy = cw, ch, -1, -1
    for y in range(ch):
        for x in range(cw):
            if not is_bg(px[x, y]):
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
    tile = cell.crop((minx, miny, maxx + 1, maxy + 1)).resize((64, 32), Image.LANCZOS)
    tile = flatten(tile)
    # gap fill: pixels still showing the sheet background (cracks in the
    # rocky tile) take the tile's own dark tone instead of navy
    tp = tile.load()
    lums = []
    for y in range(32):
        for x in range(64):
            r, g, b = tp[x, y]
            lums.append((0.299 * r + 0.587 * g + 0.114 * b, (r, g, b)))
    lums.sort()
    dark = lums[len(lums) // 8][1]
    for y in range(32):
        for x in range(64):
            p = tp[x, y]
            if sum(abs(p[i] - bg[i]) for i in range(3)) < 30:
                tp[x, y] = dark
    tile = tile.resize((32, 16), Image.LANCZOS).resize((64, 32), Image.NEAREST)
    tile = tile.quantize(colors=96).convert("RGBA")
    tile.putalpha(MASK)
    return tile

greens, gbg = load_sheet(GREENS)
surfaces, sbg = load_sheet(SURFACES)
G = lambda c, r: slice_tile(greens, gbg, c, r)
S = lambda c, r: slice_tile(surfaces, sbg, c, r)

frames = [
    G(0, 0),          # 0 grass bright
    S(0, 0),          # 1 cobble
    S(3, 0),          # 2 deep water
    G(0, 1),          # 3 flower grass
    G(3, 1),          # 4 grove tint
    G(1, 0),          # 5 grass variant B
    G(2, 0),          # 6 grass variant C (sunlit)
    G(3, 0),          # 7 grass variant D (dry)
    G(1, 1),          # 8 dark grass A
    G(2, 1),          # 9 dark grass B (leaf litter)
    S(2, 0),          # 10 sand
    S(1, 0),          # 11 dirt
    S(0, 1),          # 12 shore foam south
    None,             # 13 shore flipped (filled below)
    S(1, 1),          # 14 swamp
    S(2, 1),          # 15 rocky
    S(3, 1),          # 16 plank
    None,             # 17 blank
]
frames[13] = frames[12].transpose(Image.FLIP_TOP_BOTTOM)

def tone_match(tile, ref, strength=0.78):
    """Pull a variant tile's tones toward the reference tile: the gid-1
    bake mixes frames 0/5/6/7 per cell, and the raw variants' luminance
    spread (51..141) rendered as a checkerboard instead of texture.
    Textures stay; tones converge."""
    def mean_of(t):
        p = t.load(); sr = sg = sb = n = 0
        for y in range(32):
            for x in range(64):
                r, g, b, a = p[x, y]
                if a: sr += r; sg += g; sb += b; n += 1
        return (sr / n, sg / n, sb / n)
    rm = mean_of(ref); tm = mean_of(tile)
    out = tile.copy(); p = out.load()
    for y in range(32):
        for x in range(64):
            r, g, b, a = p[x, y]
            if not a: continue
            nr = r + (rm[0] - tm[0]) * strength
            ng = g + (rm[1] - tm[1]) * strength
            nb = b + (rm[2] - tm[2]) * strength
            p[x, y] = (max(0, min(255, int(rm[0] + (nr - rm[0]) * 0.85))),
                       max(0, min(255, int(rm[1] + (ng - rm[1]) * 0.85))),
                       max(0, min(255, int(rm[2] + (nb - rm[2]) * 0.85))), a)
    return out

for i in (5, 6, 7):
    frames[i] = tone_match(frames[i], frames[0])

sheet = Image.new("RGBA", (9 * 64, 2 * 32), (0, 0, 0, 0))
for i, t in enumerate(frames):
    if t is None:
        continue
    sheet.paste(t, ((i % 9) * 64, (i // 9) * 32))
sheet.save(OUT)

# verification: every drawn frame must carry exactly the diamond's
# transparent count (1024) and a sane mean colour
px = sheet.load()
for i in range(17):
    ox, oy = (i % 9) * 64, (i // 9) * 32
    transp, sr, sg, sb, n = 0, 0, 0, 0, 0
    for y in range(32):
        for x in range(64):
            r, g, b, a = px[ox + x, oy + y]
            if a == 0: transp += 1
            else: sr += r; sg += g; sb += b; n += 1
    mean = (sr // n, sg // n, sb // n) if n else (0, 0, 0)
    print(f"frame {i:>2}: transparent={transp} mean={mean}")
print("wrote", OUT, sheet.size)
