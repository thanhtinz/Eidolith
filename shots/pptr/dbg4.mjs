import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu", "--run-all-compositor-stages-before-draw", "--disable-frame-rate-limit"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
const info = await page.evaluate(() => {
  const s = window.__eidolith.scene;
  const before = { x: s.tintRect.x, y: s.tintRect.y };
  s.update(0, 16);
  const after = { x: s.tintRect.x, y: s.tintRect.y };
  return { before, after, updateSrc: s.update.toString().slice(0, 160) };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
