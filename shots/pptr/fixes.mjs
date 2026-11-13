import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1000 });
page.on("console", m => { if (m.type() === "error") console.log("page error:", m.text().slice(0, 140)); });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
console.log("village:", JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/fixes-village-day.png" });
// force night to verify the day/night tint
await page.evaluate(() => { const s = window.__eidolith.scene; s.worldMinutes = 1410; s.applyTint(); });
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/fixes-village-night.png" });
// forest spawn clearing
await page.evaluate(() => { const s = window.__eidolith.scene; s.worldMinutes = 720; s.applyTint(); });
await page.evaluate(() => window.__eidolith.changeMap("whispering_forest", "from_village"));
await page.waitForFunction(() => window.__eidolith.getPlayerGrid()?.mapId === "whispering_forest", { timeout: 20000 });
await new Promise(r => setTimeout(r, 1500));
console.log("forest:", JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/fixes-forest-spawn.png" });
await browser.close();
console.log("done");
