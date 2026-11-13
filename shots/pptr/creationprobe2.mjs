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
console.log("register has NO username field:", !(await page.$("#f-username")));
const stamp = Date.now().toString().slice(-6);
await page.type("#f-email", `crt${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
console.log("server select:", !!bar);
await page.evaluate(() => document.querySelector("#srv-start")?.click());
// creation gate appears instead of the world
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
console.log("creation screen:", !!cname);
await page.type("#c-name", "Lina" + stamp); const rects = await page.evaluate(() => { const q = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; }; return { panel: q(".eidolith-create"), left: q(".c-left"), right: q(".c-right"), h2: q(".eidolith-create h2"), styles: q("#c-styles"), outfits: q("#c-outfits"), go: q("#c-submit"), bodyH: document.body.getBoundingClientRect().height, scale: window.devicePixelRatio }; }); console.log("RECTS", JSON.stringify(rects)); const cs = await page.evaluate(() => { const e = document.querySelector(".eidolith-create"); const s = getComputedStyle(e); return { display: s.display, flexDirection: s.flexDirection, width: s.width }; }); console.log("CS", JSON.stringify(cs));
// female is default; choose bob hair, blond color, floral outfit
await page.evaluate(() => {
  document.querySelector('#c-styles .c-th[data-v="bob"]')?.click();
});
await sleep(200);
await page.evaluate(() => {
  document.querySelector('#c-colors .c-sw[data-v="blond"]')?.click();
  document.querySelector('#c-outfits .c-th[data-v="floral"]')?.click();
});
await sleep(900);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/creation-live.png" });
await browser.close(); process.exit(0);
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world after creation:", inWorld);
await sleep(2500);
const texKey = await page.evaluate(() => {
  const s = window.__eidolith && window.__eidolith.scene;
  return s && s.playerBody ? s.playerBody.texture.key : "n/a";
});
console.log("player texture:", texKey);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/creation-world.png" });
await browser.close();
