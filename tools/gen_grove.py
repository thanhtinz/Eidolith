# Generates the Ancient Grove map (Phase 5b): 20x20 isometric, ancient trees,
# a round dirt arena at the center where the Ancient Treant stands, a portal
# back to Whispering Forest on the west edge, elite wild spawns.
# Same Tiled format + helpers as tools/gen_maps.py (duplicated on purpose so
# regenerating the grove never touches the village/forest files).
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

random.seed(777)
W = H = 20
# calm base: deep tone + soft shade blobs (was a literal checker)
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

CX, CY = 10, 10
# dirt arena (radius ~4.5) + entrance path from the west portal — dirt
# (gid 8, tileset v6) so the grove no longer reads as village stone
for y in range(H):
    for x in range(W):
        if ((x - CX) / 4.6) ** 2 + ((y - CY) / 4.6) ** 2 <= 1: g[idx(x, y)] = 8
for x in range(0, 7): g[idx(x, 10)] = 8
# flower patches in the grove shade
for (x, y) in [(3, 5), (16, 15), (5, 16), (15, 4)]:
    g[idx(x, y)] = 5

# border: ancient trees in a checker with low thicket between — a SOLID
# wall of 216px canopies reads as one green mass and swallows the entry;
# alternating heights let the wall breathe (placement rules, doc §13)
for i in range(W):
    for (x, y) in [(i, 0), (i, H - 1), (0, i), (W - 1, i)]:
        if (x, y) in ((0, 10), (19, 10)): continue
        if not blocked[idx(x, y)]:
            blocked[idx(x, y)] = True
            if (x + y) % 2 == 0:
                objects.append(obj(oid, "elder", "prop", x, y, sprite="elder")); oid += 1
            else:
                s = "bush" if i % 2 else "rock"
                objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# grove dressing: a crystal shrine, rune stones and a cluster ring the
# ancient arena — this place is old and sacred, not just another forest
for (x, y, s) in [(4, 4, "shrine"), (15, 4, "runes"), (16, 16, "cluster"), (5, 16, "shrooms")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# scattered trees / rocks / bushes (keep arena, path and spawn clear)
for _ in range(30):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or g[idx(x, y)] == 8: continue
    if abs(x - 1) + abs(y - 10) < 3: continue
    blocked[idx(x, y)] = True
    sprite = random.choice(["tree", "elder", "rock", "bush", "tree"])
    # a tall canopy within 2 tiles of the entry hides the arriving player
    if sprite in ("elder", "tree") and max(abs(x - 1), abs(y - 10)) <= 2:
        sprite = "bush"
    objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
# the Treant's trunk footprint (2x2 north of the arena center)
for (x, y) in [(9, 7), (10, 7), (9, 8), (10, 8)]:
    blocked[idx(x, y)] = True

objects.append(obj(oid, "from_forest", "spawn", 1, 10)); oid += 1
objects.append(obj(oid, "portal_forest", "portal", 0, 10, targetMap="whispering_forest", targetSpawn="from_grove")); oid += 1
objects.append(obj(oid, "from_ruins", "spawn", 18, 10)); oid += 1
objects.append(obj(oid, "portal_ruins", "portal", 19, 10, targetMap="grove_ruins", targetSpawn="from_grove")); oid += 1
objects.append(obj(oid, "Ancient Treant", "boss", 10, 8, bossId="EID-B01")); oid += 1
for (x, y) in [(4, 4), (16, 4), (4, 16), (16, 15)]:
    objects.append(obj(oid, "wild", "wild_spawn", x, y)); oid += 1

with open(f"{OUT}/ancient_grove.json", "w") as f:
    json.dump(build(W, H, g, blocked, objects), f)
print(f"ancient_grove: {W}x{H}, {len(objects)} objects")
