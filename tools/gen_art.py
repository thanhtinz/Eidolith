# Phase 2 placeholder art — generated pixel tiles/sprites (real production art follows Part 14 bible later).
from PIL import Image, ImageDraw
import random
random.seed(42)
OUT_T = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
OUT_P = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"

def diamond(draw, cx, cy, w, h, color, speckle=None):
    draw.polygon([(cx, cy - h//2), (cx + w//2, cy), (cx, cy + h//2), (cx - w//2, cy)], fill=color)
    if speckle:
        for _ in range(26):
            x = cx + random.randint(-w//3, w//3); y = cy + random.randint(-h//4, h//4)
            if abs(x-cx)/(w/2) + abs(y-cy)/(h/2) < 0.9:
                draw.point((x, y), fill=speckle)

# Tileset: 6 tiles of 64x32 in a 192x64 sheet (gid 1..6)
# 1 grass light, 2 grass dark, 3 path, 4 water, 5 flower meadow, 6 forest floor
img = Image.new("RGBA", (192, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
tiles = [((96,160,84),(74,128,62)), ((74,134,60),(56,106,46)), ((178,152,104),(150,124,78)),
         ((74,120,180),(52,96,150)), ((104,164,88),(80,132,64)), ((62,110,58),(44,88,44))]
for i, (base, speck) in enumerate(tiles):
    cx = (i % 3) * 64 + 32; cy = (i // 3) * 32 + 16
    diamond(d, cx, cy, 64, 32, base + (255,), speck + (255,))
# flowers on tile 5 (index 4)
for (fx, fy) in [(140, 40), (152, 48), (132, 52), (146, 58)]:
    d.point((fx, fy), fill=(240, 120, 160, 255)); d.point((fx+1, fy), fill=(250, 220, 120, 255))
img.save(f"{OUT_T}/verdant.png")

def save(img, name): img.save(f"{OUT_P}/{name}")

# Tree prop 72x104
t = Image.new("RGBA", (72, 104), (0,0,0,0)); d = ImageDraw.Draw(t)
d.rectangle([32, 66, 40, 100], fill=(96, 66, 40, 255))
for (x, y, r, c) in [(36, 34, 30, (44, 110, 50)), (20, 44, 18, (56, 128, 60)), (52, 44, 18, (38, 98, 44)), (36, 18, 16, (66, 140, 68))]:
    d.ellipse([x-r, y-r, x+r, y+r], fill=c + (255,))
save(t, "tree.png")
# Pine 64x110
t = Image.new("RGBA", (64, 110), (0,0,0,0)); d = ImageDraw.Draw(t)
d.rectangle([28, 84, 36, 106], fill=(90, 60, 36, 255))
for (y0, w) in [(58, 30), (36, 24), (14, 17)]:
    d.polygon([(32, y0-16), (32+w, y0+22), (32-w, y0+22)], fill=(36, 92, 52, 255))
save(t, "pine.png")
# House 128x120 (footprint ~2x2 tiles)
t = Image.new("RGBA", (128, 120), (0,0,0,0)); d = ImageDraw.Draw(t)
d.rectangle([18, 52, 110, 112], fill=(196, 164, 120, 255))
d.rectangle([18, 52, 110, 60], fill=(170, 138, 96, 255))
d.polygon([(8, 56), (64, 12), (120, 56)], fill=(150, 74, 52, 255))
d.polygon([(8, 56), (64, 12), (120, 56), (120, 64), (64, 20), (8, 64)], fill=(168, 86, 60, 255))
d.rectangle([54, 78, 74, 112], fill=(110, 74, 44, 255))
d.rectangle([28, 66, 44, 82], fill=(120, 180, 210, 255)); d.rectangle([84, 66, 100, 82], fill=(120, 180, 210, 255))
save(t, "house.png")
# Rock 56x40
t = Image.new("RGBA", (56, 40), (0,0,0,0)); d = ImageDraw.Draw(t)
d.polygon([(6, 34), (12, 12), (30, 4), (48, 12), (52, 34)], fill=(128, 128, 134, 255))
d.polygon([(12, 12), (30, 4), (32, 34), (6, 34)], fill=(150, 150, 156, 255))
save(t, "rock.png")
# Bush 56x40
t = Image.new("RGBA", (56, 40), (0,0,0,0)); d = ImageDraw.Draw(t)
for (x, y, r) in [(16, 26, 12), (30, 20, 14), (42, 27, 11)]:
    d.ellipse([x-r, y-r, x+r, y+r], fill=(58, 122, 56, 255))
save(t, "bush.png")
print("art generated")
