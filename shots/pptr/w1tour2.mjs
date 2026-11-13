import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MAPDIR = "/home/hatch/workspace/eidolith/packages/game-data/maps";
const grids = {};
function gridOf(mapId) {
  if (grids[mapId]) return grids[mapId];
  const j = JSON.parse(readFileSync(`${MAPDIR}/${mapId}.json`, "utf8"));
  const col = j.layers.find(l => l.name === "collision").data;
  grids[mapId] = { W: j.width, H: j.height, col };
  return grids[mapId];
}
function bfs(mapId, sx, sy, tx, ty) {
  const { W, H, col } = gridOf(mapId);
  const key = (x, y) => y * W + x;
  const prev = new Map(); const q = [[sx, sy]]; const seen = new Set([key(sx, sy)]);
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) {
      const path = []; let cx = x, cy = y;
      while (!(cx === sx && cy === sy)) { path.unshift({ x: cx, y: cy }); const p = prev.get(key(cx, cy)); cx = p[0]; cy = p[1]; }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(key(nx, ny)) || col[key(nx, ny)]) continue;
      seen.add(key(nx, ny)); prev.set(key(nx, ny), [x, y]); q.push([nx, ny]);
    }
  }
  return null;
}

const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => typeof window.__eidolithStart === "function", { timeout: 30000 }).catch(() => {});
await page.evaluate(() => window.__eidolithStart && window.__eidolithStart());
let form = null;
for (let i = 0; i < 40 && !form; i++) { form = await page.$("#f-email"); if (!form) await sleep(250); }
await page.click(".f-tab:not(.on)");
await sleep(600);
const stamp = Date.now().toString().slice(-6);
await page.type("#f-email", `w2${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Wtwo" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
await sleep(1500);

async function mapId() { return page.evaluate(() => window.__eidolith.getPlayerGrid().mapId); }
async function pos() { const p = await page.evaluate(() => window.__eidolith.getPlayerGrid()); return [Math.round(p.x), Math.round(p.y)]; }
async function wilds() { return page.evaluate(() => window.__eidolith.getWilds().length); }

// Walk the REAL A* route (BFS over the map's collision layer) to a
// portal cell, feeding waypoints to the scene a few at a time.
async function walkTo(tx, ty, expectMap) {
  const m0 = await mapId();
  const [sx, sy] = await pos();
  const path = bfs(m0, sx, sy, tx, ty);
  if (!path) { console.log("NO PATH", m0, sx, sy, "->", tx, ty); return m0; }
  let i = 0;
  for (let guard = 0; guard < 240; guard++) {
    if (expectMap && (await mapId()) === expectMap) break;
    const [cx, cy] = await pos();
    // advance only past waypoints the player is standing ON — being
    // merely adjacent to the final (portal) cell must still feed it,
    // or a 1-step path never gets walked at all
    while (i < path.length && path[i].x === cx && path[i].y === cy) i++;
    const chunk = path.slice(Math.min(i, path.length - 1), Math.min(i, path.length - 1) + 4);
    if (!chunk.length) break;
    await page.evaluate(p => { window.__eidolith.scene.path = p; }, chunk);
    await sleep(350);
  }
  for (let k = 0; k < 30 && expectMap && (await mapId()) !== expectMap; k++) await sleep(400);
  return mapId();
}

// reposition to the forest entry (hook), then WALK every new portal
await page.evaluate(() => window.__eidolith.changeMap("whispering_forest", "from_village"));
await sleep(2500);
console.log("at:", await mapId(), await pos());
console.log("deep:", await walkTo(20, 0, "forest_deep"), await pos());
await sleep(1200);
console.log("shrine:", await walkTo(20, 0, "hilltop_shrine"), await pos());
await sleep(1500);
console.log("shrine wilds:", await wilds());
await page.evaluate(() => window.__eidolith.setWorldMinutes(660));
await sleep(600);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/w1-shrine.png" });
console.log("deep again:", await walkTo(11, 17, "forest_deep"), await pos());
await sleep(1200);
console.log("camp:", await walkTo(0, 10, "forest_camp"), await pos());
await sleep(1500);
console.log("camp wilds:", await wilds());
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/w1-camp.png" });
console.log("deep final:", await walkTo(21, 9, "forest_deep"), await pos());
await browser.close();
