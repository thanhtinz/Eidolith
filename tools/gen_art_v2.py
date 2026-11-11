# Art v2 — "Premium Pixel" (approved direction, docs/ART-DIRECTION-v1.md).
# Pixel-native at in-game sizes: multi-tone shading, warm brown outlines, textured ground.
from PIL import Image, ImageDraw
import random
OUT_T = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
OUT_P = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"
OUT_C = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/chars"
import os
os.makedirs(OUT_C, exist_ok=True)
random.seed(7)
OUTLINE = (66, 48, 36, 255)

def in_diamond(x, y, cx, cy, w, h):
    return abs(x - cx) / (w / 2) + abs(y - cy) / (h / 2) <= 1.0

def make_tile(painter):
    img = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(32):
        for x in range(64):
            if in_diamond(x, y, 31.5, 15.5, 64, 32):
                d.point((x, y), fill=painter(x, y))
    return img

def grass_painter(base, light, dark, flower_chance=0.0):
    def paint(x, y):
        r = random.random()
        if flower_chance and r < flower_chance:
            return random.choice([(245, 240, 220, 255), (244, 160, 190, 255), (250, 214, 110, 255), (190, 170, 235, 255)])
        if r < 0.16: return light
        if r < 0.30: return dark
        return base
    return paint

def tile_path(x, y):
    # dirt base + individual rounded stones
    stones = [(10, 8, 9, 6), (26, 6, 10, 6), (44, 8, 9, 6), (18, 15, 10, 7), (36, 16, 10, 7), (52, 15, 8, 6), (8, 22, 9, 6), (27, 24, 10, 6), (45, 23, 9, 6)]
    for (sx, sy, sw, sh) in stones:
        if ((x - sx) / sw) ** 2 + ((y - sy) / sh) ** 2 <= 1:
            shade = (172, 154, 128, 255) if y < sy else (148, 130, 104, 255)
            if ((x - sx) / (sw * 0.55)) ** 2 + ((y - (sy - 1)) / (sh * 0.5)) ** 2 <= 1: shade = (188, 170, 144, 255)
            return shade
    if random.random() < 0.05: return (96, 140, 70, 255)  # moss between stones
    return (138, 116, 86, 255)

def tile_water(x, y):
    r = random.random()
    if r < 0.03: return (235, 250, 255, 255)  # sparkle
    if (x + y * 3) % 17 == 0: return (110, 178, 228, 255)  # wave light
    if r < 0.2: return (84, 150, 212, 255)
    return (62, 128, 196, 255)

