# Generates the Lake Cave dungeon (Wave 1): the game's first dungeon,
# entered through the cave mouth on Crystal Lake's north shore (the lock
# players have seen since the lake shipped). Rocky ground, a winding stone
# path, an underground pool, a treasure nook with crystal clusters in the
# east, elite spawns, and permanent gloom (client caveDark flag). One
# mechanic, dead ends that pay — docs/MAP-DESIGN-v1.md dungeon rules.
# Same Tiled format + helpers as tools/gen_maps.py.
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

random.seed(909)
W, H = 24, 18
# cave floor: cracked rock worn smooth in patches — never grass gids
# (gid 6/2 are grass variants and read as lawn inside a cave)
# calm base + worn-stone blobs (square-grid lesson)
g = [11] * (W * H)
for _ in range(7):
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 4.2), random.uniform(1.6, 3.2)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 3
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# --- winding stone path: entry (south) -> pool chamber -> nook / west end ---
path = [(12, 16), (12, 15), (12, 14), (11, 13), (11, 12), (10, 11), (10, 10),
        (11, 9), (12, 8), (13, 8), (14, 7), (15, 7), (16, 7), (17, 6), (18, 5),
        (9, 11), (8, 11), (7, 12), (6, 12), (5, 13), (13, 5), (13, 4)]
for (x, y) in path: g[idx(x, y)] = 3
# --- chambers get worn rock floors ---
for (cx, cy, r) in [(11, 9, 3.4), (19, 4, 2.6), (4, 13, 2.6), (13, 3, 2.4)]:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / r) ** 2 + ((y - cy) / r) ** 2 <= 1 and g[idx(x, y)] == 3:
                g[idx(x, y)] = 11
# --- underground pool (west side of the main chamber) ---
for y in range(H):
    for x in range(W):
        if ((x - 8) / 2.6) ** 2 + ((y - 8) / 1.8) ** 2 <= 1:
            g[idx(x, y)] = 4; blocked[idx(x, y)] = True
def is_water(x, y): return 0 <= x < W and 0 <= y < H and g[idx(x, y)] == 4
def is_land(x, y): return 0 <= x < W and 0 <= y < H and not blocked[idx(x, y)] and g[idx(x, y)] != 4
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] in (11, 3) and any(is_water(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[idx(x, y)] = 7  # pale gravel shore
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] == 4:
            if is_land(x, y + 1): g[idx(x, y)] = 9
            elif is_land(x, y - 1): g[idx(x, y)] = 13
# --- cave dressing: crystals + glow mushrooms + the treasure shrine ---
for (x, y, s) in [(20, 3, "shrine"), (19, 5, "cluster"), (21, 5, "cluster"),
                  (3, 14, "shrooms"), (14, 3, "cluster"), (6, 15, "shrooms"),
                  (17, 10, "cluster"), (2, 4, "shrooms")]:
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# --- rock pillars (keep path, chambers and entry clear) ---
keep = set(path)
for (cx, cy) in [(11, 9), (19, 4), (4, 13), (13, 3)]:
    for y in range(H):
        for x in range(W):
            if abs(x - cx) + abs(y - cy) <= 2: keep.add((x, y))
for _ in range(26):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or (x, y) in keep: continue
    if max(abs(x - 12), abs(y - 16)) <= 2: continue
    blocked[idx(x, y)] = True
    objects.append(obj(oid, "rock", "prop", x, y, sprite="rock")); oid += 1
# --- walls: solid rock border ---
border = [(i, 0) for i in range(W)] + [(i, H - 1) for i in range(W)] + \
         [(0, i) for i in range(H)] + [(W - 1, i) for i in range(H)]
for (x, y) in border:
    if (x, y) == (12, H - 1): continue
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "rock", "prop", x, y, sprite="rock")); oid += 1
# --- gameplay objects ---
objects.append(obj(oid, "from_lake", "spawn", 12, 16)); oid += 1
objects.append(obj(oid, "portal_lake", "portal", 12, H - 1, targetMap="crystal_lake", targetSpawn="from_cave")); oid += 1
for i, (x, y, r) in enumerate([(9, 10, 3), (14, 9, 3), (4, 13, 3), (19, 5, 2), (13, 4, 3)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius=str(r))); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/lake_cave.json", "w"), ensure_ascii=False, indent=1)
print("lake_cave:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
