import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
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
await page.type("#f-email", `map${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Map" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
await sleep(1500);

async function mapId() { return page.evaluate(() => window.__eidolith.getPlayerGrid().mapId); }
async function hopTo(tx, ty, expectMap) {
  for (let i = 0; i < 60; i++) {
    const done = await page.evaluate((tx, ty) => {
      const s = window.__eidolith.scene;
      const cx = Math.round(s.gridPos.x), cy = Math.round(s.gridPos.y);
      if (cx === tx && cy === ty) return true;
      const nx = cx + Math.max(-2, Math.min(2, tx - cx));
      const ny = cy + Math.max(-2, Math.min(2, ty - cy));
      s.path = [{ x: nx, y: ny }];
      return false;
    }, tx, ty);
    if (done) break;
    if (expectMap && (await mapId()) === expectMap) break;
    await sleep(320);
  }
  for (let i = 0; i < 30 && expectMap && (await mapId()) !== expectMap; i++) await sleep(400);
  return mapId();
}

// Village -> east portal (23,12) -> Whispering Forest
console.log("start map:", await mapId());
console.log("after village portal:", await hopTo(23, 12, "whispering_forest"));
await sleep(1800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/maps-forest.png" });
// Forest -> east portal (27,14) -> Ancient Grove
console.log("after forest east portal:", await hopTo(27, 14, "ancient_grove"));
await sleep(1800);
const wilds = await page.evaluate(() => window.__eidolith.getWilds().length);
console.log("grove wilds alive:", wilds);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/maps-grove.png" });
// Grove -> return portal (0,10) -> back to forest east spawn (26,14)
console.log("after grove return portal:", await hopTo(0, 10, "whispering_forest"));
const pos = await page.evaluate(() => window.__eidolith.getPlayerGrid());
console.log("back in forest at:", JSON.stringify(pos));
await sleep(1500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/maps-forest-east.png" });
await browser.close();
