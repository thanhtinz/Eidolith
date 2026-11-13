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
# village ground: one calm grass (the bake already varies it per cell
# across 4 frames). The original (x+y)%2 gid 1/2 checkerboard only read
# as texture while gid 2 was a sibling grass tone; with the v7 redraw
# gid 2 is true dark forest grass and the checker screams. Dark grass
# now appears only as soft patches at the shady edges.
g = [1] * (W * H)
for (cx, cy, rx, ry) in [(3, 4, 2.2, 1.8), (20, 19, 2.4, 2.0), (4, 20, 1.8, 1.6), (21, 3, 1.8, 1.6)]:
    for y in range(H):
        for x in range(W):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: g[y * W + x] = 2
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x
# SPACIOUS LAYOUT (Tín's reference, 2026-11-12: a Pokémon-style village —
# wide dirt crossroads, houses far apart on big calm lawns, dressing only
# at the crossing). Streets are DIRT (gid 8), 3 wide, crossing at the
# centre; every portal sits on a street end.
for x in range(W):
    for y in (11, 12, 13): g[idx(x, y)] = 8
for y in range(H):
    for x in (11, 12, 13): g[idx(x, y)] = 8
# flower patches: small accents on the lawns, away from the streets
for (x, y) in [(3, 18), (4, 18), (3, 19), (19, 18), (20, 19), (6, 20), (17, 7), (7, 6)]:
    g[idx(x, y)] = 5
# houses: one per quadrant + the thatch cottage, each with a dirt apron
# on its street-facing side; lawns between houses stay EMPTY
houses = [(3, 3), (18, 3), (3, 17), (18, 17), (9, 18)]
aprons = {(3, 3): [(3, 5), (4, 5)], (18, 3): [(18, 5), (19, 5)],
          (3, 17): [(3, 16), (4, 16)], (18, 17): [(18, 16), (19, 16)],
          (9, 18): [(9, 17), (10, 17)]}
for (hx, hy) in houses:
    for dy in range(2):
        for dx in range(2): blocked[idx(hx + dx, hy + dy)] = True
    for (ax, ay) in aprons[(hx, hy)]: g[idx(ax, ay)] = 8
    hsprite = "house3" if (hx, hy) == (9, 18) else "house"  # one thatch cottage among the tile roofs
    if hsprite == "house3":
        objects.append(obj(oid, "house", "prop", hx + 1, hy + 1, sprite=hsprite, scale="0.8")); oid += 1
    else:
        objects.append(obj(oid, "house", "prop", hx + 1, hy + 1, sprite=hsprite)); oid += 1
