# Rich surfaces batch 2 (2026-11-13, approved after the grass/dirt
# golden pair): the remaining 9 surfaces from two 2x2 texture
# sheets + a full-frame plank sheet, processed with the exact v3
# recipe. The shallow-water quadrant came back as a shoreline
# scene, so its crop takes only the open-water area.
from PIL import Image, ImageEnhance
import numpy as np

GEN = "/home/hatch/workspace/eidolith/shots/props-rebuild/gen"
D = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
LAND = f"{GEN}/media-generation-surface-sheet-land-0-59f83305-baeb-4796-ae7b-124105e4a02d.webp"
WATER = f"{GEN}/media-generation-surface-sheet-water-rock-0-5e08f77f-c269-4250-b3e2-fbb94d0cf890.webp"
PLANK = f"{GEN}/media-generation-surface-plank-rich-0-734db2e7-518c-4eb3-aca6-6c72a2e1664d.webp"

def roll_blend(im, dx, dy, w):
    a = np.asarray(im).astype(np.float32)
    b = np.roll(a, (dy, dx), axis=(0, 1))
    return Image.fromarray(((a * (1 - w) + b * w)).astype(np.uint8))

def finish(c, name, bright, sat):
    c = c.resize((512, 512), Image.LANCZOS)
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

def quad(sheet, col, row, frac=0.64):
    W, H = sheet.size
    qw, qh = W // 2, H // 2
    mx, my = qw * (1 - frac) / 2, qh * (1 - frac) / 2
    return sheet.crop((int(col * qw + mx), int(row * qh + my),
                       int((col + 1) * qw - mx), int((row + 1) * qh - my)))

land = Image.open(LAND).convert("RGB")
finish(quad(land, 0, 0), "dark", 0.92, 1.0)
finish(quad(land, 1, 0), "flower", 1.06, 1.0)
finish(quad(land, 0, 1), "sand", 1.08, 0.92)
finish(quad(land, 1, 1), "stone", 1.04, 0.8)

water = Image.open(WATER).convert("RGB")
finish(quad(water, 0, 0), "deep", 1.0, 1.0)
W, H = water.size
shallow = water.crop((int(W * 0.5 + W * 0.24), int(H * 0.02),
                      int(W * 0.995), int(H * 0.26)))
finish(shallow, "shallow", 1.06, 0.98)
finish(quad(water, 0, 1), "swamp", 1.0, 0.95)
finish(quad(water, 1, 1), "rock", 1.03, 0.75)

plank = Image.open(PLANK).convert("RGB")
S = min(plank.size)
pc = plank.crop(((plank.width - S) // 2, (plank.height - S) // 2,
                 (plank.width + S) // 2, (plank.height + S) // 2))
finish(pc.crop((S // 5, S // 5, S - S // 5, S - S // 5)), "plank", 1.02, 0.92)
print("done")
