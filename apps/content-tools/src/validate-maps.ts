// Map validation — World Part 8 §20.3: tile size, layers, spawn, portal targets, connectivity.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { NavGrid, findPath } from "@eidolith/navigation-core";
import { MAPS } from "@eidolith/game-data";
interface TiledObject { name: string; type: string; properties?: { name: string; value: unknown }[]; }
interface TiledMap { width: number; height: number; tilewidth: number; tileheight: number; layers: { name: string; type: string; data?: number[]; objects?: TiledObject[] }[]; }
const prop = (o: TiledObject, name: string) => o.properties?.find(p => p.name === name)?.value;
const mapsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "packages", "game-data", "maps");
let failed = false;
for (const def of MAPS) {
  const map = JSON.parse(await readFile(join(mapsDir, def.file), "utf8")) as TiledMap;
  const problems: string[] = [];
  if (map.tilewidth !== 64 || map.tileheight !== 32) problems.push(`tile must be 64x32, got ${map.tilewidth}x${map.tileheight}`);
  const ground = map.layers.find(l => l.name === "ground");
  const collision = map.layers.find(l => l.name === "collision");
  const objects = map.layers.find(l => l.name === "objects")?.objects ?? [];
  if (!ground?.data || ground.data.length !== map.width * map.height) problems.push("ground layer missing/wrong size");
  if (!collision?.data) problems.push("collision layer missing");
  const spawns = objects.filter(o => o.type === "spawn");
  if (!spawns.length) problems.push("no spawn point");
  const grid = new NavGrid(map.width, map.height, Uint8Array.from((collision?.data ?? []).map(v => (v ? 1 : 0))));
  for (const portal of objects.filter(o => o.type === "portal")) {
    const target = String(prop(portal, "targetMap"));
    if (!MAPS.some(m => m.id === target)) problems.push(`portal ${portal.name}: unknown targetMap ${target}`);
    const px = Number(prop(portal, "tileX")), py = Number(prop(portal, "tileY"));
    for (const s of spawns) {
      const sx = Number(prop(s, "tileX")), sy = Number(prop(s, "tileY"));
      if (!findPath(grid, { x: sx, y: sy }, { x: px, y: py })) problems.push(`no path spawn(${sx},${sy}) -> portal ${portal.name}(${px},${py})`);
    }
  }
  if (problems.length) { failed = true; console.error(`${def.id}: INVALID`); problems.forEach(p => console.error(" -", p)); }
  else console.log(`${def.id}: OK (${map.width}x${map.height}, ${objects.length} objects, spawn->portal path exists)`);
}
if (failed) process.exit(1);
