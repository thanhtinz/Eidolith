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
const seen = new Set();
const t0 = Date.now();
while (Date.now() - t0 < 110000) {
  const skill = await page.evaluate(() => window.__cutin ?? null);
  if (skill && !seen.has(skill)) {
    seen.add(skill);
    const fname = `p4-cutin7-${String(skill).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    await page.screenshot({ path: `${OUT}/${fname}` });
    console.log("captured cut-in:", skill, "->", fname);
    if (["Tidal Wave", "Celestial Veil", "Forest Blessing"].includes(skill)) {
      await sleep(1300);
      await page.screenshot({ path: `${OUT}/p4-cutin7-${String(skill).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-mid.png` });
      console.log("captured mid frame:", skill);
    }
  }
  if (await page.evaluate(() => (() => { const el = document.querySelector("#bt-result"); return !!el && !el.hidden; })())) break;
  await sleep(200);
}
console.log("seen ults:", [...seen].join(", ") || "none");
await browser.close();
