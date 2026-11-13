import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 90000 });
// title screen first: background + logo + tap hint, and NO form yet
let formEarly = null;
for (let i = 0; i < 40 && formEarly === null; i++) { formEarly = await page.$("#f-email"); if (formEarly === null) await sleep(250); }
const started = await page.evaluate(() => typeof window.__eidolithStart === "function");
console.log("title hook ready:", started, "| form present before tap (must be false):", formEarly !== null);
await sleep(600);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/title-screen-live.png" });
// tap to reveal the form
await page.mouse.click(640, 360);
let form = null;
for (let i = 0; i < 40 && !form; i++) { form = await page.$("#f-email"); if (!form) await sleep(250); }
console.log("form after tap:", !!form);
await sleep(500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/title-form-live.png" });
// log in and enter the world
if (form) {
  if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(400); }
  await page.type("#f-email", "tour5@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit");
  let inWorld = false;
  for (let i = 0; i < 60 && !inWorld; i++) { inWorld = await page.evaluate(() => !!document.querySelector(".pmini")); if (!inWorld) await sleep(500); }
  console.log("entered world:", inWorld);
}
await browser.close();
