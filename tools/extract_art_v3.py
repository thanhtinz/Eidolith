# Art v3 — extract game assets DIRECTLY from the approved concept sheets
# (docs/ART-DIRECTION-v1.md) so the in-game look matches what was approved.
# Method: border flood-fill background removal (numpy), trim, gentle downscale,
# palette quantization to restore crisp pixel clusters.
import numpy as np
from PIL import Image, ImageEnhance
from collections import deque
import os
AC = "/home/hatch/workspace/eidolith/art-concepts"
OUT_T = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/tilesets"
OUT_P = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/props"
OUT_C = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/chars"
OUT_CR = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/creatures"
os.makedirs(OUT_CR, exist_ok=True)

def flood_bg_mask(rgb: np.ndarray, tol: int) -> np.ndarray:
    """True where pixel belongs to background connected to the border."""
    h, w, _ = rgb.shape
    bg = rgb[0, 0].astype(int)
    dist = np.abs(rgb.astype(int) - bg).sum(axis=2)
    cand = dist < tol * 3
    seen = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    return seen

def extract(img: Image.Image, tol=26) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"))
    bgmask = flood_bg_mask(rgb, tol)
    alpha = np.where(bgmask, 0, 255).astype(np.uint8)
    out = np.dstack([rgb, alpha])
    im = Image.fromarray(out, "RGBA")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

def finish(im: Image.Image, target_h: int, colors=110) -> Image.Image:
    from PIL import ImageFilter
    w, h = im.size
    scale = target_h / h
    im = im.resize((max(1, round(w * scale)), target_h), Image.LANCZOS)
    alpha = im.getchannel("A")
    rgb = im.convert("RGB").filter(ImageFilter.UnsharpMask(radius=2, percent=68, threshold=2))
    q = rgb.quantize(colors=colors, method=Image.MEDIANCUT).convert("RGB")
    out = q.convert("RGBA"); out.putalpha(alpha)
    return out

def diamond_tile(face: Image.Image) -> Image.Image:
    """face: cropped top-face image -> exact 64x32 tile, colors bled to the full
    frame so neighbouring tiles meet seamlessly (no dark grid gaps in-game)."""
    t = face.resize((64, 32), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (64, 32), 0)
    px = mask.load()
    for y in range(32):
        for x in range(64):
            if abs(x - 31.5) / 32 + abs(y - 15.5) / 16 <= 1.0: px[x, y] = 255
    t.putalpha(mask)
    return t

def tint(im: Image.Image, factor: float, green_boost=0.0) -> Image.Image:
    arr = np.asarray(im).astype(np.float32)
    arr[..., 0] *= factor; arr[..., 1] *= factor + green_boost; arr[..., 2] *= factor
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")

# ---------- Tileset sheet (1920x1280, dark bg) ----------
sheet = Image.open(f"{AC}/media-generation-eidolith-tileset-v1-0-645ae0a4-69a6-456e-b87a-1976ab451f87.webp")
cells = {
    "tile_grass": (60, 30, 480, 370), "tile_flower": (540, 30, 960, 370),
    "tile_stone": (1020, 30, 1440, 370), "tile_water": (1500, 30, 1900, 370),
    "house": (90, 420, 560, 880), "tree": (600, 400, 1010, 880), "tree2": (1010, 400, 1420, 880),
    "pine": (1470, 380, 1830, 880), "rock": (200, 900, 660, 1250), "bush": (740, 880, 1240, 1250),
    "crystal": (1400, 880, 1750, 1250),
}
raw = {}
for name, box in cells.items():
    raw[name] = extract(sheet.crop(box), tol=30)
    print(name, raw[name].size)
# Ground tiles: top face = upper part of the block; the face diamond spans full width, ~55% height.
def face_of(block: Image.Image) -> Image.Image:
    w, h = block.size
    ix, iy = int(w * 0.045), int(h * 0.03)  # inset: drop the sheet tile's outline pixels
    return block.crop((ix, iy, w - ix, int(h * 0.62) - iy))
