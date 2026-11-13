# Extracts 16 dressing props from the two approved-style prop sheets
# (shots/npc-mock/gen media-generation-props-sheet-{village,sanctuary}-*.webp)
# into apps/game-client/public/assets/props/<name>-v1.png.
# Method: crop a generous region per item, flood-fill the cream background
# from the region borders (near-bg pixels connected to the edge become
# transparent; enclosed light parts like notice-board paper survive),
# trim to the opaque bbox, scale to the target height, pixel-lean
# (0.5x LANCZOS -> NEAREST back up), quantize RGB keeping binary alpha.
from collections import deque
import glob
from PIL import Image

VILLAGE = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/npc-mock/gen/media-generation-props-sheet-village-*.webp"))[-1]
SANCT = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/npc-mock/gen/media-generation-props-sheet-sanctuary-*.webp"))[-1]
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"

# name -> (sheet, (x0, y0, x1, y1) fractions, target height px)
ITEMS = {
    "stall":    (VILLAGE, (0.015, 0.075, 0.255, 0.500), 190),
    "lantern":  (VILLAGE, (0.578, 0.095, 0.633, 0.485), 175),
    "signpost": (VILLAGE, (0.657, 0.115, 0.790, 0.485), 135),
    "crates":   (VILLAGE, (0.802, 0.275, 0.982, 0.500), 115),
    "well":     (VILLAGE, (0.020, 0.555, 0.223, 0.915), 175),
    "board":    (VILLAGE, (0.458, 0.605, 0.642, 0.865), 125),
    "basket":   (VILLAGE, (0.652, 0.685, 0.802, 0.865), 95),
    "pots":     (VILLAGE, (0.812, 0.660, 0.978, 0.865), 95),
    "shrine":   (SANCT, (0.025, 0.125, 0.197, 0.435), 185),
    "runes":    (SANCT, (0.217, 0.115, 0.427, 0.435), 175),
    "cluster":  (SANCT, (0.447, 0.105, 0.592, 0.435), 165),
    "planter":  (SANCT, (0.612, 0.155, 0.818, 0.415), 115),
    "hive":     (SANCT, (0.852, 0.135, 0.950, 0.415), 155),
    "dummy":    (SANCT, (0.028, 0.525, 0.165, 0.920), 165),
    "stump":    (SANCT, (0.165, 0.610, 0.330, 0.885), 125),
    "shrooms":  (SANCT, (0.497, 0.605, 0.637, 0.865), 105),
}

def extract(sheet_path, frac, target_h):
    im = Image.open(sheet_path).convert("RGB")
    W, H = im.size
    # Background = the sheet's own corner colour. Sampling inside the crop
    # is unsafe: the beehive crop's corner lands on a bee, which once made
    # the flood fill match nothing and left an opaque cream card.
    bg = im.getpixel((4, 4))
    x0, y0 = int(frac[0] * W), int(frac[1] * H)
    x1, y1 = int(frac[2] * W), int(frac[3] * H)
    crop = im.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    px = crop.load()
    def near_bg(x, y):
        p = px[x, y]
        return sum(abs(p[i] - bg[i]) for i in range(3)) < 110
    # flood from borders through near-bg pixels -> transparent
    alpha = [[255] * cw for _ in range(ch)]
    seen = [[False] * cw for _ in range(ch)]
    q = deque()
    for x in range(cw):
        q.append((x, 0)); q.append((x, ch - 1))
    for y in range(ch):
        q.append((0, y)); q.append((cw - 1, y))
    while q:
        x, y = q.popleft()
        if seen[y][x] or not near_bg(x, y):
            continue
        seen[y][x] = True
        alpha[y][x] = 0
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < cw and 0 <= ny < ch and not seen[ny][nx]:
                q.append((nx, ny))
    out = crop.convert("RGBA")
    op = out.load()
    for y in range(ch):
        for x in range(cw):
            if alpha[y][x] == 0:
                op[x, y] = (0, 0, 0, 0)
    bbox = out.getbbox()
    out = out.crop(bbox)
    ow, oh = out.size
    nw = max(8, round(ow * target_h / oh))
    out = out.resize((nw, target_h), Image.LANCZOS)
    out = out.resize((max(4, nw // 2), max(4, target_h // 2)), Image.LANCZOS).resize((nw, target_h), Image.NEAREST)
    rgb = out.convert("RGB").quantize(colors=128).convert("RGB")
    a = out.split()[3].point(lambda v: 255 if v > 110 else 0)
    rgb.putalpha(a)
    return rgb

for name, (sheet, frac, th) in ITEMS.items():
    img = extract(sheet, frac, th)
    img.save(f"{OUT}/{name}-v1.png")
    print(name, img.size)
print("done")