# dressing: ONLY at the crossing — well, market stall, the signpost in
# the middle of the cross (as in the reference), two lanterns, one pot
# cluster by the cottage. Nothing scattered on the lawns.
for (x, y, s) in [(15, 10, "well"), (9, 10, "stall"), (13, 13, "signpost"),
                  (10, 13, "lantern"), (13, 10, "lantern"), (11, 17, "pots")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# border trees + scattered trees/rocks/bushes
for i in range(W):
    for (x, y) in [(i, 0), (i, H - 1), (0, i), (W - 1, i)]:
        if (x, y) == (W - 1, 12): continue  # portal gap (forest)
        if (x, y) == (12, H - 1): continue  # portal gap (crystal lake, south)
        if (x, y) == (12, 0): continue      # portal gap (windmill fields, north) — was protected by the old gid-3 street test, now explicit
        if not blocked[idx(x, y)] and g[idx(x, y)] != 3:
            blocked[idx(x, y)] = True
            objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
# NO interior scatter (the reference lawns are empty) — just two lone
# lawn trees, far from streets and houses
for (x, y) in [(6, 9), (16, 6)]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
objects.append(obj(oid, "spawn_player", "spawn", 12, 13)); oid += 1
objects.append(obj(oid, "portal_forest", "portal", W - 1, 12, targetMap="whispering_forest", targetSpawn="from_village")); oid += 1
objects.append(obj(oid, "portal_lake", "portal", 12, H - 1, targetMap="crystal_lake", targetSpawn="from_village")); oid += 1
objects.append(obj(oid, "portal_fields", "portal", 12, 0, targetMap="windmill_fields", targetSpawn="from_village")); oid += 1
objects.append(obj(oid, "Elder Rowan", "npc", 11, 10, role="Trưởng làng")); oid += 1
objects.append(obj(oid, "Mira", "npc", 14, 11, role="Nhà nghiên cứu Resonance")); oid += 1
objects.append(obj(oid, "Kael", "npc", 10, 14, role="Người dẫn đường")); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/meadow_village.json", "w"), ensure_ascii=False, indent=1)
print("meadow_village:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")

# ---------- Whispering Forest 28x28 ----------
random.seed(202)
W = H = 28
# calm base (square-grid lesson): one deep tone + soft shade blobs,
# never per-cell noise — at 64px squares noise reads as a checkerboard
g = [2] * (W * H)
for _ in range(9):
    _cx, _cy = random.randint(2, W - 3), random.randint(2, H - 3)
    _rx, _ry = random.uniform(2.0, 4.2), random.uniform(1.6, 3.2)
    for _y in range(H):
        for _x in range(W):
            if ((_x - _cx) / _rx) ** 2 + ((_y - _cy) / _ry) ** 2 <= 1: g[_y * W + _x] = 6
blocked = [False] * (W * H)
objects = []; oid = 1
# --- Districts (composition v2, docs/MAP-DESIGN-v1.md §11): one uniform
# scatter over one flat ground is exactly why every map read the same.
# The forest is four places now: a bright entry meadow (west), a dark pine
# deep (north), a swampy south mire around the pond, and the flower
# clearing at the grove gate (east). Each gets its own ground + palette. ---
for y in range(10, 20):  # A: entry meadow — bright grass + flower flecks
    for x in range(0, 8):
        g[idx(x, y)] = 5 if (x * 3 + y * 7) % 9 == 0 else 1
for y in range(20, 28):  # C: south mire — swamp patches in the dark grass
    for x in range(W):
        if ((x - 6) / 5.5) ** 2 + ((y - 23) / 3.4) ** 2 <= 1 or ((x - 21) / 4.5) ** 2 + ((y - 24) / 3.0) ** 2 <= 1:
            g[idx(x, y)] = 10
# winding path from (0,14) to clearing (20..24, 10..14)
path = set()
for x in range(W):
    y = 14 + (2 if 8 <= x < 14 else (-2 if 18 <= x < 23 else 0))
    path.add((x, y)); path.add((x, y + 1))
for y in range(10, 15):
    for x in range(20, 25): path.add((x, y))
for (x, y) in path: g[idx(x, y)] = 8  # dirt trail — stone is the towns' surface
for y in range(11, 14):
    for x in range(21, 24): g[idx(x, y)] = 5
# pond
for (x, y) in [(5, 22), (6, 22), (5, 23), (6, 23), (7, 22)]:
    g[idx(x, y)] = 4; blocked[idx(x, y)] = True
# sandy pond shore (v6 beach rule, same as the lake)
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] in (1, 10) and any(0 <= x + dx < W and 0 <= y + dy < H and g[idx(x + dx, y + dy)] == 4 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[idx(x, y)] = 7
# forest dressing: glowing mushrooms by the pond, an old stump, rune
# stones watching the grove clearing — landmarks inside the tree wall
for (x, y, s) in [(5, 20, "shrooms"), (17, 6, "stump"), (19, 9, "runes")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# landmark trees at oversized scale: the ancient at the clearing gate is
# the forest's weenie — visible down the whole east path
for (x, y, s, sc) in [(24, 9, "elder", "1.15"), (6, 4, "pine", "1.45"), (22, 26, "pine", "1.4")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s, scale=sc)); oid += 1
# zoned scatter: density, palette and scale differ per district — the old
# single 150-tree uniform rain is what made the forest one flat texture
def scatter(tries, x0, x1, y0, y1, sprites, big_chance=0.0):
    global oid
    for _ in range(tries):
        x, y = random.randint(x0, x1), random.randint(y0, y1)
        if blocked[idx(x, y)] or (x, y) in path or g[idx(x, y)] in (4, 5): continue
        if max(abs(x - 1), abs(y - 14)) <= 2 or max(abs(x - 26), abs(y - 14)) <= 2: continue
        if 20 <= x <= 24 and 10 <= y <= 14: continue  # the clearing stays OPEN
        blocked[idx(x, y)] = True
        sprite = random.choice(sprites)
        if big_chance and random.random() < big_chance:
            sc = str(round(random.uniform(1.25, 1.5), 2))
            objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite, scale=sc)); oid += 1
        else:
            objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
