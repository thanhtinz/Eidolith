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
console.log("form:", !!form);
// switch to register and create a fresh account through the title screen
if (await page.$(".f-tab:not(.on)")) { await page.evaluate(() => document.querySelector(".f-tab:not(.on)").click()); await sleep(600); }
const stamp = Date.now().toString().slice(-6);
await page.type("#f-username", "Title" + stamp);
await page.type("#f-email", `title${stamp}@test.dev`);
await page.type("#f-password", "SecurePass123");
await page.evaluate(() => document.querySelector("#f-submit").click());
// server-select screen: press Start to enter the world
await page.waitForSelector("#srv-start", { timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.querySelector("#srv-start")?.click());

let inWorld = false;
for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
console.log("registered + entered world:", inWorld);
await browser.close();
