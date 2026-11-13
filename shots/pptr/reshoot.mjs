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
await page.type("#f-email", `rs${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Rs" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered:", inWorld);
let hook = false;
for (let i = 0; i < 60 && !hook; i++) { hook = await page.evaluate(() => !!(window.__eidolith && window.__eidolith.changeMap)); if (!hook) await sleep(500); }

async function walkTo(tx, ty) {
  await page.evaluate((tx, ty) => {
    const s = window.__eidolith.scene;
    const cur = { ...s.gridPos };
    const pts = [];
    let x = cur.x, y = cur.y;
    while (x !== tx || y !== ty) {
      if (x < tx) x = Math.min(x + 2, tx); else if (x > tx) x = Math.max(x - 2, tx);
      else if (y < ty) y = Math.min(y + 2, ty); else if (y > ty) y = Math.max(y - 2, ty);
      pts.push({ x, y });
    }
    s.path = pts;
  }, tx, ty);
  for (let i = 0; i < 40; i++) {
    const g = await page.evaluate(() => window.__eidolith.getPlayerGrid());
    if (g.x === tx && g.y === ty) return true;
    await sleep(500);
  }
  return false;
}
async function go(map, spawn, tx, ty, shot) {
  const r = await page.evaluate(async (m, s) => {
    try { await window.__eidolith.changeMap(m, s); return "ok"; } catch (e) { return "err:" + e.message; }
  }, map, spawn);
  await sleep(2000);
  const arrived = await walkTo(tx, ty);
  console.log(map, "->", r, "arrived:", arrived, JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
  await page.evaluate(() => window.__eidolith.setWorldMinutes(600));
  await sleep(600);
  await page.screenshot({ path: `/home/hatch/workspace/eidolith/shots/${shot}` });
}
await go("windmill_fields", "from_village", 15, 13, "fam-fields2.png");
await go("crystal_lake", "from_village", 13, 13, "fam-lake2.png");
await browser.close();
