# Generates Mist Marsh (Wave 1 Verdant completion): a swamp east of
# Windmill Fields, crossed by a plank causeway over black pools.
# Districts (MAP-DESIGN §11): entry reeds (west), open swamp + pools
# (center), willow fen (east), sunken rune stones (north). Family (§12):
# willow. The causeway (gid 12 over water) is the map's signature path.
# Same Tiled format + helpers.
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

random.seed(818)
W, H = 26, 20
g = [1] * (W * H)
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# swamp body: big mud blobs over the grass
for (cx, cy, rx, ry) in [(13, 10, 8.5, 6.5), (21, 4, 4.5, 3.0), (5, 16, 4.5, 3.0)]:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 and random.random() < 0.8: g[idx(x, y)] = 10
# black pools
pools = [(8, 9, 3.0, 2.0), (19, 7, 2.5, 1.8), (14, 15, 2.2, 1.5)]
for (cx, cy, rx, ry) in pools:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                g[idx(x, y)] = 4; blocked[idx(x, y)] = True
# plank causeway: entry west -> east along y=10 (crosses pool 1), arm
# north at x=17 to the sunken stones. Planks over water are WALKABLE.
cause = set()
for x in range(0, 26): cause.add((x, 10))
for y in range(4, 11): cause.add((17, y))
for (x, y) in cause:
    g[idx(x, y)] = 12; blocked[idx(x, y)] = False
# muddy shores (2026-11-13 rich-surface pass): land next to a pool
# becomes SWAMP mud (gid 10), never beach sand — with the vivid
# surfaces the old sand ring + shallow foam ring read as bright
# tropical lagoons inside a murky marsh. Pools stay pure deep
# water; the melted bake softens the edge on its own.
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] == 1 and any(0 <= x + dx < W and 0 <= y + dy < H and g[idx(x + dx, y + dy)] == 4 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[idx(x, y)] = 10
LAND = (1, 2, 5, 6, 7, 10, 11)

# dressing: sunken runes + a drowned crystal at the north arm's end,
# mushroom rings and stumps in the fen
for (x, y, s, sc) in [(16, 3, "runes", "1"), (18, 3, "runes", "1"), (17, 2, "cluster", "0.8"),
                      (21, 13, "shrooms", "1"), (23, 16, "shrooms", "1"), (5, 6, "stump", "1"), (10, 17, "stump", "1")]:
    blocked[idx(x, y)] = True
    if sc != "1": objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
    else: objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

def scatter(tries, x0, x1, y0, y1, sprites):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in cause or g[idx(x, y)] in (4, 7): continue
        if max(abs(x - 1), abs(y - 10)) <= 2: continue  # entry clearing
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(16, 1, 6, 2, 18, ["bush", "bush", "shrooms"])                 # entry reeds
scatter(24, 18, 24, 10, 18, ["willow", "willow", "shrooms", "bush"])  # willow fen
scatter(16, 6, 24, 1, 6, ["willow", "bush", "rock"])                  # north bank
scatter(12, 4, 16, 13, 18, ["bush", "shrooms", "stump"])              # south swamp
# edges: reeds + bush south, willows north/east, bush west (portal gap)
for i in list(range(W)) + list(range(H)):
    for (x, y) in ([(i, 0), (i, H - 1)] if i < W else []) + ([(0, i), (W - 1, i)] if i < H else []):
        if (x, y) == (0, 10) or blocked[idx(x, y)] or g[idx(x, y)] == 4: continue
        blocked[idx(x, y)] = True
        if y == 0: s = "willow" if i % 3 else "bush"
        elif y == H - 1: s = "bush"
        elif x == W - 1: s = "willow"
        else: s = "bush"
        objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1

objects.append(obj(oid, "from_fields", "spawn", 1, 10)); oid += 1
objects.append(obj(oid, "portal_fields", "portal", 0, 10, targetMap="windmill_fields", targetSpawn="from_marsh")); oid += 1
for (x, y, r) in [(6, 14, 3), (12, 6, 3), (21, 13, 3), (19, 4, 2), (9, 17, 3)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y, radius=r)); oid += 1

with open(f"{OUT}/mist_marsh.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"mist_marsh: {W}x{H}, {len(objects)} objects")