scatter(70, 0, W - 1, 0, 8, ["pine", "darkwood", "darkwood", "pine"], 0.3)    # pine deep: dense + giants
scatter(50, 8, W - 1, 9, 19, ["darkwood", "tree", "pine", "bush", "rock"], 0.12)  # mid forest
scatter(8, 0, 7, 10, 19, ["tree", "bush", "blossom"])                         # entry meadow stays open
scatter(30, 0, W - 1, 20, H - 1, ["bush", "shrooms", "bush", "rock"])         # south mire
# edges differ per side (Lynch: an edge should read as geography, not a
# wall): giant pines north, hedge + rock south, rock outcrop east
for i in range(W):
    for (x, y) in [(i, 0), (i, H - 1), (0, i), (W - 1, i)]:
        if (x, y) in ((0, 14), (27, 14), (20, 0)) or blocked[idx(x, y)]: continue
        blocked[idx(x, y)] = True
        if y == 0:
            objects.append(obj(oid, "pine", "prop", x, y, sprite="pine", scale="1.45")); oid += 1
        elif y == H - 1:
            s = "bush" if i % 3 else "rock"
            objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
        elif x == W - 1:
            objects.append(obj(oid, "rock", "prop", x, y, sprite="rock")); oid += 1
        else:
            objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
# north trail to the Forest Deep gate: a guaranteed walkable corridor —
# the dense pine-deep scatter would otherwise orphan the portal (the same
# failure that once orphaned the grove). Dirt avenue flanked by the pines.
for y in range(0, 14):
    blocked[idx(20, y)] = False
    g[idx(20, y)] = 8
objects = [o for o in objects if not (o["type"] == "prop"
           and any(p["name"] == "tileX" and p["value"] == 20 for p in o["properties"])
           and any(p["name"] == "tileY" and 0 <= p["value"] <= 13 for p in o["properties"]))]
objects.append(obj(oid, "from_village", "spawn", 1, 14)); oid += 1
objects.append(obj(oid, "portal_village", "portal", 0, 14, targetMap="meadow_village", targetSpawn="spawn_player")); oid += 1
# East edge: Ancient Grove entrance (the grove's return portal targets
# the from_grove spawn — this pair was missing, orphaning the grove).
objects.append(obj(oid, "from_grove", "spawn", 26, 14)); oid += 1
objects.append(obj(oid, "portal_grove", "portal", 27, 14, targetMap="ancient_grove", targetSpawn="from_forest")); oid += 1
objects.append(obj(oid, "from_deep", "spawn", 20, 1)); oid += 1
objects.append(obj(oid, "portal_deep", "portal", 20, 0, targetMap="forest_deep", targetSpawn="from_forest")); oid += 1
for i, (x, y) in enumerate([(8, 6), (12, 20), (17, 8), (22, 12), (15, 24), (25, 20)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius="3")); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/whispering_forest.json", "w"), ensure_ascii=False, indent=1)
print("whispering_forest:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
