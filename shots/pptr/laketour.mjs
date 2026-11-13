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
await page.type("#f-email", `lake${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
console.log("server select:", !!bar);
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
console.log("creation screen:", !!cname);
await page.type("#c-name", "Lake" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
let hook = false;
for (let i = 0; i < 60 && !hook; i++) { hook = await page.evaluate(() => !!(window.__eidolith && window.__eidolith.changeMap)); if (!hook) await sleep(500); }
console.log("world hook ready:", hook);
const ok = await page.evaluate(() => {
  const e = window.__eidolith;
  if (!e || !e.changeMap) return "no hook";
  e.changeMap("crystal_lake", "from_village");
  return "sent";
});
console.log("changeMap:", ok);
await sleep(5000);
const pos = await page.evaluate(() => {
  const e = window.__eidolith;
  return e && e.getPlayerGrid ? JSON.stringify(e.getPlayerGrid()) : "n/a";
});
console.log("player grid at lake:", pos);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/crystal-lake-dock.png" });
// walk up to the south shore in two hops (server-informed)
for (const [x, y] of [[13, 17], [13, 14]]) {
  await page.evaluate(([hx, hy]) => {
    const e = window.__eidolith, s = e.scene;
    s.gridPos = { x: hx, y: hy };
    e.network.send("world.player.move", { x: hx, y: hy });
  }, [x, y]);
  await sleep(1600);
}
const wilds = await page.evaluate(() => {
  const e = window.__eidolith;
  return e && e.getWilds ? e.getWilds().length : -1;
});
console.log("wilds alive at lake:", wilds);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/crystal-lake-shore.png" });
await browser.close();
