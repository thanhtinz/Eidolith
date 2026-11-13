import puppeteer from "puppeteer-core";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 200)));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await sleep(5000);
if (await page.$("#f-email")) {
  if (await page.$("#f-username")) { await page.click(".f-tab:not(.on)"); await sleep(600); }
  await page.type("#f-email", "tour5@test.dev"); await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit"); console.log("logged in");
}
await sleep(9000);
console.log("hub:", await page.evaluate(() => !!document.querySelector("#hub-navtoggle")));
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-hud.png" });
await page.evaluate(() => document.querySelector("#hub-navtoggle")?.click());
await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-nav.png" });
await page.evaluate(() => document.querySelector("#hub-qtrack")?.click());
await sleep(1600);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-quests.png" });
await page.evaluate(() => document.querySelector('.hub-panel .x')?.click());
await sleep(500);
await page.evaluate(() => { const n = document.querySelector("#hub-nav"); if (n && !n.classList.contains("open")) document.querySelector("#hub-navtoggle")?.click(); document.querySelector('.hub-nav button[data-tab="eidolons"]')?.click(); });
await sleep(2000);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-eidolons.png" });
await page.evaluate(() => document.querySelector('.slot[data-inst]')?.click());
await sleep(1200);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-detail.png" });
console.log("tour done");
await browser.close();
