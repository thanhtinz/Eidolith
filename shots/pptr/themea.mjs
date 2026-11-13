import puppeteer from "puppeteer-core";
const CHROME = "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome";
const OUT = "/home/hatch/workspace/eidolith/shots";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--use-gl=swiftshader"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle0", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(800); }
  await page.type("#f-email", "p3chrome@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit");
  await sleep(6000);
}
await sleep(5000);
await page.screenshot({ path: `${OUT}/themea-world.png` });
await page.evaluate(() => document.querySelector("#hub-navtoggle")?.click());
await sleep(900);
await page.screenshot({ path: `${OUT}/themea-navopen.png` });
await page.evaluate(() => document.querySelector("[data-tab=eidolons]")?.click());
await sleep(3000);
await page.screenshot({ path: `${OUT}/themea-collection.png` });
await page.evaluate(() => document.querySelector("#hub-navtoggle")?.click());
await sleep(700);
await page.evaluate(() => document.querySelector("[data-tab=menu]")?.click());
await sleep(600);
await page.evaluate(() => document.querySelector("[data-m=summon]")?.click());
await sleep(2500);
await page.screenshot({ path: `${OUT}/themea-summon.png` });
console.log("theme A tour done");
await browser.close();
