import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-profile3" });
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1000 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 25000 });
await new Promise(r => setTimeout(r, 800));
console.log("start:", JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
await page.evaluate(() => {
  const scene = window.__eidolith.scene;
  const p = scene.worldFromGrid(0, 14); // portal cell in whispering_forest
  scene.onTap({ id: 99, x: 400, y: 600, positionToCamera: () => ({ x: p.x, y: p.y }) });
});
await new Promise(r => setTimeout(r, 4000));
console.log("after tap on portal cell:", JSON.stringify(await page.evaluate(() => window.__eidolith.getPlayerGrid())));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/phase2-back-in-village.png" });
await browser.close();
