# Generates the Windmill Fields map (Wave 1): the bright open counterpart
# to Whispering Forest — flower meadows, dirt farm paths and plots, a mill
# house on a north hillock, sparse trees. Reached from Meadow Village's
# north road. Same Tiled format + helpers as tools/gen_maps.py.
import json, random
OUT = "/home/hatch/workspace/eidolith/packages/game-data/maps"

def build(w, h, ground, blocked, objects):
    return {
        "type": "map", "orientation": "isometric", "renderorder": "right-down",
        "width": w, "height": h, "tilewidth": 64, "tileheight": 32, "infinite": False,
        "version": "1.10", "tiledversion": "1.10.2", "nextlayerid": 4, "nextobjectid": len(objects) + 1,
        "tilesets": [{"firstgid": 1, "name": "verdant", "tilewidth": 64, "tileheight": 32,
                      "tilecount": 6, "columns": 3, "image": "verdant.png", "imagewidth": 192, "imageheight": 64}],
        "layers": [
            {"id": 1, "name": "ground", "type": "tilelayer", "width": w, "height": h, "data": ground, "opacity": 1, "visible": True, "x": 0, "y": 0},
            {"id": 2, "name": "collision", "type": "tilelayer", "width": w, "height": h, "data": [1 if b else 0 for b in blocked], "opacity": 1, "visible": False, "x": 0, "y": 0},
            {"id": 3, "name": "objects", "type": "objectgroup", "objects": objects, "opacity": 1, "visible": True, "x": 0, "y": 0},
        ],
    }

def obj(i, name, typ, tx, ty, **props):
    return {"id": i, "name": name, "type": typ,
            "x": (tx - ty) * 32, "y": (tx + ty) * 16, "width": 0, "height": 0, "rotation": 0, "visible": True,
            "properties": [{"name": "tileX", "type": "int", "value": tx}, {"name": "tileY", "type": "int", "value": ty}] +
                          [{"name": k, "type": "string", "value": str(v)} for k, v in props.items()]}

random.seed(31337)
W, H = 30, 24
g = [1] * (W * H)
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# --- flower meadows: generous blobs of gid 5 (the fields' signature) ---
for (cx, cy, r) in [(7, 6, 3.4), (23, 5, 3.0), (6, 16, 3.6), (24, 17, 3.2), (15, 17, 2.6), (10, 11, 2.2)]:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / r) ** 2 + ((y - cy) / r) ** 2 <= 1: g[idx(x, y)] = 5
# --- dirt paths (gid 8): south entry -> mill hill, east-west branch ---
for y in range(4, H): g[idx(15, y)] = 8
for y in range(4, H): g[idx(16, y)] = 8
for x in range(0, 27): g[idx(x, 12)] = 8
# --- farm plots: tilled dirt rectangles ---
for y in range(4, 9):
    for x in range(4, 10): g[idx(x, y)] = 8
for y in range(15, 20):
    for x in range(20, 26): g[idx(x, y)] = 8
# --- mill hillock at the north: stone pad + house (the mill) + pines ---
for y in range(1, 5):
    for x in range(13, 19): g[idx(x, y)] = 3
for dy in range(2):
    for dx in range(2): blocked[idx(15 + dx, 2 + dy)] = True
objects.append(obj(oid, "house", "prop", 16, 3, sprite="house")); oid += 1
# --- border: tree ring, south gap at the return portal ---
border = [(i, 0) for i in range(W)] + [(i, H - 1) for i in range(W)] + \
         [(0, i) for i in range(H)] + [(W - 1, i) for i in range(H)]
for (x, y) in border:
    if (x, y) in ((15, H - 1), (16, H - 1), (W - 1, 12), (0, 12)): continue
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
# --- farm dressing: planters in the plots, a training dummy, a beehive
# in the east meadow, a signpost at the crossroads, goods by the mill ---
for (x, y, s) in [(6, 6, "planter"), (22, 17, "planter"), (18, 10, "dummy"),
                  (26, 6, "hive"), (17, 13, "signpost"), (14, 5, "basket"),
                  (12, 8, "blossom"), (19, 14, "blossom"), (8, 21, "blossom")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# --- sparse nature: the fields stay OPEN (contrast with the forest) ---
spawn_points = [(6, 10), (23, 8), (8, 18), (24, 18), (15, 6)]
for _ in range(26):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or g[idx(x, y)] == 8: continue
    if max(abs(x - 15), abs(y - 22)) <= 2: continue
    if any(max(abs(x - sx), abs(y - sy)) <= 1 for (sx, sy) in spawn_points): continue
    blocked[idx(x, y)] = True
    sprite = random.choice(["bush", "bush", "rock", "blossom"])
    # a blossom canopy hard against the dirt road crowds the junction —
    # flowering trees belong in the open meadow, not on the road's edge
    if sprite == "blossom" and any(0 <= x + dx < W and 0 <= y + dy < H and g[idx(x + dx, y + dy)] == 8 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
        sprite = "bush"
    objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
# --- gameplay objects ---
objects.append(obj(oid, "from_village", "spawn", 15, 22)); oid += 1
objects.append(obj(oid, "portal_village", "portal", 15, H - 1, targetMap="meadow_village", targetSpawn="spawn_player")); oid += 1
objects.append(obj(oid, "from_marsh", "spawn", 28, 12)); oid += 1
objects.append(obj(oid, "portal_marsh", "portal", 29, 12, targetMap="mist_marsh", targetSpawn="from_fields")); oid += 1
objects.append(obj(oid, "from_farm", "spawn", 1, 12)); oid += 1
objects.append(obj(oid, "portal_farm", "portal", 0, 12, targetMap="farm_acres", targetSpawn="from_fields")); oid += 1
for i, (x, y, r) in enumerate([(6, 10, 3), (23, 8, 3), (8, 18, 3), (24, 18, 3), (15, 6, 2)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius=str(r))); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/windmill_fields.json", "w"), ensure_ascii=False, indent=1)
print("windmill_fields:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
