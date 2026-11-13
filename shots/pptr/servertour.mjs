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
await page.type("#f-username", "Server" + stamp);
await page.type("#f-email", `server${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-bar"); if (!bar) await sleep(250); }
console.log("server bar after register:", !!bar, "| name:", await page.evaluate(() => document.querySelector(".srv-name")?.textContent));
// open the cluster/server panel
await page.evaluate(() => document.querySelector("#srv-bar").click());
await sleep(500);
const panelState = await page.evaluate(() => {
  const el = document.querySelector("#srv-panel");
  if (!el) return "missing";
  const cs = getComputedStyle(el);
  return { visibility: cs.visibility, display: cs.display, clusters: document.querySelectorAll(".srv-cluster").length, items: document.querySelectorAll(".srv-item").length };
});
console.log("panel:", JSON.stringify(panelState));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/server-panel.png" });
// pick the server in the panel -> panel closes, bar keeps the name
await page.evaluate(() => document.querySelector(".srv-item")?.click());
await sleep(400);
console.log("bar name after pick:", await page.evaluate(() => document.querySelector(".srv-name")?.textContent));
// start -> loading screen with progress + tip
await page.evaluate(() => document.querySelector("#srv-start")?.click());
await sleep(450);
const loadState = await page.evaluate(() => ({ fill: document.querySelector("#load-fill")?.style.width, tip: document.querySelector("#load-tip")?.textContent }));
console.log("loading:", JSON.stringify(loadState));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/loading-screen.png" });
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world via Start:", inWorld);
await browser.close();
