# Generates the Crystal Lake map (Wave 1, docs/MAP-DESIGN-v1.md applied):
# a lake sub-zone built on the playbook — safe dock landing with ZERO spawns
# (Wild Area entry rule), the lake as a hard water gate, an unreachable island
# landmark as a preview of later traversal, two shore sub-zones with their own
# spawn points, a dark-grass elite shore in the north, a visible-but-locked
# cave mouth (future dungeon: lock seen before key), and a stone return path
# along the west side (the ledge rule: coming back is free).
# Same Tiled format + helpers as tools/gen_maps.py (duplicated on purpose).
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

random.seed(4242)
W, H = 26, 22
g = [1] * (W * H)
blocked = [False] * (W * H)
objects = []; oid = 1
def idx(x, y): return y * W + x

# --- the lake (hard water gate) ---
for y in range(H):
    for x in range(W):
        if ((x - 13) / 8.6) ** 2 + ((y - 7) / 4.8) ** 2 <= 1:
            g[idx(x, y)] = 4; blocked[idx(x, y)] = True
# --- island landmark (preview: unreachable until a traversal ability) ---
for (x, y) in [(12, 6), (13, 6), (12, 7), (13, 7)]:
    g[idx(x, y)] = 7; blocked[idx(x, y)] = False  # sand islet: the crystal grows from a shore, not from lawn in the water
# --- dark-grass elite band on the north shore ---
for x in range(7, 20):
    if g[idx(x, 2)] == 1: g[idx(x, 2)] = 6
for (x, y) in [(21, 3), (22, 3), (21, 4), (20, 3)]:
    if g[idx(x, y)] == 1: g[idx(x, y)] = 6
# --- stone paths: dock plaza, south shore walk, west return, east shore ---
def stone(x, y):
    if 0 <= x < W and 0 <= y < H and g[idx(x, y)] != 4:
        g[idx(x, y)] = 3; blocked[idx(x, y)] = False
for y in range(17, 21):
    for x in range(11, 16): stone(x, y)          # dock plaza (safe zone)
for y in range(14, 17): stone(13, y)             # plaza -> shore link
for x in range(5, 24): stone(x, 13)              # south shore walk
for y in range(13, 20): stone(4, y)              # west return column
for x in range(4, 11): stone(x, 19)              # return -> plaza link
for y in range(5, 14): stone(23, y)              # east shore column
# --- flower meadows (gentle spawn flavour) ---
for (x, y) in [(3, 9), (4, 10), (3, 10), (8, 15), (18, 15), (19, 15), (6, 16)]:
    if g[idx(x, y)] == 1: g[idx(x, y)] = 5
# --- border: trees, south gap at the portal, rock cave mouth in the north ---
border = [(i, 0) for i in range(W)] + [(i, H - 1) for i in range(W)] + \
         [(0, i) for i in range(H)] + [(W - 1, i) for i in range(H)]
for (x, y) in border:
    if (x, y) == (13, H - 1): continue
    if (x, y) == (W - 1, 9): continue  # east gap: Riverbend Village portal
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "tree", "prop", x, y, sprite="tree")); oid += 1
# cave mouth: rocks across the north gap (locked dungeon preview)
for (x, y) in [(12, 0), (13, 0), (14, 0), (12, 1), (14, 1)]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, "rock", "prop", x, y, sprite="rock")); oid += 1
g[idx(13, 1)] = 6
# rune stones flank the cave mouth — the dungeon is signposted, not hidden
for (x, y) in [(11, 1), (15, 1)]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, "runes", "prop", x, y, sprite="runes")); oid += 1
# island props (landmark silhouette)
for (x, y, s) in [(12, 6, "pine"), (13, 6, "pine")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
# the island crystal at 0.7 scale: full size (165px) on a 2x2 islet breaks
# the scale contract (doc §13) — a landmark, not a skyscraper
blocked[idx(13, 7)] = True
objects.append(obj(oid, "cluster", "prop", 13, 7, sprite="cluster", scale="0.7")); oid += 1
# willows lean over the shores — the lake's signature tree (family pass)
for (x, y) in [(3, 13), (24, 11), (8, 18), (18, 17), (10, 3)]:
    if not blocked[idx(x, y)]:
        blocked[idx(x, y)] = True
        objects.append(obj(oid, "willow", "prop", x, y, sprite="willow")); oid += 1
# --- scattered nature (keep paths, plaza, spawn points and shores readable) ---
spawn_points = [(4, 8), (6, 11), (20, 5), (22, 9), (21, 3)]
for _ in range(30):
    x, y = random.randint(1, W - 2), random.randint(1, H - 2)
    if blocked[idx(x, y)] or g[idx(x, y)] in (3, 4): continue
    if max(abs(x - 13), abs(y - 20)) <= 2: continue
    if any(max(abs(x - sx), abs(y - sy)) <= 1 for (sx, sy) in spawn_points): continue
    blocked[idx(x, y)] = True
    sprite = random.choice(["tree", "willow", "rock", "bush", "pine"])
    objects.append(obj(oid, sprite, "prop", x, y, sprite=sprite)); oid += 1
# --- beach (tileset v6): sand ring where land meets water, shallow foam
# ring where water meets land, so the shoreline reads as a real beach ---
def is_water(x, y): return 0 <= x < W and 0 <= y < H and g[idx(x, y)] == 4
def is_land(x, y): return 0 <= x < W and 0 <= y < H and not blocked[idx(x, y)] and g[idx(x, y)] != 4
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] in (1, 5) and any(is_water(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[idx(x, y)] = 7  # sand
for y in range(H):
    for x in range(W):
        if g[idx(x, y)] == 4:
            if is_land(x, y + 1): g[idx(x, y)] = 9       # land south -> foam on the south edges
            elif is_land(x, y - 1): g[idx(x, y)] = 13    # land north -> flipped foam
# fishing pier: two plank cells reaching into the lake from the south shore
for (x, y) in [(13, 10), (13, 11)]:
    g[idx(x, y)] = 12; blocked[idx(x, y)] = False
# --- gameplay objects ---
objects.append(obj(oid, "from_village", "spawn", 13, 20)); oid += 1
objects.append(obj(oid, "portal_village", "portal", 13, H - 1, targetMap="meadow_village", targetSpawn="spawn_player")); oid += 1
# East shore -> Riverbend Village; cave mouth (13,1) -> Lake Cave dungeon.
objects.append(obj(oid, "from_riverbend", "spawn", 24, 9)); oid += 1
objects.append(obj(oid, "portal_riverbend", "portal", W - 1, 9, targetMap="riverbend_village", targetSpawn="from_lake")); oid += 1
objects.append(obj(oid, "from_cave", "spawn", 13, 2)); oid += 1
objects.append(obj(oid, "portal_cave", "portal", 13, 1, targetMap="lake_cave", targetSpawn="from_lake")); oid += 1
# dock dressing
for (x, y, s) in [(11, 17, "signpost"), (15, 18, "crates")]:
    blocked[idx(x, y)] = True
    objects.append(obj(oid, s, "prop", x, y, sprite=s)); oid += 1
for i, (x, y, r) in enumerate([(4, 8, 3), (6, 11, 3), (20, 5, 3), (22, 9, 3), (21, 3, 2)]):
    objects.append(obj(oid, f"wild_spawn_{i+1}", "wild_spawn", x, y, radius=str(r))); oid += 1
json.dump(build(W, H, g, blocked, objects), open(f"{OUT}/crystal_lake.json", "w"), ensure_ascii=False, indent=1)
print("crystal_lake:", W * H, "cells,", sum(blocked), "blocked,", len(objects), "objects")
