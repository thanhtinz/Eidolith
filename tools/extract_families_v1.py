# Extracts the per-map sprite FAMILIES sheet (darkwood / willow / blossom /
# elder / dead / autumn trees + slate + thatch houses) into
# apps/game-client/public/assets/props/<name>-v1.png. Same flood-fill
# method as extract_props_v1.py: cream background connected to the crop
# border becomes transparent; the background colour is sampled from the
# SHEET corner, never from inside a crop (the beehive lesson).
from collections import deque
import glob
from PIL import Image

SHEET = sorted(glob.glob("/home/hatch/workspace/eidolith/shots/npc-mock/gen/media-generation-prop-families-v1-*.webp"))[-1]
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"

ITEMS = {
    "darkwood": ((0.010, 0.030, 0.260, 0.500), 185),
    "willow":   ((0.300, 0.050, 0.490, 0.500), 190),
    "blossom":  ((0.520, 0.070, 0.750, 0.500), 180),
    "elder":    ((0.748, 0.030, 0.990, 0.520), 215),
    "dead":     ((0.020, 0.550, 0.240, 0.970), 175),
    "autumn":   ((0.280, 0.550, 0.510, 0.960), 185),
    "house2":   ((0.530, 0.600, 0.760, 0.940), 200),
    "house3":   ((0.800, 0.630, 0.980, 0.930), 185),
}

def extract(frac, target_h):
    im = Image.open(SHEET).convert("RGB")
    W, H = im.size
    bg = im.getpixel((4, 4))
    x0, y0 = int(frac[0] * W), int(frac[1] * H)
    x1, y1 = int(frac[2] * W), int(frac[3] * H)
    crop = im.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    px = crop.load()
    def dist(x, y):
        p = px[x, y]
        return sum(abs(p[i] - bg[i]) for i in range(3))
    def near_bg(x, y):
        # Exterior flood at a moderate threshold (fringe + soft shadow).
        return dist(x, y) < 85
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
            # Flooded exterior OR enclosed cream pocket (canopy see-through
            # holes are painted with the sheet's own background colour, so
            # a hard key catches what the flood cannot reach).
            if alpha[y][x] == 0 or dist(x, y) < 38:
                op[x, y] = (0, 0, 0, 0)
    out = out.crop(out.getbbox())
    ow, oh = out.size
    nw = max(8, round(ow * target_h / oh))
    out = out.resize((nw, target_h), Image.LANCZOS)
    out = out.resize((max(4, nw // 2), max(4, target_h // 2)), Image.LANCZOS).resize((nw, target_h), Image.NEAREST)
    # Component cleanup: detached components under 4% of the main mass are
    # removed — a sprite in game must be ONE grounded object. (Size alone
    # is not the test: blossom shipped a 524px leaf cluster floating 13px
    # off its canopy because its twig was eaten in the flood — 3.75%.)
    al = out.split()[3]
    aw, ah = out.size
    apx = al.load()
    seen = [[False] * aw for _ in range(ah)]
    comps = []
    for yy in range(ah):
        for xx in range(aw):
            if apx[xx, yy] > 110 and not seen[yy][xx]:
                stack = [(xx, yy)]; seen[yy][xx] = True; cells = []
                while stack:
                    cx, cy = stack.pop(); cells.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < aw and 0 <= ny < ah and not seen[ny][nx] and apx[nx, ny] > 110:
                            seen[ny][nx] = True; stack.append((nx, ny))
                comps.append(cells)
    if comps:
        keep_min = max(30, int(max(len(c) for c in comps) * 0.04))
        dropped = 0
        for cells in comps:
            if len(cells) < keep_min:
                dropped += 1
                for (cx, cy) in cells:
                    apx[cx, cy] = 0
        if dropped: print("  cleaned", dropped, "specks")
    out.putalpha(al)
    rgb = out.convert("RGB").quantize(colors=128).convert("RGB")
    rgb.putalpha(out.split()[3].point(lambda v: 255 if v > 110 else 0))
    return rgb

for name, (frac, th) in ITEMS.items():
    img = extract(frac, th)
    img.save(f"{OUT}/{name}-v1.png")
    print(name, img.size)
print("done")
