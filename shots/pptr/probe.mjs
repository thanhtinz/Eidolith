import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-profile2" });
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1000 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForSelector("#f-email", { timeout: 15000 });
await page.type("#f-email", "wanderer@test.dev");
await page.type("#f-password", "SecurePass123");
await page.click("#f-submit");
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 20000 });
await new Promise(r => setTimeout(r, 1000));
const info = await page.evaluate(() => {
  const scene = window.__eidolith?.scene;
  if (!scene) return "no scene hook (not logged in)";
  return scene.children.list.filter(o => o.type === "Text").map(o => ({ text: o.text, x: o.x, y: o.y, visible: o.visible, scrollFactorX: o.scrollFactorX, depth: o.depth }));
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
