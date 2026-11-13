import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
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
await page.type("#f-email", `imp${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Imp" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
await sleep(1500);
const click = sel => page.evaluate(s => document.querySelector(s)?.dispatchEvent(new MouseEvent("click", { bubbles: true })), sel);
// summon one creature with the starter crystal so the arena team exists
// (summon lives in the MENU grid, not the nav tabs)
await click("#hub-navtoggle"); await sleep(400);
await click('.hub-nav button[data-tab="menu"]'); await sleep(600);
await click('button[data-m="summon"]'); await sleep(1800);
await click("#sum-1"); await sleep(3000);
await click("#hub-close"); await sleep(400);
// arena battle
await click("#hub-navtoggle"); await sleep(400);
await click('.hub-nav button[data-tab="menu"]'); await sleep(600);
await click('button[data-m="arena"]');
let active = false;
for (let i = 0; i < 40 && !active; i++) { active = await page.evaluate(() => window.__eidolith.scene.scene.isActive("Battle")); if (!active) await sleep(500); }
console.log("battle active:", active);
await page.evaluate(() => {
  const b = window.__eidolith.scene.scene.get("Battle");
  if (!b.__wrapped) { b.__wrapped = true; b.__impacts = 0; const orig = b.impactFx.bind(b); b.impactFx = (...a) => { b.__impacts++; return orig(...a); }; }
});
let impacts = 0;
for (let i = 0; i < 60 && impacts < 3; i++) { impacts = await page.evaluate(() => window.__eidolith.scene.scene.get("Battle").__impacts ?? 0); if (impacts < 3) await sleep(700); }
console.log("impactFx calls:", impacts);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/vfx-battle.png" });
await browser.close();
