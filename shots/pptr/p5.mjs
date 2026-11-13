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
  await page.type("#f-email", "tour4@test.dev");
  await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit");
  await sleep(6000);
}
await sleep(3000);
await page.evaluate(() => document.querySelector("#hub-navtoggle")?.click());
await sleep(800);
await page.evaluate(() => document.querySelector("[data-tab=menu]")?.click());
await sleep(900);
await page.evaluate(() => document.querySelector("[data-m=arena]")?.click());
await sleep(4000);
console.log("battle started, watching for cut-ins...");
// Phase 5 tour: battle result rewards -> quest panel -> creature detail
const t0 = Date.now();
let resultShot = false;
while (Date.now() - t0 < 170000) {
  const done = await page.evaluate(() => { const r = document.querySelector("#bt-result"); return r ? !r.hidden : false; });
  if (done) { resultShot = true; break; }
  await sleep(600);
}
console.log("battle result shown:", resultShot);
await sleep(600);
await page.screenshot({ path: `${OUT}/p5-result-rewards.png` });
await page.evaluate(() => { [...document.querySelectorAll("#bt-result button")].find(b => b.textContent.includes("Về thế giới"))?.click(); });
await sleep(3500);
// open nav -> quests
await page.evaluate(() => { document.querySelector(".hub-nav > button, .hub-nav button")?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await sleep(700);
await page.evaluate(() => { document.querySelector('[data-tab="quests"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await sleep(1800);
await page.screenshot({ path: `${OUT}/p5-quests-main.png` });
await page.evaluate(() => { document.querySelector('[data-q="daily"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await sleep(700);
await page.screenshot({ path: `${OUT}/p5-quests-daily.png` });
// eidolons -> detail
await page.evaluate(() => { document.querySelector('[data-tab="eidolons"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await sleep(1800);
await page.evaluate(() => { document.querySelector(".slot[data-inst]")?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await sleep(900);
await page.screenshot({ path: `${OUT}/p5-detail.png` });
console.log("phase5 tour done");
await browser.close();
