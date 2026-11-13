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
let beat1 = false, beat2 = 0;
const t0 = Date.now();
while (Date.now() - t0 < 170000) {
  const st = await page.evaluate(() => ({ fx: window.__ultFx ?? null, rel: window.__ultRelease ?? null, sfx: window.__sfxPlayed ?? 0, done: (() => { const r = document.querySelector("#bt-result"); return r ? !r.hidden : false; })() }));
  if (st.fx && !beat1) {
    beat1 = true;
    await page.screenshot({ path: `${OUT}/p4-ultfx-beat1-splash.png` });
    console.log("beat1 splash:", st.fx);
  }
  if (st.rel && beat2 < 2) {
    beat2++;
    await sleep(120);
    await page.screenshot({ path: `${OUT}/p4-ultfx-beat2-release${beat2}.png` });
    console.log("beat2 release:", st.rel, "| sfx played so far:", st.sfx);
    await sleep(900);
  }
  if (st.done) { console.log("battle done; total sfx:", st.sfx); break; }
  await sleep(90);
}
console.log("beat1:", beat1, "beat2 count:", beat2);
await browser.close();
