import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-profile3" });
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1000 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 25000 });
await new Promise(r => setTimeout(r, 800));
const start = await page.evaluate(() => window.__eidolith.getPlayerGrid());
console.log("start:", JSON.stringify(start));
// Use the scene's own tap pipeline: compute screen point of portal tile (0,14) via scene camera.
const pt = await page.evaluate(() => {
  const scene = window.__eidolith.scene;
  const p = scene.worldFromGrid(0, 14);
  const cam = scene.cameras.main;
  const sx = (p.x - cam.scrollX) * cam.zoom + scene.scale.width / 2 - 0; // approx via worldToScreen below
  const v = cam.getWorldPoint(0, 0); void v;
  const rect = document.querySelector("canvas").getBoundingClientRect();
  const screen = { x: rect.x + ((p.x - cam.midPoint.x) * cam.zoom + 360) * (rect.width / 720), y: rect.y + ((p.y - cam.midPoint.y) * cam.zoom + 640) * (rect.height / 1280) };
  return screen;
});
console.log("portal screen pt:", JSON.stringify(pt));
await page.mouse.click(pt.x, pt.y);
await new Promise(r => setTimeout(r, 5000));
const end = await page.evaluate(() => window.__eidolith.getPlayerGrid());
console.log("after walking to portal:", JSON.stringify(end));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/phase2-back-in-village.png" });
await browser.close();
