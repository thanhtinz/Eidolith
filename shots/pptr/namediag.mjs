// Diagnose the name-label line artifact: dump a label's source canvas 1:1
// and a tight viewport crop of the same label in the live game.
import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 90000 });
// title screen: reveal the login form (tap-to-start)
await page.waitForFunction(() => typeof window.__eidolithStart === "function", { timeout: 30000 }).catch(() => {});
await page.evaluate(() => window.__eidolithStart && window.__eidolithStart());

for (let i = 0; i < 16 && !(await page.$("#f-email")); i++) await sleep(2500);
if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(600); }
await page.type("#f-email", "tour5@test.dev"); await page.type("#f-password", "SecurePass123");
await page.click("#f-submit");
  // server-select screen: press Start to enter the world
  await page.waitForSelector("#srv-start", { timeout: 25000 }).catch(() => {});
  await page.evaluate(() => document.querySelector("#srv-start")?.click());

for (let i = 0; i < 24; i++) { if (await page.evaluate(() => document.querySelectorAll(".pmini").length >= 1)) break; await sleep(2500); }
await sleep(2500);
const info = await page.evaluate(() => {
  const scene = window.__eidolith?.scene;
  if (!scene) return { err: "no scene" };
  const texts = scene.children.list.filter(o => o.type === "Text");
  const kael = texts.find(t => t.text === "Kael");
  const out = { count: texts.length, labels: texts.map(t => t.text) };
  if (kael) {
    out.kael = { x: kael.x, y: kael.y, w: kael.width, h: kael.height, style: { fontFamily: kael.style.fontFamily, fontSize: kael.style.fontSize, bg: kael.style.backgroundColor } };
    const cvs = kael.canvas ?? kael.texture?.getSourceImage?.();
    if (cvs) { out.canvas = { w: cvs.width, h: cvs.height, url: cvs.toDataURL() }; }
    const b = kael.getBounds();
    out.bounds = { x: b.x, y: b.y, w: b.width, h: b.height };
    out.cam = { zoom: scene.cameras.main.zoom, scrollX: scene.cameras.main.scrollX, scrollY: scene.cameras.main.scrollY };
  }
  return out;
});
console.log(JSON.stringify({ ...info, canvas: info.canvas ? { w: info.canvas.w, h: info.canvas.h } : null }, null, 1));
if (info.canvas?.url) {
  const fs = await import("node:fs");
  fs.writeFileSync("/tmp/kael-canvas.png", Buffer.from(info.canvas.url.split(",")[1], "base64"));
  console.log("canvas saved");
}
if (info.bounds) {
  const scale = 1280 / 1280; // canvas is 1280x720 css
  const b = info.bounds;
  const clip = { x: Math.max(0, b.x - 30), y: Math.max(0, b.y - 20), width: b.w + 60, height: b.h + 40 };
  await page.screenshot({ path: "/tmp/kael-view.png", clip });
  console.log("view saved", JSON.stringify(clip));
}
await browser.close();
