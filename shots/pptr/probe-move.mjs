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
await page.type("#f-email", `vs${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Vs" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let ready = false;
for (let i = 0; i < 80 && !ready; i++) {
  ready = await page.evaluate(() => !!(window.__eidolith && window.__eidolith.scene && window.__eidolith.scene.player));
  if (!ready) await sleep(500);
}
console.log("scene ready:", ready);
await page.evaluate(() => window.__eidolith.setWorldMinutes(660));
await sleep(2500);
const sun = await page.evaluate(() => window.__eidolith.getSunState && window.__eidolith.getSunState());
console.log("sun state:", JSON.stringify(sun));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sharp-village.png" });
// movement probe: tap a diagonal target (tile 16,10 from spawn 12,13)
await page.mouse.click(896, 168);
const samples = [];
for (let i = 0; i < 16; i++) {
  const gp = await page.evaluate(() => { const s = window.__eidolith.scene; return { x: +s.gridPos.x.toFixed(2), y: +s.gridPos.y.toFixed(2), path: s.path.length }; });
  samples.push(gp);
  await sleep(120);
}
console.log("samples:", JSON.stringify(samples));
let diag = 0;
for (let i = 1; i < samples.length; i++) {
  if (samples[i].x !== samples[i - 1].x && samples[i].y !== samples[i - 1].y) diag++;
}
console.log("diagonal-motion samples:", diag, "/", samples.length - 1);
await browser.close();
