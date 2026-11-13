# Builds surf-<name>.png: SEAMLESS surface textures for the continuous
# ground bake (WorldScene paints surfaces through blurred masks — no
# tiles are drawn, so textures must wrap perfectly). Each surface is
# its tileset frame mirrored into a 256x256 wrap, then a rolled copy
# of itself is blended over at 35% to break the mirror symmetry.
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

SRC = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets/verdant-top-v5.png"
DIR = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
S = 64

sheet = Image.open(SRC).convert("RGB")

def frame(i):
    return sheet.crop(((i % 9) * S, (i // 9) * S, (i % 9) * S + S, (i // 9) * S + S))

def flatten(img, strength=0.78):
    # divide the frame by its own blurred self so the per-tile tonal
    # signature (bright centre, dark rim) disappears BEFORE mirroring —
    # otherwise the mirror quadrants print as a checker of soft squares.
    a = np.asarray(img).astype(np.float32)
    blur = np.asarray(img.filter(ImageFilter.GaussianBlur(9))).astype(np.float32)
    mean = a.mean(axis=(0, 1), keepdims=True)
    gain = np.clip(mean / np.maximum(blur, 1.0), 0.55, 1.8)
    out = a * (1.0 + (gain - 1.0) * strength)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def seamless(img):
    img = flatten(img)
    big = img.resize((256, 256), Image.NEAREST)
    out = Image.new("RGB", (512, 512))
    out.paste(big, (0, 0))
    out.paste(big.transpose(Image.FLIP_LEFT_RIGHT), (256, 0))
    out.paste(big.transpose(Image.FLIP_TOP_BOTTOM), (0, 256))
    out.paste(big.transpose(Image.ROTATE_180), (256, 256))
    arr = np.asarray(out)
    shifted = np.roll(arr, (131, 197), axis=(0, 1))
    blended = (arr.astype(np.float32) * 0.7 + shifted.astype(np.float32) * 0.3)
    return Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8))

def from_cell(path, col, row):
    # Big painted field straight from a source atlas cell (560x560):
    # centre crop, gentle flatten, mirror-wrap to 1024. The 64px tile
    # derived from this cell carried a strong per-tile vignette that
    # printed as a grid no matter how it was wrapped.
    img = Image.open(path).convert("RGB")
    cw, ch = img.size[0] // 4, img.size[1] // 2
    cell = img.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
    m = 70
    cell = cell.crop((m, m, cw - m, ch - m)).resize((512, 512), Image.LANCZOS)
    # PIXEL-LEAN (Tín, 2026-11-12: the raw painted cell read "mờ, lem"
    # in game): average down to half size, then NEAREST back up so the
    # grain becomes deliberate hard pixel blocks, and quantize hard.
    cell = cell.resize((256, 256), Image.LANCZOS).resize((512, 512), Image.NEAREST)
    cell = flatten(cell, 0.55)
    out = Image.new("RGB", (1024, 1024))
    out.paste(cell, (0, 0))
    out.paste(cell.transpose(Image.FLIP_LEFT_RIGHT), (512, 0))
    out.paste(cell.transpose(Image.FLIP_TOP_BOTTOM), (0, 512))
    out.paste(cell.transpose(Image.ROTATE_180), (512, 512))
    arr = np.asarray(out).astype(np.float32)
    shifted = np.roll(arr, (211, 337), axis=(0, 1))
    out = Image.fromarray(np.clip(arr * 0.75 + shifted * 0.25, 0, 255).astype(np.uint8))
    return out.quantize(colors=128, method=Image.MEDIANCUT).convert("RGB")

GREENS = "/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-top-greens-0-f79308f8-9fea-4796-add4-f80853505880.webp"
SURFACES_SRC = "/home/hatch/workspace/eidolith/shots/tile-mock/gen/media-generation-tileset-top-surfaces-0-d3736978-3f19-48f6-bd96-1ed5db0ad36c.webp"

SURFACES = {
    "flower": frame(3),
    "stone": frame(1),
    "deep": frame(2),
    "sand": frame(10),
    "dirt": frame(11),
    "swamp": frame(14),
    "rock": frame(15),
    "plank": frame(16),
}
# shallow water = deep frame brightened + pushed cyan
shallow = frame(2)
shallow = ImageEnhance.Brightness(shallow).enhance(1.22)
r, g, b = shallow.split()
from PIL import ImageChops
g = ImageChops.add(g, Image.new("L", (S, S), 14), 1, 0)
b = ImageChops.add(b, Image.new("L", (S, S), 20), 1, 0)
SURFACES["shallow"] = Image.merge("RGB", (r, g, b))

for name, img in SURFACES.items():
    out = seamless(img)
    out.save(f"{DIR}/surf-{name}.png")
    print("wrote", name, out.size)

for name, img in {
    "grass": from_cell(GREENS, 0, 0),
    "dark": from_cell(GREENS, 1, 1),
    # dirt stays frame-based: the source cell's painted ovals read as
    # stains at field scale; the tile frame's speckle reads as pebbles.
}.items():
    img.save(f"{DIR}/surf-{name}.png")
    print("wrote", name, img.size, "(from source cell)")
