# Generates Hilltop Shrine (Wave 1 Verdant completion): a stone
# pilgrimage terrace above Forest Deep — processional steps climbing
# to a crystal shrine, pine slopes on both flanks. Districts
# (MAP-DESIGN §11): arrival terrace (south), processional steps
# (center), shrine terrace (north), pine slopes (east/west). Family
# (§12): stone + runes + pine. Same Tiled format + helpers.
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

random.seed(424)
W, H = 22, 18
g = [1] * (W * H)
for _ in range(5):
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 3.6), random.uniform(1.6, 2.8)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 2
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# D: pine slopes — dark grass on both flanks
for (cx, cy, rx, ry) in [(3, 8, 2.8, 5.5), (18, 8, 2.8, 5.5)]:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: g[idx(x, y)] = 6
# C: shrine terrace (north) — stone platform with rocky worn corners
for y in range(1, 6):
    for x in range(6, 17): g[idx(x, y)] = 3
for (x, y) in [(6, 1), (16, 1), (6, 5), (16, 5), (7, 1), (15, 5)]:
    if random.random() < 0.8: g[idx(x, y)] = 11
# A: arrival terrace (south)
for y in range(13, 17):
    for x in range(8, 15): g[idx(x, y)] = 3
# B: processional steps — the stone spine, flower flecks along its edge
path = set()
for y in range(5, 17):
    for x in (10, 11, 12): path.add((x, y))
for (x, y) in path: g[idx(x, y)] = 3
for y in range(6, 16):
    for x in (9, 13):
        if (x * 7 + y * 3) % 3 == 0: g[idx(x, y)] = 5

# dressing: the shrine itself (landmark, visible up the steps), its
# rune guards, a crystal grown at the terrace edge, lanterns paired
# down the processional way
for (x, y, s, sc) in [(11, 2, "shrine", "1.25"), (9, 4, "runes", "1"), (13, 4, "runes", "1"),
                      (15, 3, "cluster", "0.8"), (9, 8, "lantern", "1"), (13, 8, "lantern", "1"),
                      (9, 12, "lantern", "1"), (13, 12, "lantern", "1"), (7, 15, "signpost", "1")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

def scatter(tries, x0, x1, y0, y1, sprites):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] in (3, 11): continue
        if max(abs(x - 11), abs(y - 16)) <= 2: continue  # arrival clearing
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(20, 1, 5, 2, 15, ["pine", "pine", "darkwood", "rock"])   # west slope
scatter(20, 17, 20, 2, 15, ["pine", "pine", "darkwood", "rock"])  # east slope
scatter(8, 2, 8, 13, 16, ["bush", "tree", "rock"])                 # south skirts
# edges: bare rock north, pine east/west, low bush south
for x in range(W):
    for y in (0, H - 1):
        if (x, y) == (11, H - 1) or blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        s = "rock" if y == 0 else "bush"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
for y in range(H):
    for x in (0, W - 1):
        if blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "pine", "prop", x, y, sprite="pine")); oid += 1

objects.append(obj(oid, "from_deep", "spawn", 11, 16)); oid += 1
objects.append(obj(oid, "portal_deep", "portal", 11, H - 1, targetMap="forest_deep", targetSpawn="from_shrine")); oid += 1
for (x, y, r) in [(5, 8, 3), (17, 9, 3), (11, 7, 2), (6, 13, 2)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y, radius=r)); oid += 1

with open(f"{OUT}/hilltop_shrine.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"hilltop_shrine: {W}x{H}, {len(objects)} objects")