def flatten(face: Image.Image) -> Image.Image:
    """Remove the sheet tile's low-frequency vignette shading (divide by a
    heavily blurred copy) so the face tiles seamlessly, keeping its texture."""
    from PIL import ImageFilter
    rgb = face.convert("RGB")
    low = rgb.filter(ImageFilter.GaussianBlur(radius=max(8, rgb.width // 3)))
    f = np.asarray(rgb).astype(np.float32); l = np.asarray(low).astype(np.float32)
    mean = l.reshape(-1, 3).mean(axis=0)
    flat = np.clip(f / np.maximum(l, 1.0) * mean, 0, 255).astype(np.uint8)
    return Image.fromarray(flat, "RGB")

def noise_tile(face: Image.Image, seed: int, dark: float = 1.0) -> Image.Image:
    """Resynthesise a seamless diamond tile from the face's own pixels:
    copy random 2x2 blocks so there is no per-tile vignette/quilt pattern
    and edges meet continuously. Colours stay exactly the sheet's palette."""
    rng = np.random.default_rng(seed)
    src = np.asarray(face.convert("RGB")).astype(np.float32)
    # drop outline-dark and sparkle-bright outliers from the sampling pool
    lum = src.mean(axis=2)
    lo, hi = np.percentile(lum, 6), np.percentile(lum, 97)
    pool = src[(lum >= lo) & (lum <= hi)]
    fh, fw, _ = src.shape
    out = np.zeros((32, 64, 3), dtype=np.float32)
    B = 3
    for by in range(0, 32, B):
        for bx in range(0, 64, B):
            sy = rng.integers(0, fh - B); sx = rng.integers(0, fw - B)
            blk = src[sy:sy+B, sx:sx+B].copy()
            bl = blk.mean(axis=2)
            blk[(bl < lo) | (bl > hi)] = pool[rng.integers(0, len(pool))]
            out[by:by+B, bx:bx+B] = blk[:32-by, :64-bx]
    # calm the grain: blend 55% sampled texture with its own 3x3 blur
    blur = np.zeros_like(out)
    pad = np.pad(out, ((1, 1), (1, 1), (0, 0)), mode="edge")
    for dy in range(3):
        for dx in range(3):
            blur += pad[dy:dy+32, dx:dx+64]
    out = out * 0.55 + (blur / 9.0) * 0.45
    out *= dark
    mask = Image.new("L", (64, 32), 0); px = mask.load()
    for y in range(32):
        for x in range(64):
            if abs(x - 31.5) / 32 + abs(y - 15.5) / 16 <= 1.0: px[x, y] = 255
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    im.putalpha(mask)
    return im
_gf = flatten(face_of(raw["tile_grass"]))
_gw, _gh = _gf.size
def _inner(cx_r, cy_r):
    # crop fully INSIDE the face diamond (|dx|/0.5 + |dy|/0.5 <= 0.92)
    cw, ch = int(_gw * 0.32), int(_gh * 0.32)
    cx, cy = int(_gw * cx_r), int(_gh * cy_r)
    return _gf.crop((cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2))
grass_variants = [diamond_tile(q) for q in (_inner(0.41, 0.45), _inner(0.59, 0.45), _inner(0.41, 0.55), _inner(0.59, 0.55))]
grass = grass_variants[0]
flower = diamond_tile(face_of(raw["tile_flower"]))
stone = diamond_tile(face_of(raw["tile_stone"]))
_wb = raw["tile_water"]; _ww, _wh = _wb.size
water = diamond_tile(_wb.crop((0, int(_wh * 0.45), int(_ww * 0.66), _wh)))
dark_variants = [tint(grass_variants[1], 0.93), tint(grass_variants[3], 0.93)]
tiles = [grass_variants[0], stone, water, flower, tint(grass, 0.6, 0.03),
         grass_variants[1], grass_variants[2], grass_variants[3], dark_variants[0], dark_variants[1]]
sheet_out = Image.new("RGBA", (320, 64), (0, 0, 0, 0))
for i, t in enumerate(tiles): sheet_out.paste(t, ((i % 5) * 64, (i // 5) * 32), t)
sheet_out.save(f"{OUT_T}/verdant-v4.png")
finish(raw["house"], 200).save(f"{OUT_P}/house-v3.png")
finish(raw["tree"], 180).save(f"{OUT_P}/tree-v3.png")
finish(raw["pine"], 190).save(f"{OUT_P}/pine-v3.png")
finish(raw["rock"], 70).save(f"{OUT_P}/rock-v3.png")
finish(raw["bush"], 66).save(f"{OUT_P}/bush-v3.png")
finish(raw["crystal"], 90).save(f"{OUT_P}/crystal-v3.png")
print("tileset + props v3 done")
# ---------- Wanderer sheets (1920x1280, cream bg): front panel ----------
male = Image.open(f"{AC}/media-generation-eidolith-wanderer-v1-0-c45c94c6-3405-4e6a-8c69-13cfba2c5406.webp")
female = Image.open(f"{AC}/media-generation-eidolith-wanderer-female-v1-0-b6bb5f9c-739d-45c8-be32-33cc5a3aac2c.webp")
m = extract(male.crop((30, 60, 600, 1240)), tol=22)
f = extract(female.crop((20, 40, 580, 1240)), tol=22)
print("wanderer crops:", m.size, f.size)
finish(m, 208).save(f"{OUT_C}/wanderer-v3.png")
finish(f, 208).save(f"{OUT_C}/wanderer-female-v3.png")
# ---------- Creatures sheet (2736x912, cream bg): 4 in a row ----------
cre = Image.open(f"{AC}/media-generation-eidolith-creatures-v1-0-ad253a18-8d36-4c07-aff9-3271edf0b4ef.webp")
names = ["emberling", "mossling", "aquafin", "zephy"]
for i, name in enumerate(names):
    cell = cre.crop((i * 684, 60, (i + 1) * 684, 880))
    c = extract(cell, tol=22)
    print(name, c.size)
    finish(c, 170).save(f"{OUT_CR}/{name}-v1.png")
print("ALL v3 extraction done")

# ---------- NPC sheet (1920x1280, cream bg): 3 figures in a row ----------
npc_sheet = Image.open(f"{AC}/media-generation-eidolith-npcs-v1-0-9b0c18d2-7b51-4ee6-97a6-e6381c2a1ef7.webp")
for i, name in enumerate(["npc-rowan-v4", "npc-mira-v4", "npc-kael-v4"]):
    cell = npc_sheet.crop((i * 640 + 10, 40, (i + 1) * 640 - 10, 1240))
    c = extract(cell, tol=22)
    print(name, c.size)
    finish(c, 208).save(f"{OUT_C}/{name}.png")
print("NPC v4 done")
