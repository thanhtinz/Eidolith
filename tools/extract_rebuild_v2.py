# Batch extraction for the full prop rebuild (sheets B-E), same
# pipeline as extract_rebuild_v1.py: chroma key -> largest component
# -> 1px erosion -> hard alpha -> lean 0.72 -> quantize 72 ->
# height normalized to the current sprite.
from PIL import Image
import numpy as np
from collections import deque

GEN = "/home/hatch/workspace/eidolith/shots/props-rebuild/gen"
D = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"
SHEETS = [
    (f"{GEN}/media-generation-prop-sheet-forest-trees-0-2591aff8-adfe-461b-a14e-1ccec02c76cc.webp", [
        ("darkwood", 0, 0), ("willow", 1, 0), ("blossom", 2, 0),
        ("elder", 0, 1), ("dead", 1, 1), ("autumn", 2, 1)]),
    (f"{GEN}/media-generation-prop-sheet-village-dressing-0-4e5a6af1-b93f-4419-8318-75c9ad1a9407.webp", [
        ("house2", 0, 0), ("house3", 1, 0), ("signpost", 2, 0),
        ("crates", 0, 1), ("board", 1, 1), ("basket", 2, 1)]),
    (f"{GEN}/media-generation-prop-sheet-sanctuary-nature-0-fe4e55c4-659c-4609-84ea-108ad3fae43f.webp", [
        ("shrine", 0, 0), ("runes", 1, 0), ("cluster", 2, 0),
        ("planter", 0, 1), ("hive", 1, 1), ("pots", 2, 1)]),
    (f"{GEN}/media-generation-prop-sheet-cave-small-0-2cd44f15-20cf-41c8-ac3e-d72c68023837.webp", [
        ("rock", 0, 0), ("bush", 1, 0), ("dummy", 2, 0),
        ("stump", 0, 1), ("shrooms", 1, 1)]),
]
CUR = {  # current file -> new file
    **{n: (f"{n}-v2.png", f"{n}-v3.png") for n in
       ["darkwood", "willow", "blossom", "elder", "dead", "autumn",
        "house2", "house3", "signpost", "crates", "board", "basket",
        "shrine", "runes", "cluster", "planter", "hive", "pots",
        "dummy", "stump", "shrooms"]},
    "rock": ("rock-v5.png", "rock-v6.png"),
    "bush": ("bush-v5.png", "bush-v6.png"),
}

def largest_component(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best = None
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not seen[y, x]:
                q = deque([(y, x)]); seen[y, x] = True; cells = []
                while q:
                    cy, cx = q.popleft(); cells.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q.append((ny, nx))
                if best is None or len(cells) > len(best):
                    best = cells
    out = np.zeros_like(mask)
    for (y, x) in best:
        out[y, x] = True
    return out

for sheet_path, items in SHEETS:
    img = Image.open(sheet_path).convert("RGB")
    W, H = img.size
    a = np.asarray(img).astype(np.int32)
    dist = np.abs(a[..., 0] - 255) + np.abs(a[..., 1]) + np.abs(a[..., 2] - 255)
    fg = dist > 110
    cw, ch = W // 3, H // 2
    for name, col, row in items:
        cell_fg = fg[row * ch:(row + 1) * ch, col * cw:(col + 1) * cw]
        comp = largest_component(cell_fg)
        ys, xs = np.nonzero(comp)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        cell_img = img.crop((col * cw + x0, row * ch + y0, col * cw + x1, row * ch + y1))
        alpha = (comp[y0:y1, x0:x1] * 255).astype(np.uint8)
        er = alpha.copy()
        er[1:, :] = np.minimum(er[1:, :], alpha[:-1, :])
        er[:-1, :] = np.minimum(er[:-1, :], alpha[1:, :])
        er[:, 1:] = np.minimum(er[:, 1:], alpha[:, :-1])
        er[:, :-1] = np.minimum(er[:, :-1], alpha[:, 1:])
        sprite = Image.fromarray(np.dstack([np.asarray(cell_img), er]), "RGBA")
        cur, new = CUR[name]
        target_h = Image.open(f"{D}/{cur}").height
        scale = target_h / sprite.height
        sprite = sprite.resize((round(sprite.width * scale), target_h), Image.LANCZOS)
        w2, h2 = sprite.size
        sprite = sprite.resize((max(8, round(w2 * 0.72)), max(8, round(h2 * 0.72))), Image.LANCZOS).resize((w2, h2), Image.NEAREST)
        arr = np.asarray(sprite).copy()
        arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
        mask = arr[..., 3] > 0
        strip = Image.fromarray(arr[..., :3][mask].reshape(1, -1, 3).astype(np.uint8))
        pal = strip.quantize(colors=72, method=Image.MEDIANCUT)
        q = Image.fromarray(arr[..., :3]).quantize(palette=pal, dither=Image.NONE).convert("RGB")
        out = np.dstack([np.asarray(q), arr[..., 3]]).astype(np.uint8)
        semi = int(((out[..., 3] > 0) & (out[..., 3] < 255)).sum())
        Image.fromarray(out, "RGBA").save(f"{D}/{new}")
        print(f"{name}: -> {new}  size={sprite.size}  semi={semi}")
print("done")
