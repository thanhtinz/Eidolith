# Generates Grove Ruins (Wave 1 Verdant completion): a ruined sanctuary
# east of the Ancient Grove — autumn trees reclaiming a stone court, a
# broken colonnade and a shrine terrace. Districts (MAP-DESIGN §11):
# entry court (west), colonnade (center), shrine terrace (north), autumn
# grove (south). Family (§12): autumn. Same Tiled format + helpers.
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

random.seed(717)
W, H = 24, 20
# calm base + shade blobs (square-grid lesson)
g = [1] * (W * H)
for _ in range(7):
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 4.2), random.uniform(1.6, 3.2)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 2
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# A: entry court — worn stone plaza
for y in range(8, 13):
    for x in range(1, 7): g[idx(x, y)] = 3
# B: colonnade floor — cracked rocky patches
for y in range(6, 14):
    for x in range(9, 17):
        if random.random() < 0.55: g[idx(x, y)] = 11
# C: shrine terrace — stone platform in the north
for y in range(1, 5):
    for x in range(10, 16): g[idx(x, y)] = 3
for (x, y) in [(11, 5), (14, 5), (12, 6), (13, 6)]: g[idx(x, y)] = 5  # flowers at the terrace steps
# path: stone east through the court and colonnade, arm north to the terrace
path = set()
for x in range(0, 18): path.add((x, 10)); path.add((x, 11))
for y in range(5, 11): path.add((12, y)); path.add((13, y))
for (x, y) in path:
    if g[idx(x, y)] != 11: g[idx(x, y)] = 3

# dressing: the shrine (landmark, seen from the court), fallen pillars as
# oversized rocks, rune stones, a crystal grown through the floor
for (x, y, s, sc) in [(12, 2, "shrine", "1.1"), (10, 7, "rock", "1.35"), (14, 12, "rock", "1.3"),
                      (12, 9, "runes", "1"), (15, 7, "cluster", "0.9"), (5, 6, "runes", "1"),
                      (18, 5, "stump", "1"), (6, 15, "shrooms", "1")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

def scatter(tries, x0, x1, y0, y1, sprites):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] in (3, 5): continue
        if max(abs(x - 1), abs(y - 10)) <= 2: continue  # entry clearing
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(26, 1, 22, 14, 18, ["autumn", "autumn", "bush", "tree"])   # autumn grove (south)
scatter(14, 17, 22, 2, 12, ["autumn", "tree", "rock", "bush"])     # east wilds
scatter(10, 1, 8, 1, 6, ["autumn", "bush", "rock"])                # north-west
# edges: rock + autumn north, autumn east/south, sparse west (entry side)
for i in list(range(W)) + list(range(H)):
    for (x, y) in ([(i, 0), (i, H - 1)] if i < W else []) + ([(0, i), (W - 1, i)] if i < H else []):
        if (x, y) == (0, 10) or blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        if y == 0: s = "rock" if i % 3 == 0 else "autumn"
        elif x == 0: s = "bush" if i % 2 else "autumn"
        else: s = "autumn"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

objects.append(obj(oid, "from_grove", "spawn", 1, 10)); oid += 1
objects.append(obj(oid, "portal_grove", "portal", 0, 10, targetMap="ancient_grove", targetSpawn="from_ruins")); oid += 1
for (x, y, r) in [(5, 5, 3), (18, 8, 3), (12, 16, 3), (19, 15, 2), (7, 17, 3)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y, radius=r)); oid += 1

with open(f"{OUT}/grove_ruins.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"grove_ruins: {W}x{H}, {len(objects)} objects")
