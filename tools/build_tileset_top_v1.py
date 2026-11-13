# Builds verdant-top-v5.png: the TOP-DOWN ground set (Tín's decision
# 2026-11-12 — the world switches from isometric diamonds to a square
# top-down grid like his Pokémon reference). Same 17 frame indices as
# the iso sets, so the WorldScene bake and every map keep working:
#   0 grass bright · 1 cobble · 2 deep water · 3 flower · 4 grove tint ·
#   5/6/7 grass variants · 8/9 dark grass · 10 sand · 11 dirt · 12 shore
#   (foam south) · 13 shore flipped · 14 swamp · 15 rocky · 16 plank
# Squares need no alpha mask; the v7 lessons still apply: vignette
# flatten, a calm pass (the ground is the quietest layer), and the
# gid-1 variants tone-matched to frame 0 so the mix never checkers.
import glob
from PIL import Image, ImageFilter

GREENS = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-top-greens-*.webp"))[-1]
SURFACES = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-top-surfaces-*.webp"))[-1]
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-top-v5.png"
S = 64

def flatten(tile):
    blur = tile.filter(ImageFilter.GaussianBlur(6))
    tp, bp = tile.load(), blur.load()
    total, n = 0.0, 0
    for y in range(S):
        for x in range(S):
            r, g, b = bp[x, y][:3]
            total += 0.299 * r + 0.587 * g + 0.114 * b
            n += 1
    mean = total / n
    out = Image.new("RGB", (S, S))
    op = out.load()
    for y in range(S):
        for x in range(S):
            r, g, b = bp[x, y][:3]
            lum = max(0.299 * r + 0.587 * g + 0.114 * b, 1.0)
            ratio = 1 + (mean / lum - 1) * 0.8
            tr, tg, tb = tp[x, y][:3]
            op[x, y] = (min(255, int(tr * ratio)), min(255, int(tg * ratio)), min(255, int(tb * ratio)))
    return out

def calm(tile, keep=0.8):
    # SHARP pass (v5): calm now comes from tone, not blur — a whisper of
    # detail reduction only, so the texture stays crisp ("không nét" fix)
    blur = tile.filter(ImageFilter.GaussianBlur(0.8))
    tp, bp = tile.load(), blur.load()
    out = Image.new("RGB", (S, S))
    op = out.load()
    for y in range(S):
        for x in range(S):
            r, g, b = tp[x, y][:3]
            br, bg2, bb = bp[x, y][:3]
            op[x, y] = (int(br + (r - br) * keep), int(bg2 + (g - bg2) * keep), int(bb + (b - bb) * keep))
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
    tile = cell.crop((minx, miny, maxx + 1, maxy + 1)).resize((S, S), Image.LANCZOS)
    tile = calm(flatten(tile))
    # No half-res lean any more: the 32px downscale baked mush into
    # every tile. Native 64px grain + a wider palette reads sharp.
    return tile.quantize(colors=160).convert("RGBA")

greens, gbg = load_sheet(GREENS)
surfaces, sbg = load_sheet(SURFACES)
G = lambda c, r: slice_tile(greens, gbg, c, r)
Sf = lambda c, r: slice_tile(surfaces, sbg, c, r)

frames = [
    G(0, 0),          # 0 grass bright
    Sf(0, 0),         # 1 cobble
    Sf(3, 0),         # 2 deep water
    G(0, 1),          # 3 flower grass
    G(3, 1),          # 4 grove tint
    G(1, 0),          # 5 grass variant B
    G(2, 0),          # 6 grass variant C (sunlit)
    G(3, 0),          # 7 grass variant D (dry)
    G(1, 1),          # 8 dark grass A
    G(2, 1),          # 9 dark grass B (leaf litter)
    Sf(2, 0),         # 10 sand
    Sf(1, 0),         # 11 dirt
    Sf(0, 1),         # 12 shore foam south
    None,             # 13 shore flipped
    Sf(1, 1),         # 14 swamp
    Sf(2, 1),         # 15 rocky
    Sf(3, 1),         # 16 plank
    None,             # 17 blank
]
frames[13] = frames[12].transpose(Image.FLIP_TOP_BOTTOM)

