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
  await page.type("#f-email", "tour4@test.dev"); await page.type("#f-password", "SecurePass123");
  await page.click("#f-submit"); console.log("logged in");
}
await sleep(9000);
await page.evaluate(() => { const h = window.__eidolith; if (h) h.scene.scene.send("dummy"); });
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-hud.png" }); console.log("hud shot");
// open nav
const navOpen = await page.evaluate(() => { const t = document.querySelector("#hub-navtoggle"); if (!t) return false; t.click(); return true; });
await sleep(800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-nav.png" }); console.log("nav shot", navOpen);
// click quest tracker -> quest panel
await page.evaluate(() => { document.querySelector("#hub-qtrack")?.click(); });
await sleep(1500);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-quests.png" }); console.log("quests shot");
// close panel, open Eidolons via nav row
await page.evaluate(() => { document.querySelector('.hub-panel .x')?.click(); });
await sleep(500);
await page.evaluate(() => { document.querySelector('.hub-nav button[data-tab="eidolons"]')?.click(); });
await sleep(1800);
await page.screenshot({ path: "/home/hatch/workspace/eidolith/shots/poke-a-eidolons.png" }); console.log("eidolons shot");
await browser.close();
