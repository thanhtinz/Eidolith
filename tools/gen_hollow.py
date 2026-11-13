# Generates Root Hollow floors 1+2 (Wave 1 Verdant): the dungeon under
# Forest Deep's roots, entered from its new east gate. Identity vs Lake
# Cave (rock + blue pool + crystals): dark MUD earth (gid 10), moss-dark
# patches (gid 2), root pillars (dead trees) instead of rock pillars,
# glow-shroom grottos, and on floor 2 a black SAP pool and the Root
# Heart chamber. Playbook: one mechanic per floor (f1 = descend,
# f2 = the heart), every dead end pays, and a one-way root chute from
# the deepest point back out to Forest Deep. Both floors are caveDark.
# Same Tiled format + helpers as tools/gen_cave.py.
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

# ---------------------------------------------------------------- floor 1
random.seed(1212)
W, H = 24, 20
g = [10] * (W * H)                      # dark mud base
for _ in range(8):                      # moss-dark patches
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 4.0), random.uniform(1.6, 3.0)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 2
for (cx, cy, r) in [(12, 10, 3.2), (21, 4, 2.6), (7, 16, 2.8)]:   # worn rocky chambers
    for y in range(H):
        for x in range(W):
            if ((x - cx) / r) ** 2 + ((y - cy) / r) ** 2 <= 1: g[y * W + x] = 11
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x
# path: west gate -> central chamber -> descent (NE); south arm -> grotto
path = set()
for x in range(0, 22): path.add((x, 10))
for y in range(4, 11): path.add((21, y)); path.add((20, y))
for y in range(10, 17): path.add((7, y))
for x in range(17, 21): path.add((x, 4))
for (x, y) in path: g[idx(x, y)] = 8
# descent chamber floor: worn stone centre
for y in range(H):
    for x in range(W):
        if ((x - 21) / 1.8) ** 2 + ((y - 3) / 1.6) ** 2 <= 1: g[idx(x, y)] = 3
# dressing: root gate pair, descent runes, grotto shrooms, sap clusters
for (x, y, s, sc) in [(2, 8, "dead", "1.15"), (2, 12, "dead", "1.15"),
                      (19, 2, "runes", "1"), (22, 5, "runes", "1"),
                      (5, 15, "shrooms", "1"), (9, 17, "shrooms", "1"), (6, 13, "shrooms", "1"),
                      (16, 15, "cluster", "0.8"), (3, 4, "cluster", "0.7")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
keep = set(path)
for (cx, cy) in [(12, 10), (21, 4), (7, 16)]:
    for y in range(H):
        for x in range(W):
            if abs(x - cx) + abs(y - cy) <= 2: keep.add((x, y))
for _ in range(30):                     # root pillars: dead trunks + rock
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or (x, y) in keep: continue
    if max(abs(x - 1), abs(y - 10)) <= 2: continue
    blocked[idx(x, y)] = True
    s = "dead" if random.random() < 0.62 else "rock"
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
border = [(i, 0) for i in range(W)] + [(i, H - 1) for i in range(W)] + \
         [(0, i) for i in range(H)] + [(W - 1, i) for i in range(H)]
for (x, y) in border:
    if (x, y) == (0, 10): continue
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "dead", "prop", x, y, sprite="dead")); oid += 1
objects.append(obj(oid, "from_deep", "spawn", 1, 10)); oid += 1
objects.append(obj(oid, "portal_deep", "portal", 0, 10, targetMap="forest_deep", targetSpawn="from_hollow")); oid += 1
objects.append(obj(oid, "from_below", "spawn", 20, 4)); oid += 1
objects.append(obj(oid, "portal_down", "portal", 21, 3, targetMap="root_hollow_2", targetSpawn="from_above")); oid += 1
for i, (x, y, r) in enumerate([(6, 6, 3), (13, 13, 3), (18, 8, 3), (9, 16, 2)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius=str(r))); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/root_hollow_1.json", "w"), ensure_ascii=False, indent=1)
print("root_hollow_1:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")

# ---------------------------------------------------------------- floor 2
random.seed(1313)
W, H = 22, 18
g = [11] * (W * H)                      # deep rock base
for _ in range(6):                      # mud veins
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(1.8, 3.4), random.uniform(1.4, 2.6)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 10
blocked = [False] * (W * H)
objects = []; oid = 1
# black sap pool (west): deep cells + mud rim on land neighbours
for y in range(H):
    for x in range(W):
        if ((x - 5) / 2.7) ** 2 + ((y - 11) / 2.1) ** 2 <= 1:
            g[idx(x, y)] = 4; blocked[idx(x, y)] = True
def is_water2(x, y): return 0 <= x < W and 0 <= y < H and g[idx(x, y)] == 4
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] in (11, 10, 8) and any(is_water2(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[idx(x, y)] = 10
# heart chamber (south-centre): worn stone circle
for y in range(H):
    for x in range(W):
        if ((x - 11) / 3.4) ** 2 + ((y - 13) / 2.6) ** 2 <= 1: g[idx(x, y)] = 3
# path: entry (N) -> centre -> heart chamber; east arm -> chute; west spur -> pool rim
path = set()
for y in range(1, 14): path.add((11, y))
for x in range(11, 21): path.add((x, 9))
for x in range(7, 12): path.add((x, 11))
for (x, y) in path:
    if g[idx(x, y)] != 4: g[idx(x, y)] = 8
for y in range(H):                      # heart floor stays stone, path crosses it
    for x in range(W):
        if ((x - 11) / 3.4) ** 2 + ((y - 13) / 2.6) ** 2 <= 1 and g[idx(x, y)] == 8: g[idx(x, y)] = 3
# dressing: the Root Heart (shrine) + rune ring + amber clusters
for (x, y, s, sc) in [(11, 15, "shrine", "1.1"), (9, 13, "runes", "1"), (13, 13, "runes", "1"),
                      (10, 12, "cluster", "0.8"), (12, 12, "cluster", "0.8"),
                      (8, 10, "shrooms", "1"), (15, 5, "shrooms", "1"), (18, 13, "cluster", "0.7")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
keep = set(path)
for (cx, cy) in [(11, 2), (11, 13), (20, 9)]:
    for y in range(H):
        for x in range(W):
            if abs(x - cx) + abs(y - cy) <= 2: keep.add((x, y))
for _ in range(24):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or (x, y) in keep: continue
    blocked[idx(x, y)] = True
    s = "dead" if random.random() < 0.5 else "rock"
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
border = [(i, 0) for i in range(W)] + [(i, H - 1) for i in range(W)] + \
         [(0, i) for i in range(H)] + [(W - 1, i) for i in range(H)]
for (x, y) in border:
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "rock", "prop", x, y, sprite="rock")); oid += 1
objects.append(obj(oid, "from_above", "spawn", 11, 2)); oid += 1
objects.append(obj(oid, "portal_up", "portal", 11, 1, targetMap="root_hollow_1", targetSpawn="from_below")); oid += 1
objects.append(obj(oid, "portal_chute", "portal", 20, 9, targetMap="forest_deep", targetSpawn="from_hollow")); oid += 1
for i, (x, y, r) in enumerate([(5, 12, 3), (16, 13, 3), (11, 7, 2)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius=str(r))); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/root_hollow_2.json", "w"), ensure_ascii=False, indent=1)
print("root_hollow_2:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
