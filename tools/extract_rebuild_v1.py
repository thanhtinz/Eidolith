# Extracts the rebuilt prop sheet (flat magenta bg) into game sprites:
# chroma-key -> largest component per cell -> 1px edge erosion (eats
# the pink-blended outline ring) -> hard alpha -> gentle pixel-lean
# + quantize -> height normalized to the CURRENT sprite's height so
# every placement/scale contract in the maps stays identical.
from PIL import Image
import numpy as np
from collections import deque

SHEET = "/home/hatch/workspace/eidolith/shots/props-rebuild/gen/media-generation-prop-sheet-village-core-0-24c73b7a-94e3-4a3a-b843-2f0c30e1ecaf.webp"
D = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"
ITEMS = [  # name, col, row, current file (for target height), new file
    ("house", 0, 0, "house-v5.png", "house-v6.png"),
    ("tree", 1, 0, "tree-v5.png", "tree-v6.png"),
    ("pine", 2, 0, "pine-v5.png", "pine-v6.png"),
    ("well", 0, 1, "well-v2.png", "well-v3.png"),
    ("stall", 1, 1, "stall-v2.png", "stall-v3.png"),
    ("lantern", 2, 1, "lantern-v2.png", "lantern-v3.png"),
]

img = Image.open(SHEET).convert("RGB")
W, H = img.size
a = np.asarray(img).astype(np.int32)
# magenta key: strong red+blue, weak green
dist = np.abs(a[..., 0] - 255) + np.abs(a[..., 1] - 0) + np.abs(a[..., 2] - 255)
fg = dist > 110

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

for name, col, row, cur, new in ITEMS:
    cw, ch = W // 3, H // 2
    cell_fg = fg[row * ch:(row + 1) * ch, col * cw:(col + 1) * cw]
    comp = largest_component(cell_fg)
    ys, xs = np.nonzero(comp)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cell_img = img.crop((col * cw + x0, row * ch + y0, col * cw + x1, row * ch + y1))
    alpha = (comp[y0:y1, x0:x1] * 255).astype(np.uint8)
    # erode 1px: drop opaque pixels touching transparency
    er = alpha.copy()
    er[1:, :] = np.minimum(er[1:, :], alpha[:-1, :])
    er[:-1, :] = np.minimum(er[:-1, :], alpha[1:, :])
    er[:, 1:] = np.minimum(er[:, 1:], alpha[:, :-1])
    er[:, :-1] = np.minimum(er[:, :-1], alpha[:, 1:])
    rgba = np.dstack([np.asarray(cell_img), er])
    sprite = Image.fromarray(rgba, "RGBA")
    # normalize height to the current sprite's height
    target_h = Image.open(f"{D}/{cur}").height
    scale = target_h / sprite.height
    sprite = sprite.resize((round(sprite.width * scale), target_h), Image.LANCZOS)
    # gentle lean + quantize for one pixel language
    w2, h2 = sprite.size
    sprite = sprite.resize((max(8, round(w2 * 0.72)), max(8, round(h2 * 0.72))), Image.LANCZOS).resize((w2, h2), Image.NEAREST)
    arr = np.asarray(sprite).copy()
    arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
    rgb = Image.fromarray(arr[..., :3])
    mask = arr[..., 3] > 0
    strip = Image.fromarray(arr[..., :3][mask].reshape(1, -1, 3).astype(np.uint8))
    pal = strip.quantize(colors=72, method=Image.MEDIANCUT)
    q = rgb.quantize(palette=pal, dither=Image.NONE).convert("RGB")
    out = np.dstack([np.asarray(q), arr[..., 3]]).astype(np.uint8)
    semi = int(((out[..., 3] > 0) & (out[..., 3] < 255)).sum())
    Image.fromarray(out, "RGBA").save(f"{D}/{new}")
    print(f"{name}: -> {new}  size={sprite.size}  semi={semi}")
print("done")
