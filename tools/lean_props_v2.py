# Pixel-crisp treatment for prop sprites (Tín, 2026-11-12: "cây cối
# nhà cửa, giếng rất xấu lem lem"). Measured cause: the v4 family
# carries 8-12k SEMI-TRANSPARENT fringe pixels per sprite (soft halo
# from extraction) and the v1 family keeps smooth painterly gradients
# (124+ colours). Treatment: hard alpha cut (deep enough to remove
# the bg-blended fringe), pixel-lean (down to 52% averaged, NEAREST
# back), hard quantize to 56 colours from the opaque palette only.
# Output bumps the version suffix; originals stay on disk for revert.
from PIL import Image
import numpy as np
import os

D = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"
V4 = ["tree", "pine", "house", "rock", "bush"]
V1 = ["stall", "lantern", "signpost", "crates", "well", "board", "basket",
      "pots", "shrine", "runes", "cluster", "planter", "hive", "dummy",
      "stump", "shrooms", "darkwood", "willow", "blossom", "elder",
      "dead", "autumn", "house2", "house3"]
ALPHA_CUT = 165
LEAN = 0.52
COLORS = 56

def treat(src_path, out_path):
    im = Image.open(src_path).convert("RGBA")
    a = np.asarray(im).astype(np.int32)
    semi_before = int(((a[..., 3] > 0) & (a[..., 3] < 255)).sum())
    # hard alpha cut
    alpha = np.where(a[..., 3] >= ALPHA_CUT, 255, 0).astype(np.uint8)
    rgb = Image.fromarray(a[..., :3].astype(np.uint8))
    w, h = im.size
    # pixel-lean on colour AND alpha together so edges stay registered
    small = im.resize((max(8, round(w * LEAN)), max(8, round(h * LEAN))), Image.LANCZOS)
    big = small.resize((w, h), Image.NEAREST)
    ba = np.asarray(big)
    alpha = np.where(ba[..., 3] >= ALPHA_CUT, 255, 0).astype(np.uint8)
    rgb = Image.fromarray(ba[..., :3].astype(np.uint8))
    # quantize using a palette built from opaque pixels only
    mask = alpha > 0
    if mask.sum() == 0:
        return semi_before, 0, 0
    strip = Image.fromarray(np.asarray(rgb)[mask].reshape(1, -1, 3).astype(np.uint8))
    pal = strip.quantize(colors=COLORS, method=Image.MEDIANCUT)
    q = rgb.quantize(palette=pal, dither=Image.NONE)
    out_rgb = np.asarray(q.convert("RGB"))
    out = np.dstack([out_rgb, alpha]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(out_path)
    colors_after = len(set(map(tuple, out_rgb[mask].reshape(-1, 3))))
    return semi_before, 0, colors_after

for name in V4:
    sb, sa, ca = treat(f"{D}/{name}-v4.png", f"{D}/{name}-v5.png")
    print(f"{name}: v4->v5  semi {sb}->{sa}  colors->{ca}")
for name in V1:
    sb, sa, ca = treat(f"{D}/{name}-v1.png", f"{D}/{name}-v2.png")
    print(f"{name}: v1->v2  semi {sb}->{sa}  colors->{ca}")
print("done")
