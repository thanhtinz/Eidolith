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
await page.type("#f-email", `vfx${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
let bar = null;
for (let i = 0; i < 40 && !bar; i++) { bar = await page.$("#srv-start"); if (!bar) await sleep(250); }
await page.evaluate(() => document.querySelector("#srv-start")?.click());
let cname = null;
for (let i = 0; i < 40 && !cname; i++) { cname = await page.$("#c-name"); if (!cname) await sleep(250); }
await page.type("#c-name", "Vfx" + stamp);
await page.evaluate(() => document.querySelector("#c-submit")?.click());
let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("entered world:", inWorld);
await sleep(1500);
const played = () => page.evaluate(() => Number(window.__sfxPlayed ?? 0));
const fx = () => page.evaluate(() => window.__eidolith.getWeatherFx());
await page.evaluate(() => window.__eidolith.setWorldMinutes(660));

// footsteps: walk east a few cells from spawn
const p0 = await played();
await page.evaluate(() => { const s = window.__eidolith.scene; const g = window.__eidolith.getPlayerGrid(); s.path = [{ x: g.x + 2, y: g.y }, { x: g.x + 4, y: g.y }]; });
await sleep(1600);
console.log("footsteps sfx delta:", (await played()) - p0);

// UI click + panel open
const p1 = await played();
await page.evaluate(() => document.querySelector("#hub-navtoggle")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
await sleep(300);
await page.evaluate(() => document.querySelector('.hub-nav button[data-tab="eidolons"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
await sleep(900);
console.log("ui click+open sfx delta:", (await played()) - p1);
await page.evaluate(() => document.querySelector("#hub-close")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
await sleep(300);

// rain
await page.evaluate(() => window.__eidolith.setWeather("rain"));
await sleep(1800);
console.log("rain fx:", JSON.stringify(await fx()));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/vfx-rain.png" });

// wind
await page.evaluate(() => window.__eidolith.setWeather("wind"));
await sleep(1500);
console.log("wind fx:", JSON.stringify(await fx()));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/vfx-wind.png" });

// fog
await page.evaluate(() => window.__eidolith.setWeather("fog"));
await sleep(1500);
const mists = await page.evaluate(() => window.__eidolith.scene.wxMists.filter(m => m.visible).length);
console.log("fog mists visible:", mists);

// storm: first bolt fires immediately; thunder follows within ~1s
const p2 = await played();
await page.evaluate(() => window.__eidolith.setWeather("storm"));
await sleep(400);
console.log("storm fx:", JSON.stringify(await fx()));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/vfx-storm.png" });
let thundered = false;
for (let i = 0; i < 20 && !thundered; i++) { thundered = (await played()) > p2; if (!thundered) await sleep(400); }
console.log("thunder sfx played:", thundered);
await browser.close();
