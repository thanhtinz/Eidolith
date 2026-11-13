# Generates Forest Camp (Wave 1 Verdant completion): a hunters' camp
# hidden in a clearing west of Forest Deep — a thatch lodge, a
# training ground and stump seats around a stone fire pit.
# Districts (MAP-DESIGN §11): entry clearing (east), camp heart
# (center), darkwood wilds (west/north), mushroom fen corner
# (south-east). Family (§12): darkwood + camp dressing. Same Tiled
# format + helpers.
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

random.seed(9090)
W, H = 22, 18
g = [2] * (W * H)
for _ in range(7):
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 3.8), random.uniform(1.6, 3.0)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 6
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# D: mushroom fen — swamp specks in the south-east corner
for y in range(12, 18):
    for x in range(14, 22):
        if ((x - 18) / 3.6) ** 2 + ((y - 15) / 2.6) ** 2 <= 1 and random.random() < 0.6: g[idx(x, y)] = 10
# A+B: the clearing — packed dirt over the camp heart and the way in
path = set()
for y in range(6, 13):
    for x in range(8, 16): g[idx(x, y)] = 8
for x in range(15, W):
    path.add((x, 9)); path.add((x, 10))
for (x, y) in path: g[idx(x, y)] = 8

# dressing: the lodge, training dummies on the dirt, the fire pit
# (a ring of stump seats around cold stones), crates + lantern +
# signpost where the trail arrives
for (x, y, s, sc) in [(10, 4, "house3", "0.95"), (13, 7, "dummy", "1"), (14, 9, "dummy", "1"),
                      (11, 10, "rock", "0.7"), (10, 9, "stump", "1"), (12, 9, "stump", "1"),
                      (11, 11, "stump", "1"), (9, 12, "crates", "1"), (15, 7, "lantern", "1"),
                      (17, 10, "signpost", "1"), (7, 5, "basket", "1")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

def scatter(tries, x0, x1, y0, y1, sprites):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] == 8: continue
        if max(abs(x - 20), abs(y - 9)) <= 2: continue  # entry clearing
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(26, 1, 7, 1, 16, ["darkwood", "darkwood", "pine", "dead"])  # the wilds (west)
scatter(14, 8, 20, 1, 4, ["darkwood", "pine", "bush"])               # north band
scatter(10, 15, 20, 12, 16, ["shrooms", "bush", "darkwood"])         # fen corner
scatter(8, 1, 7, 12, 16, ["darkwood", "bush", "stump"])              # south-west
# edges: darkwood + pine wall all around, one gap at the east trail
for x in range(W):
    for y in (0, H - 1):
        if blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        s = "darkwood" if x % 3 else "pine"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
for y in range(H):
    for x in (0, W - 1):
        if (x, y) == (W - 1, 9) or blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        s = "darkwood" if y % 3 else "pine"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

objects.append(obj(oid, "from_deep", "spawn", 20, 9)); oid += 1
objects.append(obj(oid, "portal_deep", "portal", W - 1, 9, targetMap="forest_deep", targetSpawn="from_camp")); oid += 1
for (x, y, r) in [(5, 5, 3), (6, 14, 3), (17, 15, 2), (3, 9, 2)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y, radius=r)); oid += 1

with open(f"{OUT}/forest_camp.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"forest_camp: {W}x{H}, {len(objects)} objects")
