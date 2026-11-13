# De-gridded surface textures (2026-11-13). The v1 frame-based
# surfaces repeat one 64px tile frame: its dark rim vignette prints
# a visible GRID over every field ("vẫn còn ô vuông"), and mirror
# seams concentrate dark features into lines. v2 rebuilds every
# surface from the INTERIOR of the v1 texture (no rim, no seam
# lines in the crop), pixel-leans it, mirrors it (featureless
# interior -> invisible mirrors) and roll-blends a shifted copy to
# break any remaining periodicity. Same output filenames.
from PIL import Image
import numpy as np

D = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
NAMES = ["grass", "dark", "flower", "stone", "deep", "shallow",
         "sand", "dirt", "swamp", "rock", "plank"]

def roll_blend(im, dx, dy, w):
    a = np.asarray(im).astype(np.float32)
    b = np.roll(a, (dy, dx), axis=(0, 1))
    return Image.fromarray(((a * (1 - w) + b * w)).astype(np.uint8))

for name in NAMES:
    src = Image.open(f"{D}/surf-{name}.png").convert("RGB")
    S = src.width
    # interior crop: away from texture edges AND the mirror seam
    # lines at S/2 — pure frame interior, no vignette rim.
    m = int(S * 0.18)
    inner = src.crop((m, m, S // 2 - 8, S // 2 - 8))
    t = inner.resize((512, 512), Image.LANCZOS)
    t = t.resize((256, 256), Image.LANCZOS).resize((512, 512), Image.NEAREST)
    # mirror to 1024 (interior is featureless -> mirrors invisible)
    big = Image.new("RGB", (1024, 1024))
    big.paste(t, (0, 0))
    big.paste(t.transpose(Image.FLIP_LEFT_RIGHT), (512, 0))
    big.paste(t.transpose(Image.FLIP_TOP_BOTTOM), (0, 512))
    big.paste(t.transpose(Image.ROTATE_180), (512, 512))
    big = roll_blend(big, 397, 211, 0.35)
    big = roll_blend(big, 733, 509, 0.22)
    big = big.quantize(colors=144, method=Image.MEDIANCUT).convert("RGB")
    big.save(f"{D}/surf-{name}.png")
    print(name, "-> de-gridded 1024")
print("done")
