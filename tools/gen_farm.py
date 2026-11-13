# Generates Farm Acres (Wave 1 Verdant completion): a working farm
# west of Windmill Fields — tilled plots with crop rows, a thatch
# farmhouse yard, an orchard and a duck pond. Districts (MAP-DESIGN
# §11): entry meadow (east), tilled plots (center-west), farmhouse
# yard (north-west), orchard (south-east), pond corner (south-west).
# Family (§12): planter crops + blossom orchard + house3. Same Tiled
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

random.seed(2024)
W, H = 26, 20
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

# A: entry meadow — flower flecks on the east
for y in range(2, 18):
    for x in range(17, 25):
        if (x * 3 + y * 7) % 6 == 0: g[idx(x, y)] = 5
# B: tilled plots — two big dirt rectangles
for y in range(4, 9):
    for x in range(3, 10): g[idx(x, y)] = 8
for y in range(12, 17):
    for x in range(11, 18): g[idx(x, y)] = 8
# E: duck pond — deep ellipse in the south-west with a sand rim
pond = set()
for y in range(H):
    for x in range(W):
        if ((x - 5) / 2.4) ** 2 + ((y - 16) / 1.7) ** 2 <= 1:
            pond.add((x, y)); g[idx(x, y)] = 4; blocked[idx(x, y)] = True
for (x, y) in list(pond):
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in pond and g[idx(nx, ny)] in (1, 2):
            g[idx(nx, ny)] = 7
# paths: dirt spine from the east gate to the plots, arm north to
# the farmhouse yard
path = set()
for x in range(2, W):
    path.add((x, 10)); path.add((x, 11))
for y in range(3, 11):
    path.add((5, y)); path.add((6, y))
for (x, y) in path:
    if (x, y) not in pond: g[idx(x, y)] = 8

# dressing: crop rows stand IN the tilled plots (planters), the
# farmhouse + well + hive in the yard, goods by the gate
for (x, y, s, sc) in [(4, 5, "planter", "1"), (6, 5, "planter", "1"), (8, 5, "planter", "1"),
                      (5, 7, "planter", "1"), (7, 7, "planter", "1"),
                      (12, 13, "planter", "1"), (14, 13, "planter", "1"), (16, 13, "planter", "1"),
                      (13, 15, "planter", "1"), (15, 15, "planter", "1"),
                      (5, 2, "house3", "0.9"), (9, 2, "well", "1"), (13, 3, "hive", "1"),
                      (23, 9, "crates", "1"), (20, 12, "signpost", "1"), (18, 4, "basket", "1")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

def scatter(tries, x0, x1, y0, y1, sprites):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] == 8: continue
        if max(abs(x - 24), abs(y - 10)) <= 2: continue  # gate clearing
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(14, 17, 24, 12, 18, ["blossom", "blossom", "bush"])  # orchard rows
scatter(10, 1, 15, 17, 18, ["bush", "tree", "rock"])          # south skirts
scatter(8, 18, 24, 1, 5, ["tree", "bush", "blossom"])         # north-east
# edges: hedge bushes + orchard blossom south, trees elsewhere
for x in range(W):
    for y in (0, H - 1):
        if blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        s = "blossom" if (y == H - 1 and x % 3 == 0) else "bush"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
for y in range(H):
    for x in (0, W - 1):
        if (x, y) == (W - 1, 10) or blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1

objects.append(obj(oid, "from_fields", "spawn", 24, 10)); oid += 1
objects.append(obj(oid, "portal_fields", "portal", W - 1, 10, targetMap="windmill_fields", targetSpawn="from_farm")); oid += 1
for (x, y, r) in [(14, 6, 3), (19, 15, 3), (8, 18, 2), (21, 4, 2)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y, radius=r)); oid += 1

with open(f"{OUT}/farm_acres.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"farm_acres: {W}x{H}, {len(objects)} objects")
