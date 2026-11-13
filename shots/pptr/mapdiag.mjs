import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
page.on("console", m => { const t = m.text(); if (/error|fail|timeout|invalid/i.test(t)) console.log("PAGE:", t.slice(0, 200)); });
page.on("pageerror", e => console.log("PAGEERROR:", String(e).slice(0, 200)));
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => typeof window.__eidolithStart === "function", { timeout: 30000 }).catch(() => {});
await page.evaluate(() => window.__eidolithStart && window.__eidolithStart());
let form = null;
for (let i = 0; i < 40 && !form; i++) { form = await page.$("#f-email"); if (!form) await sleep(250); }
await page.click(".f-tab:not(.on)");
await sleep(600);
const stamp = Date.now().toString().slice(-6);
await page.type("#f-email", `diag${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Diag" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered:", inWorld);
await sleep(1500);
// 1) Direct hook changeMap to grove (server acceptance test)
const r1 = await page.evaluate(async () => {
  const e = window.__eidolith;
  try { await e.changeMap("ancient_grove", "from_forest"); return "resolved"; } catch (err) { return "rejected: " + err.message; }
});
await sleep(2500);
console.log("hook changeMap->grove:", r1, "| map now:", await page.evaluate(() => window.__eidolith.getPlayerGrid()));
// 2) Back to forest via hook, then inspect the portals table the client built
const r2 = await page.evaluate(async () => {
  const e = window.__eidolith;
  try { await e.changeMap("whispering_forest", "from_grove"); return "resolved"; } catch (err) { return "rejected: " + err.message; }
});
await sleep(2500);
const diag = await page.evaluate(() => {
  const s = window.__eidolith.scene;
  return { map: window.__eidolith.getPlayerGrid(), portals: [...s.portals.entries()].map(([k, v]) => k + "->" + v.targetMap + "/" + v.targetSpawn) };
});
console.log("hook changeMap->forest(from_grove):", r2);
console.log("client portals in forest:", JSON.stringify(diag));
await browser.close();
