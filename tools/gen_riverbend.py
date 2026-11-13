# Generates Riverbend Village (Wave 1): the second settlement — a village
# split by a river, joined by a plank bridge. West bank holds the market
# square (stall, well, board, lanterns), houses line both banks. Reached
# from Crystal Lake's east shore. A safe town: no wild spawns.
# Same Tiled format + helpers as tools/gen_maps.py.
import json, math, random
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

random.seed(5150)
W, H = 28, 22
g = [1] * (W * H)
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x
def river_cx(y): return 14 + round(1.5 * math.sin(y / 3.0))

# --- the river: 3-wide winding water band; plank bridge at y=11 ---
for y in range(H):
    cx = river_cx(y)
    for x in (cx - 1, cx, cx + 1):
        g[idx(x, y)] = 4; blocked[idx(x, y)] = True
for x in (river_cx(11) - 1, river_cx(11), river_cx(11) + 1):
    g[idx(x, 11)] = 12; blocked[idx(x, 11)] = False  # bridge planks
# --- dirt paths: bridge road east-west + one street per bank ---
for x in range(1, W - 1):
    if g[idx(x, 11)] == 1: g[idx(x, 11)] = 8
for y in range(2, H - 2):
    if g[idx(6, y)] == 1: g[idx(6, y)] = 8
    if g[idx(21, y)] == 1: g[idx(21, y)] = 8
# --- west market square (stone) ---
for y in range(9, 14):
    for x in range(4, 9):
        if g[idx(x, y)] == 1: g[idx(x, y)] = 3
# --- flower touches ---
for (x, y) in [(2, 6), (10, 18), (24, 6), (18, 19), (3, 16)]:
    if g[idx(x, y)] == 1: g[idx(x, y)] = 5
# --- houses: 3 west bank, 2 east bank (2x2 footprints) ---
for (hx, hy) in [(3, 3), (9, 4), (2, 17), (19, 3), (23, 15)]:
    for dy in range(2):
        for dx in range(2): blocked[idx(hx + dx, hy + dy)] = True
    objects.append(obj(oid, "house", "prop", hx + 1, hy + 1, sprite="house2", scale="0.78")); oid += 1  # slate roofs + stone walls: Riverbend is not Meadow Village; 0.78 brings the wide cottage to the 2x2 footprint class (doc §13)
# --- dressing: market square life + bridge signposts + east landing ---
for (x, y, s) in [(5, 10, "stall"), (7, 12, "well"), (8, 9, "board"), (4, 13, "lantern"),
                  (11, 10, "signpost"), (16, 12, "signpost"), (18, 11, "crates"),
                  (22, 13, "pots"), (10, 6, "basket"), (20, 18, "lantern"),
                  (11, 6, "willow"), (18, 8, "willow"), (9, 16, "willow"), (20, 17, "willow")]:
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# --- banks: sand where land meets water, foam in the shallows (v6) ---
def is_water(x, y): return 0 <= x < W and 0 <= y < H and g[idx(x, y)] == 4
def is_land(x, y): return 0 <= x < W and 0 <= y < H and not blocked[idx(x, y)] and g[idx(x, y)] != 4
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] in (1, 5) and any(is_water(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[idx(x, y)] = 7
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] == 4:
            if is_land(x, y + 1): g[idx(x, y)] = 9
            elif is_land(x, y - 1): g[idx(x, y)] = 13
# --- border: tree ring, west gap at the lake portal ---
border = [(i, 0) for i in range(W)] + [(i, H - 1) for i in range(W)] + \
         [(0, i) for i in range(H)] + [(W - 1, i) for i in range(H)]
for (x, y) in border:
    if (x, y) == (0, 11): continue
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
# --- sparse nature on the banks ---
for _ in range(18):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or g[idx(x, y)] in (3, 4, 8, 12): continue
    if max(abs(x - 1), abs(y - 11)) <= 2: continue
    blocked[idx(x, y)] = True
    sprite = random.choice(["tree", "bush", "rock", "bush"])
    objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
# --- gameplay objects ---
objects.append(obj(oid, "from_lake", "spawn", 1, 11)); oid += 1
objects.append(obj(oid, "portal_lake", "portal", 0, 11, targetMap="crystal_lake", targetSpawn="from_riverbend")); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/riverbend_village.json", "w"), ensure_ascii=False, indent=1)
print("riverbend_village:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
