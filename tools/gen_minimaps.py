# Minimap renders for the HUD (docs/HUD-REDESIGN-v2.md): top-down grid view
# from the same Tiled JSON the world is built from. 5px per tile.
# Ground gids: 1/2 grass checker, 3 path/plaza, 4 water, 5 flower patch.
import json
from PIL import Image, ImageDraw

MAPS = "/home/hatch/workspace/eidolith/packages/game-data/maps"
OUT = "/home/hatch/workspace/eidolith/apps/game-client/public/assets/maps"
S = 5
GROUND = {1: (105, 168, 79), 2: (95, 156, 71), 3: (160, 130, 86), 4: (63, 127, 196), 5: (134, 188, 94)}

def prop(o, n):
    for p in o.get("properties", []):
        if p["name"] == n:
            return p["value"]

for map_id in ["meadow_village", "whispering_forest"]:
    m = json.load(open(f"{MAPS}/{map_id}.json"))
    w, h = m["width"], m["height"]
    img = Image.new("RGB", (w * S, h * S), (40, 60, 35))
    px = img.load()
    ground = next(l for l in m["layers"] if l["name"] == "ground")["data"]
    for y in range(h):
        for x in range(w):
            c = GROUND.get(ground[y * w + x], (90, 140, 70))
            for dy in range(S):
                for dx in range(S):
                    px[x * S + dx, y * S + dy] = c
    d = ImageDraw.Draw(img)
    objects = next(l for l in m["layers"] if l["name"] == "objects")["objects"]
    for o in objects:
        tx, ty = prop(o, "tileX"), prop(o, "tileY")
        if tx is None:
            continue
        cx, cy = tx * S + S // 2, ty * S + S // 2
        t, name = o["type"], o["name"]
        if t == "prop" and name in ("tree", "pine"):
            d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(38, 84, 44))
        elif t == "prop" and name == "house":
            d.rectangle([tx * S, ty * S, tx * S + 2 * S, ty * S + 2 * S], fill=(138, 90, 51))
        elif t == "npc":
            d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=(240, 240, 230))
        elif t == "portal":
            d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(232, 201, 106), outline=(90, 70, 20))
    img.save(f"{OUT}/minimap-{map_id}.png")
    print("minimap", map_id, img.size)
