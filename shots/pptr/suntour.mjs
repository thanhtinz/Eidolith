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
await page.type("#f-email", `sun${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Sun" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
let hook = false;
for (let i = 0; i < 60 && !hook; i++) { hook = await page.evaluate(() => !!(window.__eidolith && window.__eidolith.setWorldMinutes)); if (!hook) await sleep(500); }
console.log("sun hook ready:", hook);
await sleep(1500);
for (const [mins, tag] of [[480, "0800"], [720, "1200"], [1070, "1750"], [1320, "2200"]]) {
  const st = await page.evaluate((m) => {
    const e = window.__eidolith;
    e.setWorldMinutes(m);
    const s = e.getSunState();
    return { elev: +s.elev.toFixed(3), len: Math.round(s.len), dirX: +s.dirX.toFixed(2), darkness: +s.darkness.toFixed(2), golden: +s.golden.toFixed(2), sunUp: s.sunUp };
  }, mins);
  console.log(tag, JSON.stringify(st));
  await sleep(1400);
  await page.screenshot({ path: `/home/hatch/workspace/eidolith/shots/sun-${tag}.png` });
}
await browser.close();