tiles = [
    make_tile(grass_painter((106, 168, 78, 255), (140, 198, 102, 255), (80, 138, 58, 255))),
    make_tile(grass_painter((88, 146, 64, 255), (116, 172, 84, 255), (64, 118, 48, 255))),
    make_tile(tile_path),
    make_tile(tile_water),
    make_tile(grass_painter((110, 172, 82, 255), (144, 202, 106, 255), (84, 142, 60, 255), flower_chance=0.045)),
    make_tile(grass_painter((70, 122, 56, 255), (92, 146, 70, 255), (50, 96, 42, 255))),
]
sheet = Image.new("RGBA", (192, 64), (0, 0, 0, 0))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % 3) * 64, (i // 3) * 32), t)
sheet.save(f"{OUT_T}/verdant-v2.png")

def save(img, name, folder=OUT_P): img.save(f"{folder}/{name}")

# ---- Tree: layered canopy, 3 greens + highlights, shaded trunk ----
t = Image.new("RGBA", (88, 124), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
d.rectangle([40, 88, 48, 120], fill=(104, 74, 46, 255)); d.rectangle([40, 88, 43, 120], fill=(128, 96, 60, 255))
d.polygon([(44, 96), (30, 118), (38, 118)], fill=(88, 62, 40, 255)); d.polygon([(44, 96), (58, 118), (50, 118)], fill=(88, 62, 40, 255))
canopy = [(44, 40, 36, (52, 110, 50)), (26, 54, 22, (58, 122, 54)), (62, 54, 22, (48, 102, 46)),
          (44, 26, 22, (70, 140, 62)), (32, 38, 16, (88, 160, 76)), (56, 36, 15, (80, 150, 68)), (44, 16, 12, (104, 176, 88))]
for (x, y, r, c) in canopy: d.ellipse([x - r, y - r, x + r, y + r], fill=c + (255,))
for _ in range(46):
    x, y = random.randint(14, 74), random.randint(6, 62)
    if (x - 44) ** 2 / 36 ** 2 + (y - 40) ** 2 / 34 ** 2 < 0.85: d.point((x, y), fill=(140, 200, 116, 255))
    if random.random() < 0.3: d.point((x, y + 1), fill=(40, 92, 40, 255))
save(t, "tree-v2.png")
# ---- Pine ----
t = Image.new("RGBA", (76, 128), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
d.rectangle([34, 100, 42, 124], fill=(100, 70, 44, 255)); d.rectangle([34, 100, 37, 124], fill=(124, 92, 56, 255))
for (y0, w, c) in [(86, 34, (44, 104, 54)), (60, 27, (52, 118, 60)), (34, 20, (62, 134, 68)), (12, 12, (74, 150, 78))]:
    d.polygon([(38, y0 - 20), (38 + w, y0 + 16), (38 - w, y0 + 16)], fill=c + (255,))
    d.polygon([(38, y0 - 20), (38 + w // 2, y0 + 16), (38 - w // 2, y0 + 16)], fill=(c[0] + 14, c[1] + 16, c[2] + 12, 255))
save(t, "pine-v2.png")
# ---- House 152x136: stone base, cream walls, timber, terracotta roof rows, warm windows ----
t = Image.new("RGBA", (152, 136), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
d.rectangle([24, 84, 128, 128], fill=(150, 144, 132, 255))                      # stone base
for i in range(5): d.line([(24, 92 + i * 8), (128, 92 + i * 8)], fill=(128, 122, 112, 255))
d.rectangle([24, 56, 128, 88], fill=(232, 216, 178, 255))                        # cream wall
d.rectangle([24, 56, 128, 62], fill=(206, 188, 148, 255))
for x in (24, 70, 122): d.rectangle([x, 56, x + 6, 88], fill=(122, 88, 56, 255))  # timber
d.polygon([(12, 60), (76, 10), (140, 60)], fill=(168, 84, 54, 255))              # roof
for i in range(5):
    y = 24 + i * 8; inset = 12 - i * 2
    d.line([(30 + inset, y), (122 - inset, y)], fill=(146, 66, 42, 255), width=2)
    d.line([(30 + inset, y + 3), (122 - inset, y + 3)], fill=(196, 110, 74, 255), width=1)
d.rectangle([74, 6, 84, 14], fill=(186, 96, 62, 255))                            # ridge cap
d.rectangle([64, 88, 88, 128], fill=(110, 74, 44, 255)); d.rectangle([64, 88, 88, 94], fill=(88, 58, 34, 255))  # door
d.ellipse([80, 104, 85, 109], fill=(216, 170, 60, 255))
for wx in (34, 100):
    d.rectangle([wx, 66, wx + 16, 84], fill=(250, 200, 90, 255)); d.rectangle([wx, 66, wx + 16, 70], fill=(255, 226, 140, 255))
    d.rectangle([wx + 7, 66, wx + 9, 84], fill=(122, 88, 56, 255))
d.rectangle([58, 126, 94, 131], fill=(168, 160, 146, 255))                       # step
save(t, "house-v2.png")
# ---- Rock ----
t = Image.new("RGBA", (68, 50), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
d.polygon([(8, 44), (14, 16), (34, 6), (56, 14), (62, 44)], fill=(126, 126, 132, 255))
d.polygon([(14, 16), (34, 6), (36, 44), (8, 44)], fill=(150, 150, 156, 255))
d.polygon([(34, 6), (56, 14), (52, 30), (36, 26)], fill=(168, 168, 174, 255))
d.polygon([(20, 40), (30, 34), (34, 40)], fill=(96, 140, 70, 255))               # moss
save(t, "rock-v2.png")
# ---- Bush with flowers ----
t = Image.new("RGBA", (68, 48), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
for (x, y, r, c) in [(18, 32, 14, (56, 120, 54)), (36, 24, 17, (66, 136, 60)), (52, 33, 13, (52, 112, 50)), (36, 36, 14, (60, 128, 56))]:
    d.ellipse([x - r, y - r, x + r, y + r], fill=c + (255,))
for _ in range(10):
    x, y = random.randint(8, 60), random.randint(12, 40)
    d.point((x, y), fill=random.choice([(244, 150, 185, 255), (250, 214, 110, 255), (245, 240, 220, 255)]))
save(t, "bush-v2.png")
print("tileset + props v2 done")

# ---- Characters: drawn flat at 4x then NEAREST-downscaled = crisp pixel clusters ----
def draw_character(cloak, cloak_dark, cloak_light, trim, hair, skin, skin_shade, file, female=False):
    S = 4  # supersample
    W, H = 36 * S, 52 * S
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    cx = W // 2
    # cloak body (teardrop)
    d.polygon([(cx - 13 * S, 20 * S), (cx + 13 * S, 20 * S), (cx + 15 * S, 47 * S), (cx - 15 * S, 47 * S)], fill=cloak_dark + (255,))
    d.polygon([(cx - 12 * S, 20 * S), (cx + 12 * S, 20 * S), (cx + 13 * S, 46 * S), (cx - 13 * S, 46 * S)], fill=cloak + (255,))
    # tunic front (V opening)
    d.polygon([(cx - 6 * S, 22 * S), (cx + 6 * S, 22 * S), (cx + 7 * S, 44 * S), (cx - 7 * S, 44 * S)], fill=(240, 230, 202, 255))
    d.polygon([(cx + 3 * S, 22 * S), (cx + 6 * S, 22 * S), (cx + 7 * S, 44 * S), (cx + 3 * S, 44 * S)], fill=(216, 202, 168, 255))
    # gold trim along cloak opening
    d.line([(cx - 6 * S, 22 * S), (cx - 7 * S, 44 * S)], fill=trim + (255,), width=S)
    d.line([(cx + 6 * S, 22 * S), (cx + 7 * S, 44 * S)], fill=trim + (255,), width=S)
    # belt
    d.rectangle([cx - 7 * S, 36 * S, cx + 7 * S, 38 * S], fill=(112, 80, 48, 255))
    d.rectangle([cx - 1 * S, 36 * S, cx + 1 * S, 38 * S], fill=trim + (255,))
    # pendant: glowing cyan diamond at chest
    d.polygon([(cx, 25 * S), (cx + 2 * S, 28 * S), (cx, 32 * S), (cx - 2 * S, 28 * S)], fill=(96, 224, 240, 255))
    d.point((cx, 28 * S), fill=(220, 252, 255, 255))
    d.line([(cx, 22 * S), (cx, 25 * S)], fill=(84, 58, 34, 255), width=max(1, S // 2))
    # arms: sleeves + hands
    for sgn in (-1, 1):
        d.rectangle([cx + sgn * 11 * S - 2 * S, 24 * S, cx + sgn * 11 * S + 2 * S, 36 * S], fill=cloak + (255,))
        d.ellipse([cx + sgn * 11 * S - 2 * S, 35 * S, cx + sgn * 11 * S + 2 * S, 39 * S], fill=skin + (255,))
    # head
    d.ellipse([cx - 8 * S, 4 * S, cx + 8 * S, 20 * S], fill=skin + (255,))
    d.pieslice([cx - 8 * S, 4 * S, cx + 8 * S, 16 * S], 180, 360, fill=skin_shade + (255,))
    # hair fringe
    d.pieslice([cx - 8 * S, 2 * S, cx + 8 * S, 15 * S], 180, 360, fill=hair + (255,))
    d.polygon([(cx - 8 * S, 8 * S), (cx - 3 * S, 8 * S), (cx - 6 * S, 12 * S)], fill=hair + (255,))
    d.polygon([(cx + 1 * S, 8 * S), (cx + 8 * S, 8 * S), (cx + 5 * S, 12 * S)], fill=hair + (255,))
    d.polygon([(cx - 2 * S, 8 * S), (cx + 2 * S, 8 * S), (cx, 11 * S)], fill=hair + (255,))
    # eyes + mouth
    for sgn in (-1, 1):
        d.rectangle([cx + sgn * 4 * S - S, 12 * S, cx + sgn * 4 * S + S, 15 * S], fill=(46, 34, 28, 255))
        d.point((cx + sgn * 4 * S, 12 * S), fill=(255, 255, 255, 255))
    d.line([(cx - S, 17 * S), (cx + S, 17 * S)], fill=(190, 120, 96, 255), width=max(1, S // 2))
    # hood behind head (drawn over hair top edge): arc band
    d.pieslice([cx - 10 * S, 1 * S, cx + 10 * S, 19 * S], 180, 360, fill=cloak + (255,))
    d.pieslice([cx - 10 * S, 1 * S, cx + 10 * S, 19 * S], 180, 360, outline=cloak_light + (255,), width=S)
    # redraw face features that the hood band covered (band is only the top arc outline area: pieslice filled would cover face!) -> face again
    img2 = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d2 = ImageDraw.Draw(img2)
    d2.ellipse([cx - 8 * S, 4 * S, cx + 8 * S, 20 * S], fill=skin + (255,))
    d2.pieslice([cx - 8 * S, 2 * S, cx + 8 * S, 15 * S], 180, 360, fill=hair + (255,))
    d2.polygon([(cx - 8 * S, 8 * S), (cx - 3 * S, 8 * S), (cx - 6 * S, 12 * S)], fill=hair + (255,))
    d2.polygon([(cx + 1 * S, 8 * S), (cx + 8 * S, 8 * S), (cx + 5 * S, 12 * S)], fill=hair + (255,))
    for sgn in (-1, 1):
        d2.rectangle([cx + sgn * 4 * S - S, 12 * S, cx + sgn * 4 * S + S, 15 * S], fill=(46, 34, 28, 255))
        d2.point((cx + sgn * 4 * S, 12 * S), fill=(255, 255, 255, 255))
    d2.line([(cx - S, 17 * S), (cx + S, 17 * S)], fill=(190, 120, 96, 255), width=max(1, S // 2))
    if female:
        # long hair locks flowing beside the face down to the shoulders
        for sgn in (-1, 1):
            d2.rectangle([cx + sgn * 8 * S - (2 * S if sgn < 0 else 0), 8 * S, cx + sgn * 8 * S + (0 if sgn < 0 else 2 * S), 24 * S], fill=hair + (255,))
            d2.rectangle([cx + sgn * 8 * S - (2 * S if sgn < 0 else 0), 22 * S, cx + sgn * 8 * S + (0 if sgn < 0 else 2 * S), 24 * S], fill=(hair[0] - 18, hair[1] - 12, hair[2] - 8, 255))
        # eyelashes
        for sgn in (-1, 1):
            d2.point((cx + sgn * 5 * S, 12 * S), fill=(46, 34, 28, 255))
            d2.point((cx + sgn * 5 * S, 13 * S), fill=(46, 34, 28, 255))
        # gold hairpin
        d2.rectangle([cx + 5 * S, 5 * S, cx + 7 * S, 6 * S], fill=(216, 170, 60, 255))
    img.alpha_composite(img2)
    if female:
        # gentle skirt flare over the tunic hem
        d.polygon([(cx - 7 * S, 40 * S), (cx + 7 * S, 40 * S), (cx + 9 * S, 46 * S), (cx - 9 * S, 46 * S)], fill=(240, 230, 202, 255))
        d.line([(cx - 9 * S, 46 * S), (cx + 9 * S, 46 * S)], fill=(216, 170, 60, 255), width=S)
    # legs + boots below cloak hem
    for sgn in (-1, 1):
        d.rectangle([cx + sgn * 5 * S - 2 * S, 46 * S, cx + sgn * 5 * S + 2 * S, 49 * S], fill=(96, 72, 48, 255))
        d.rectangle([cx + sgn * 5 * S - 2 * S, 49 * S, cx + sgn * 5 * S + 3 * S, 51 * S], fill=(70, 48, 30, 255))
    out = img.resize((36, 52), Image.NEAREST)
    out.save(f"{OUT_C}/{file}")
    return out

draw_character((36, 134, 132), (24, 98, 100), (70, 170, 164), (216, 170, 60), (112, 76, 44), (246, 198, 152), (226, 166, 118), "wanderer-v2.png")
draw_character((36, 134, 132), (24, 98, 100), (70, 170, 164), (216, 170, 60), (146, 92, 52), (250, 206, 164), (232, 174, 126), "wanderer-female-v2.png", female=True)
draw_character((106, 84, 156), (78, 60, 118), (140, 120, 190), (200, 190, 150), (70, 52, 40), (238, 186, 140), (214, 152, 108), "npc-rowan-v2.png")
draw_character((66, 110, 180), (46, 82, 138), (104, 148, 214), (216, 170, 60), (44, 40, 52), (250, 208, 168), (230, 176, 130), "npc-mira-v2.png")
draw_character((122, 116, 62), (92, 88, 46), (156, 150, 92), (170, 140, 90), (88, 60, 36), (240, 190, 144), (218, 158, 112), "npc-kael-v2.png")
print("characters v2 done")