def tone_match(tile, ref, strength=0.72):
    def mean_of(t):
        p = t.load(); sr = sg = sb = n = 0
        for y in range(S):
            for x in range(S):
                r, g, b, a = p[x, y]
                sr += r; sg += g; sb += b; n += 1
        return (sr / n, sg / n, sb / n)
    rm = mean_of(ref); tm = mean_of(tile)
    out = tile.copy(); p = out.load()
    for y in range(S):
        for x in range(S):
            r, g, b, a = p[x, y]
            p[x, y] = (max(0, min(255, int(r + (rm[0] - tm[0]) * strength))),
                       max(0, min(255, int(g + (rm[1] - tm[1]) * strength))),
                       max(0, min(255, int(b + (rm[2] - tm[2]) * strength))), a)
    return out

for i in (5, 6, 7):
    frames[i] = tone_match(frames[i], frames[0], 0.92)


# Register rebalance (first in-game shot): the dirt read as pale sand
# slabs and the greens ran hot. Dirt down toward mid tan-brown, greens
# desaturated a touch — the reference keeps both quiet and close.
def scale_rgb(tile, fr, fg, fb):
    a = tile.getchannel("A")
    r, g, b = tile.convert("RGB").split()
    out = Image.merge("RGB", [r.point(lambda v: min(255, int(v * fr))),
                              g.point(lambda v: min(255, int(v * fg))),
                              b.point(lambda v: min(255, int(v * fb)))])
    out.putalpha(a)
    return out

def desat(tile, k=0.08):
    a = tile.getchannel("A")
    rgb = tile.convert("RGB")
    grey = rgb.convert("L").convert("RGB")
    out = Image.blend(rgb, grey, k)
    out.putalpha(a)
    return out

frames[11] = scale_rgb(frames[11], 0.88, 0.87, 0.82)
for i in (0, 3, 4, 5, 6, 7, 8, 9):
    frames[i] = desat(frames[i], 0.08)



# Dark-zone coherence (forest shot): frame 4 is gid 6 "dark grass" —
# its teal tint checkered hard against the dark greens, and the two
# dark frames (8/9) differed too much. Pull frame 4 to deep green and
# match frame 9 to frame 8.
def blend_toward(tile, target, k):
    a = tile.getchannel("A")
    rgb = tile.convert("RGB")
    p = rgb.load()
    for y in range(S):
        for x in range(S):
            r, g, b = p[x, y]
            p[x, y] = (int(r + (target[0] - r) * k), int(g + (target[1] - g) * k), int(b + (target[2] - b) * k))
    rgb.putalpha(a)
    return rgb

frames[4] = blend_toward(frames[4], (26, 58, 36), 0.7)
frames[9] = tone_match(frames[9], frames[8], 0.85)

def rim_soften(tile, ring=3, k=0.35):
    """Blend the outer ring toward the frame mean — the atlas tiles
    carry a denser fringe at their borders which otherwise prints a
    hard square rim on every cell (the top-down checkerboard)."""
    a = tile.getchannel("A")
    rgb = tile.convert("RGB")
    p = rgb.load()
    sr = sg = sb = 0
    for y in range(S):
        for x in range(S):
            r, g, b = p[x, y]
            sr += r; sg += g; sb += b
    n = S * S
    mean = (sr // n, sg // n, sb // n)
    for y in range(S):
        for x in range(S):
            d = min(x, y, S - 1 - x, S - 1 - y)
            if d < ring:
                w = k * (1 - d / ring)
                r, g, b = p[x, y]
                p[x, y] = (int(r + (mean[0] - r) * w), int(g + (mean[1] - g) * w), int(b + (mean[2] - b) * w))
    rgb.putalpha(a)
    return rgb

for i in range(17):
    if frames[i] is not None:
        frames[i] = rim_soften(frames[i])

sheet = Image.new("RGBA", (9 * S, 2 * S), (0, 0, 0, 0))
for i, t in enumerate(frames):
    if t is not None:
        sheet.paste(t, ((i % 9) * S, (i // 9) * S))
sheet.save(OUT)
px = sheet.load()
for i in range(17):
    ox, oy = (i % 9) * S, (i // 9) * S
    sr = sg = sb = 0
    for y in range(S):
        for x in range(S):
            r, g, b, a = px[ox + x, oy + y]
            sr += r; sg += g; sb += b
    print(f"frame {i:>2}: mean=({sr // (S * S)}, {sg // (S * S)}, {sb // (S * S)})")
print("wrote", OUT, sheet.size)
