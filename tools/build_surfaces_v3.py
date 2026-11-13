# Rich-detail surfaces (2026-11-13): Tín compared the ground with
# the BDSP reference — ours was seamless but FLAT; the reference
# ground is dense with fine detail. New surfaces are generated
# paintings (dense blades / pebbles), tone-matched to the game's
# palette, centre-cropped (no edge vignette), mirrored seamless,
# one light roll-blend to break symmetry, fine pixel-lean (0.85)
# and a wide palette (192) so the detail survives.
from PIL import Image, ImageEnhance
import numpy as np

GEN = "/home/hatch/workspace/eidolith/shots/props-rebuild/gen"
D = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
JOBS = [
    ("grass", f"{GEN}/media-generation-surface-grass-rich-0-7ec01257-d210-4706-90ab-e35b3a4ae353.webp", 1.16, 0.94),
    ("dirt", f"{GEN}/media-generation-surface-dirt-rich-0-4e28fb7f-520d-44ef-9034-288747f371f5.webp", 1.10, 0.88),
]

def roll_blend(im, dx, dy, w):
    a = np.asarray(im).astype(np.float32)
    b = np.roll(a, (dy, dx), axis=(0, 1))
    return Image.fromarray(((a * (1 - w) + b * w)).astype(np.uint8))

for name, path, bright, sat in JOBS:
    src = Image.open(path).convert("RGB")
    S = min(src.size)
    c = src.crop(((src.width - S) // 2, (src.height - S) // 2,
                  (src.width + S) // 2, (src.height + S) // 2))
    c = c.crop((S // 5, S // 5, S - S // 5, S - S // 5)).resize((512, 512), Image.LANCZOS)
    c = ImageEnhance.Brightness(c).enhance(bright)
    c = ImageEnhance.Color(c).enhance(sat)
    big = Image.new("RGB", (1024, 1024))
    big.paste(c, (0, 0))
    big.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (512, 0))
    big.paste(c.transpose(Image.FLIP_TOP_BOTTOM), (0, 512))
    big.paste(c.transpose(Image.ROTATE_180), (512, 512))
    big = roll_blend(big, 389, 173, 0.18)
    big = big.resize((870, 870), Image.LANCZOS).resize((1024, 1024), Image.NEAREST)
    big = big.quantize(colors=192, method=Image.MEDIANCUT).convert("RGB")
    big.save(f"{D}/surf-{name}.png")
    print(name, "-> rich surface installed")
print("done")
