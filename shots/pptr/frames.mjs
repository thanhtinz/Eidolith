import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"], userDataDir: "/home/hatch/workspace/eidolith/shots/chrome-female" });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.__eidolith?.getPlayerGrid, { timeout: 30000 });
const info = await page.evaluate(() => {
  const tex = window.__eidolith.scene.textures.get("verdant");
  return { frames: Object.keys(tex.frames), src: tex.source[0].image.width + "x" + tex.source[0].image.height };
});
console.log(JSON.stringify(info));
await browser.close();
