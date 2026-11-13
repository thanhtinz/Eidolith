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
await page.type("#f-email", `w1${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Wave" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
await sleep(1500);

async function mapId() { return page.evaluate(() => window.__eidolith.getPlayerGrid().mapId); }
async function hopTo(tx, ty, expectMap) {
  for (let i = 0; i < 80; i++) {
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
    await sleep(300);
  }
  for (let i = 0; i < 30 && expectMap && (await mapId()) !== expectMap; i++) await sleep(400);
  return mapId();
}
async function walkVia(points, expectMap) {
  let m = await mapId();
  for (const [x, y] of points) { m = await hopTo(x, y, expectMap); if (expectMap && m === expectMap) break; }
  return m;
}
async function wilds() { return page.evaluate(() => window.__eidolith.getWilds().length); }

console.log("start:", await mapId());
// village -> fields (north portal)
console.log("fields:", await hopTo(12, 0, "windmill_fields"));
await sleep(1200);
// fields -> farm (west portal, via the crossroads)
console.log("farm:", await walkVia([[15, 12], [0, 12]], "farm_acres"));
await sleep(1500);
console.log("farm wilds:", await wilds());
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/w1-farm.png" });
// farm -> fields (east portal back)
console.log("fields again:", await hopTo(25, 10, "windmill_fields"));
await sleep(1200);
// fields -> village -> forest
console.log("village:", await walkVia([[15, 12], [15, 23]], "meadow_village"));
await sleep(1000);
console.log("forest:", await hopTo(23, 12, "whispering_forest"));
await sleep(1200);
// forest -> deep (north avenue)
console.log("deep:", await walkVia([[20, 14], [20, 0]], "forest_deep"));
await sleep(1200);
// deep -> shrine (north corridor)
console.log("shrine:", await hopTo(20, 0, "hilltop_shrine"));
await sleep(1500);
console.log("shrine wilds:", await wilds());
await page.evaluate(() => window.__eidolith.setWorldMinutes(660));
await sleep(600);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/w1-shrine.png" });
// shrine -> deep (south portal back)
console.log("deep again:", await walkVia([[11, 5], [11, 17]], "forest_deep"));
await sleep(1200);
// deep -> camp (west arm)
console.log("camp:", await walkVia([[20, 8], [13, 8], [13, 10], [0, 10]], "forest_camp"));
await sleep(1500);
console.log("camp wilds:", await wilds());
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/w1-camp.png" });
// camp -> deep (east portal back)
console.log("deep final:", await hopTo(21, 9, "forest_deep"));
const pos = await page.evaluate(() => window.__eidolith.getPlayerGrid());
console.log("final pos:", JSON.stringify(pos));
await browser.close();
