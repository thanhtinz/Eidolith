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
await page.type("#f-email", `fp${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Fp" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
let hook = false;
for (let i = 0; i < 60 && !hook; i++) { hook = await page.evaluate(() => !!(window.__eidolith && window.__eidolith.changeMap)); if (!hook) await sleep(500); }
await page.evaluate(async () => { await window.__eidolith.changeMap("crystal_lake", "from_village"); });
await sleep(2000);
// walk to the south-shore row (13,13) — a willow stands just south of it
await page.evaluate(() => {
  const s = window.__eidolith.scene;
  const pts = []; let x = s.gridPos.x, y = s.gridPos.y;
  while (x !== 13 || y !== 13) {
    if (y > 13) y = Math.max(y - 2, 13); else if (x < 13) x = Math.min(x + 2, 13); else if (x > 13) x = Math.max(x - 2, 13);
    pts.push({ x, y });
  }
  s.path = pts;
});
for (let i = 0; i < 40; i++) {
  const g = await page.evaluate(() => window.__eidolith.getPlayerGrid());
  if (g.x === 13 && g.y === 13) break;
  await sleep(500);
}
await sleep(1500);
const dump = await page.evaluate(() => {
  const s = window.__eidolith.scene;
  const px = s.player.x, py = s.player.y + 14;
  return s.tallProps
    .map(t => ({ tex: t.img.texture.key, dx: Math.round(t.x - s.player.x), dy: Math.round(t.y - py), alpha: Math.round(t.img.alpha * 100) / 100 }))
    .filter(t => Math.abs(t.dx) < 260 && t.dy > -40 && t.dy < 260);
});
console.log("player at", JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
console.log("nearby tall props:", JSON.stringify(dump, null, 1));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/fade-lake.png" });
await browser.close();
