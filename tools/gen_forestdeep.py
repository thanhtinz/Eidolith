# Generates Forest Deep (Wave 1 Verdant completion): the forest past the
# forest — a dark, dangerous interior reached from Whispering Forest's
# north pines. Districts (MAP-DESIGN §11): entry thicket (south), a hollow
# of DEAD trees (west), a mushroom fen (east), an elite clearing (north)
# under one elder landmark. Family (§12): darkwood + dead. Scale and
# clearance per §13. Same Tiled format + helpers as the other generators.
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

random.seed(606)
W, H = 26, 22
# calm base + shade blobs (square-grid lesson)
g = [2] * (W * H)
for _ in range(9):
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 4.2), random.uniform(1.6, 3.2)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 6
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# B: dead hollow — cracked rocky ground blobs in the west-center
for (cx, cy, rx, ry) in [(6, 9, 4.2, 3.6), (4, 13, 2.6, 2.2)]:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: g[idx(x, y)] = 11
# C: mushroom fen — swamp specks in the east
for y in range(7, 19):
    for x in range(17, 25):
        if ((x - 21) / 4.2) ** 2 + ((y - 12) / 4.6) ** 2 <= 1 and random.random() < 0.65: g[idx(x, y)] = 10
# D: elite clearing — dark flower flecks in the north-center
for y in range(2, 7):
    for x in range(9, 17):
        if ((x - 13) / 4.4) ** 2 + ((y - 4) / 2.8) ** 2 <= 1 and (x * 5 + y * 3) % 4 == 0: g[idx(x, y)] = 5
# path: dirt from the south entry up to the clearing, arms to hollow + fen
path = set()
for y in range(8, 22): path.add((13, y)); path.add((12, y))
for x in range(8, 19): path.add((x, 8))
for x in range(4, 13): path.add((x, 10))
# Wave 1 extensions: west arm to the Forest Camp gate, north corridor
# to the Hilltop Shrine gate (both forced into the path set BEFORE
# scatter runs, so nothing can orphan them)
for x in range(0, 4): path.add((x, 10))
for y in range(0, 9): path.add((20, y))
for x in range(19, 26): path.add((x, 10))   # east arm to the Root Hollow gate
for (x, y) in path: g[idx(x, y)] = 8

# dressing: the elder landmark over the clearing, runes at its gate,
# mushroom rings in the fen, a crystal glinting in the north-east rocks
for (x, y, s, sc) in [(13, 2, "elder", "1.2"), (11, 6, "runes", "1"), (15, 6, "runes", "1"),
                      (19, 10, "shrooms", "1"), (21, 15, "shrooms", "1"), (22, 11, "shrooms", "1"),
                      (7, 16, "stump", "1"), (23, 4, "cluster", "0.8")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

def scatter(tries, x0, x1, y0, y1, sprites, big_chance=0.0):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] == 5: continue
        if max(abs(x - 13), abs(y - 20)) <= 2: continue  # entry clearing
        if 9 <= x <= 16 and 2 <= y <= 6: continue        # elite clearing stays open
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        if big_chance and random.random() < big_chance:
            sc = str(round(random.uniform(1.2, 1.4), 2))
            objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite, scale=sc)); oid += 1
        else:
            objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(34, 1, 11, 4, 15, ["dead", "dead", "rock", "darkwood"], 0.15)   # the hollow
scatter(30, 17, 24, 6, 19, ["darkwood", "shrooms", "bush", "darkwood"], 0.1)  # the fen
scatter(40, 1, 24, 15, 20, ["darkwood", "darkwood", "pine", "bush"], 0.15)    # entry thicket
scatter(22, 1, 24, 1, 7, ["darkwood", "dead", "pine"], 0.2)                   # north band
# edges per side: dead north, pine west, darkwood east, thicket south
# (horizontal edges iterate W, vertical edges iterate H — non-square map)
for i in list(range(W)) + list(range(H)):
    for (x, y) in ([(i, 0), (i, H - 1)] if i < W else []) + ([(0, i), (W - 1, i)] if i < H else []):
        if (x, y) in ((13, H - 1), (20, 0), (0, 10), (W - 1, 10)) or blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        if y == 0: s = "dead"
        elif y == H - 1: s = "bush" if i % 3 else "rock"
        elif x == 0: s = "pine"
        else: s = "darkwood"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

objects.append(obj(oid, "from_forest", "spawn", 13, 20)); oid += 1
objects.append(obj(oid, "portal_forest", "portal", 13, H - 1, targetMap="whispering_forest", targetSpawn="from_deep")); oid += 1
objects.append(obj(oid, "from_shrine", "spawn", 20, 1)); oid += 1
objects.append(obj(oid, "portal_shrine", "portal", 20, 0, targetMap="hilltop_shrine", targetSpawn="from_deep")); oid += 1
objects.append(obj(oid, "from_camp", "spawn", 1, 10)); oid += 1
objects.append(obj(oid, "portal_camp", "portal", 0, 10, targetMap="forest_camp", targetSpawn="from_deep")); oid += 1
objects.append(obj(oid, "from_hollow", "spawn", 24, 10)); oid += 1
objects.append(obj(oid, "portal_hollow", "portal", 25, 10, targetMap="root_hollow_1", targetSpawn="from_deep")); oid += 1
for (x, y, r) in [(6, 9, 3), (20, 12, 3), (13, 4, 2), (8, 17, 3), (21, 18, 3)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y, radius=r)); oid += 1

with open(f"{OUT}/forest_deep.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"forest_deep: {W}x{H}, {len(objects)} objects")
