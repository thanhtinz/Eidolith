# Generates Tiled-format isometric maps (64x32) for Phase 2: meadow_village + whispering_forest.
# Layers: ground (tiles), collision (gid 1 = blocked), objects (spawn/portal/npc/prop/wild_spawn).
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

# ---------- Meadow Village 24x24 ----------
random.seed(101)
W = H = 24
g = [1 if (x + y) % 2 == 0 else 2 for y in range(H) for x in range(W)]
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x
# paths: horizontal road y=12, vertical road x=12, plaza 10..14 x 10..14
for x in range(W): g[idx(x, 12)] = 3
for y in range(H): g[idx(12, y)] = 3
for y in range(10, 15):
    for x in range(10, 15): g[idx(x, y)] = 3
# flower patches
for (x, y) in [(3, 18), (4, 18), (3, 19), (19, 18), (20, 19), (18, 3), (6, 20)]:
    g[idx(x, y)] = 5
# pond
for (x, y) in [(19, 4), (20, 4), (19, 5), (20, 5), (21, 4)]:
    g[idx(x, y)] = 4; blocked[idx(x, y)] = True
# houses: 2x2 footprints
houses = [(4, 4), (8, 3), (15, 4), (4, 15), (16, 15), (9, 18)]
for (hx, hy) in houses:
    for dy in range(2):
        for dx in range(2): blocked[idx(hx + dx, hy + dy)] = True
    objects.append(obj(oid, "house", "prop", hx + 1, hy + 1, sprite="house")); oid += 1
# border trees + scattered trees/rocks/bushes
for i in range(W):
    for (x, y) in [(i, 0), (i, H - 1), (0, i), (W - 1, i)]:
        if (x, y) == (W - 1, 12): continue  # portal gap
        if not blocked[idx(x, y)] and g[idx(x, y)] != 3:
            blocked[idx(x, y)] = True
            objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
for _ in range(26):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or g[idx(x, y)] == 3: continue
    blocked[idx(x, y)] = True
    sprite = random.choice(["tree", "tree", "rock", "bush"])
    objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
objects.append(obj(oid, "spawn_player", "spawn", 12, 13)); oid += 1
objects.append(obj(oid, "portal_forest", "portal", W - 1, 12, targetMap="whispering_forest", targetSpawn="from_village")); oid += 1
objects.append(obj(oid, "Elder Rowan", "npc", 11, 10, role="Trưởng làng")); oid += 1
objects.append(obj(oid, "Mira", "npc", 14, 11, role="Nhà nghiên cứu Resonance")); oid += 1
objects.append(obj(oid, "Kael", "npc", 10, 14, role="Người dẫn đường")); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/meadow_village.json", "w"), ensure_ascii=False, indent=1)
print("meadow_village:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")

# ---------- Whispering Forest 28x28 ----------
random.seed(202)
W = H = 28
g = [6 if random.random() < 0.6 else 2 for _ in range(W * H)]
blocked = [False] * (W * H)
objects = []; oid = 1
# winding path from (0,14) to clearing (20..24, 10..14)
path = set()
for x in range(W):
    y = 14 + (2 if 8 <= x < 14 else (-2 if 18 <= x < 23 else 0))
    path.add((x, y)); path.add((x, y + 1))
for y in range(10, 15):
    for x in range(20, 25): path.add((x, y))
for (x, y) in path: g[idx(x, y)] = 3
for y in range(11, 14):
    for x in range(21, 24): g[idx(x, y)] = 5
# pond
for (x, y) in [(5, 22), (6, 22), (5, 23), (6, 23), (7, 22)]:
    g[idx(x, y)] = 4; blocked[idx(x, y)] = True
# dense trees
for _ in range(150):
    x, y = random.randint(0, W - 1), random.randint(0, H - 1)
    if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] == 4: continue
    blocked[idx(x, y)] = True
    sprite = random.choice(["pine", "pine", "tree", "rock", "bush"])
    objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
objects.append(obj(oid, "from_village", "spawn", 1, 14)); oid += 1
objects.append(obj(oid, "portal_village", "portal", 0, 14, targetMap="meadow_village", targetSpawn="spawn_player")); oid += 1
for i, (x, y) in enumerate([(8, 6), (12, 20), (17, 8), (22, 12), (15, 24), (25, 20)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius="3")); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/whispering_forest.json", "w"), ensure_ascii=False, indent=1)
print("whispering_forest:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
