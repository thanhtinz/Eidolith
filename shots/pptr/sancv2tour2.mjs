// Quick follow-up shot: sanctuary panel AFTER the collect-all from the
// previous tour (totals cleared, Research Data = 1 in the overview).
import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 160)));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(600); }
  await page.type("#f-email", "tour5@test.dev"); await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit"); console.log("logged in");
}
await sleep(12000);
for (let i = 0; i < 8; i++) {
  const n = await page.evaluate(() => document.querySelectorAll(".pmini").length);
  if (n >= 5) break; await sleep(2500);
}
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const domClick = sel => ev(s => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
await domClick("#hub-navtoggle"); await sleep(700);
await domClick('.hub-nav button[data-tab="sanctuary"]');
for (let i = 0; i < 12; i++) { if (await ev(() => document.querySelectorAll(".s2-b").length >= 3)) break; await sleep(2000); }
await sleep(1500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/sanc-v2-after-collect.png" });
console.log("shot done");
await browser.close();
