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
await page.type("#f-email", `firm${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Firm" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
await sleep(1500);

async function forceNoon() {
  for (let i = 0; i < 24; i++) {
    const st = await page.evaluate(() => { window.__eidolith.setWorldMinutes(660); return window.__eidolith.getSunState(); });
    if (st && st.elev > 0.8) { console.log("sun confirmed:", JSON.stringify(st)); return; }
    await sleep(500);
  }
  console.log("sun NOT confirmed");
}

await page.evaluate(() => window.__eidolith.changeMap("forest_camp", "from_deep"));
await sleep(3000);
await forceNoon();
await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/firm-camp.png" });
console.log("camp shot done");
await page.evaluate(() => window.__eidolith.changeMap("hilltop_shrine", "from_deep"));
await sleep(3000);
await forceNoon();
await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/firm-shrine.png" });
console.log("shrine shot done");
await browser.close();
