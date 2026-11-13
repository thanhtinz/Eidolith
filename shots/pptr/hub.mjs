import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1000, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
try { await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 12000 }); }
catch {
  await page.waitForSelector("#f-email", { timeout: 15000 });
  await page.type("#f-email", "girl@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit");
  await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 30000 });
}
await page.evaluate(() => window.__eidolith.changeMap("meadow_village", "spawn_player"));
await new Promise(r => setTimeout(r, 5000));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/hub-world.png" });
const click = async (tab) => { await page.evaluate((t) => { document.querySelector(`.hub-nav button[data-tab="${t}"]`)?.click(); }, tab); await new Promise(r => setTimeout(r, 1800)); };
await click("eidolons"); await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/hub-eidolons.png" });
await click("quests"); await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/hub-quests.png" });
await click("menu"); await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/hub-menu.png" });
await browser.close();
console.log("hub shots done");
