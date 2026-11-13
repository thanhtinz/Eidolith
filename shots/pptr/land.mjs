import puppeteer from "puppeteer-core";
const CHROME = "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome";
const OUT = "/home/hatch/workspace/eidolith/shots";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--use-gl=swiftshader"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(800); }
  await page.type("#f-email", "p3chrome@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit");
  await sleep(6000);
}
await sleep(6000);
await page.screenshot({ path: `${OUT}/land-world.png` });
await page.evaluate(() => document.querySelector("[data-tab=eidolons]")?.click());
await sleep(3000);
await page.screenshot({ path: `${OUT}/land-collection.png` });
await page.evaluate(() => document.querySelector("[data-tab=menu]")?.click());
await sleep(1500);
await page.screenshot({ path: `${OUT}/land-menu.png` });
await page.evaluate(() => document.querySelector("[data-tab=world]")?.click());
await sleep(500);
await page.evaluate(() => window.__eidolith.changeMap("whispering_forest", "from_village"));
await sleep(9000);
const wilds = await page.evaluate(() => window.__eidolith.getWilds());
console.log("wilds:", wilds.length);
if (wilds.length) {
  const target = wilds[0];
  for (let i = 0; i < 14; i++) {
    const done = await page.evaluate((t) => {
      const s = window.__eidolith.scene;
      const dx = t.x + 1 - s.gridPos.x, dy = t.y - s.gridPos.y;
      const d = Math.hypot(dx, dy);
      if (d <= 0.6) return true;
      const step = Math.min(3, d);
      s.gridPos.x += (dx / d) * step; s.gridPos.y += (dy / d) * step;
      window.__eidolith.network.send("world.player.move", { x: Math.round(s.gridPos.x * 100) / 100, y: Math.round(s.gridPos.y * 100) / 100 });
      s.update(0, 16);
      return false;
    }, target);
    await sleep(800);
    if (done) break;
  }
  await sleep(2000);
  await page.screenshot({ path: `${OUT}/land-forest.png` });
  await page.evaluate((id) => window.__eidolith.tapWild(id), target.spawnId);
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/land-encounter.png` });
}
console.log("landscape shots done");
await browser.close();
